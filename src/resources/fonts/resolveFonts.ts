import type { BinaryAssetResolver } from "../assets/types";
import type { FontDescriptor } from "../../domain/template/font";
import { fetchGoogleFontBinary } from "./googleFonts";
import {
  parseFontkitFace,
  ResolvedFontEngine,
  type ResolvedFontFace,
} from "./fontkitEngine";
import type { FontCatalog, FontTextRequirements } from "./types";
import { persistentFontCache, type PersistentFontCache } from "./fontCache";
import { FontCoverageError } from "./fontErrors";

export type FontResolutionOptions = {
  catalog: FontCatalog;
  requirements: FontTextRequirements;
  assetResolver?: BinaryAssetResolver;
  fetchImpl?: typeof fetch;
  fontCache?: PersistentFontCache;
};

// Cache parsed faces across editor, gallery, selection preparation and export.
// Dependency identities prevent custom resolvers/fetchers from sharing resources.
const identities = new WeakMap<object, number>();
let nextIdentity = 0;
function identity(value: object | undefined): number {
  if (!value) return 0;
  let id = identities.get(value);
  if (!id) identities.set(value, (id = ++nextIdentity));
  return id;
}
const faces = new Map<
  string,
  { text: string; face: Promise<ResolvedFontFace> }
>();

export function canonicalFontText(text: string): string {
  return [...new Set(Array.from(text))].sort().join("");
}

export function fontRequirementsKey(
  catalog: FontCatalog,
  requirements: FontTextRequirements,
): string {
  return JSON.stringify(
    [...requirements]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, text]) => [id, catalog[id], canonicalFontText(text)]),
  );
}

export function assertFontCharacters(
  face: ResolvedFontFace,
  text: string,
): void {
  const font = face.internalFont as {
    hasGlyphForCodePoint?: (code: number) => boolean;
  };
  if (!font.hasGlyphForCodePoint) return;
  const missing = Array.from(canonicalFontText(text)).filter(
    (char) =>
      !/[\s\p{Cf}]/u.test(char) &&
      !font.hasGlyphForCodePoint!(char.codePointAt(0)!),
  );
  if (missing.length) {
    throw new FontCoverageError(face.descriptor.family, missing.slice(0, 12).join(""));
  }
}

export async function resolveFontFace(
  descriptor: FontDescriptor,
  text: string,
  options: Omit<FontResolutionOptions, "catalog" | "requirements">,
): Promise<ResolvedFontFace> {
  const {
    assetResolver,
    fetchImpl = globalThis.fetch,
    fontCache = persistentFontCache,
  } = options;
  const characters = canonicalFontText(text);
  const resourceKey = JSON.stringify([
    descriptor,
    identity(fontCache),
    descriptor.source.type === "local"
      ? identity(assetResolver)
      : identity(fetchImpl),
  ]);
  // A resolved larger subset also satisfies smaller requests for the same face.
  for (const [key, entry] of faces) {
    if (
      key.startsWith(`${resourceKey}:`) &&
      Array.from(characters).every((char) => entry.text.includes(char))
    ) {
      return entry.face;
    }
  }
  const key = `${resourceKey}:${characters}`;
  const promise = (async () => {
    if (descriptor.source.type === "local") {
      if (!assetResolver)
        throw new Error(
          'No assetResolver provided to resolve local font "' +
            descriptor.family +
            '"',
        );
      const asset = await assetResolver.resolve(descriptor.source.assetId);
      const face = parseFontkitFace({
        fontId: descriptor.family,
        descriptor,
        bytes: asset.bytes,
      });
      assertFontCharacters(face, characters);
      return face;
    }
    const cacheKey = `google:${descriptor.family}:${descriptor.weight}:${descriptor.style}:${characters}`;
    const cached = await fontCache.get(cacheKey);
    if (cached) {
      try {
        const face = parseFontkitFace({
          fontId: descriptor.family,
          descriptor,
          bytes: cached,
        });
        assertFontCharacters(face, characters);
        return face;
      } catch {
        // Invalid persistent bytes must not poison every future retry.
        await fontCache.delete(cacheKey);
      }
    }
    const bytes = await fetchGoogleFontBinary(
      { ...descriptor, text: characters },
      fetchImpl,
    );
    const face = parseFontkitFace({
      fontId: descriptor.family,
      descriptor,
      bytes,
    });
    assertFontCharacters(face, characters);
    await fontCache.set(cacheKey, { ...descriptor, format: "sfnt" }, bytes);
    return face;
  })();
  faces.set(key, { text: characters, face: promise });
  // Bound memory use while retaining useful prepared subsets.
  if (faces.size > 64) faces.delete(faces.keys().next().value!);
  void promise.catch(() => {
    if (faces.get(key)?.face === promise) faces.delete(key);
  });
  return promise;
}

export async function resolveFontEngine(
  options: FontResolutionOptions,
): Promise<ResolvedFontEngine> {
  const resolved = new Map<string, ResolvedFontFace>();
  // Merge requirements for elements sharing a concrete face into one download.
  const groups = new Map<
    string,
    { descriptor: FontDescriptor; text: string; ids: string[] }
  >();
  for (const [fontId, text] of options.requirements) {
    const descriptor = options.catalog[fontId];
    if (!descriptor)
      throw new Error(`Missing font in catalog for fontId: "${fontId}"`);
    if (descriptor.source.type === "local" && !options.assetResolver) {
      throw new Error(
        `No assetResolver provided to resolve local font "${fontId}"`,
      );
    }
    const key = JSON.stringify(descriptor);
    const group = groups.get(key) ?? { descriptor, text: "", ids: [] };
    group.text += text;
    group.ids.push(fontId);
    groups.set(key, group);
  }
  const results = await Promise.allSettled(
    [...groups.values()].map(async ({ descriptor, text, ids }) => {
      const face = await resolveFontFace(descriptor, text, options);
      for (const fontId of ids) resolved.set(fontId, { ...face, fontId });
    }),
  );
  const errors = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          `${[...groups.values()][index].descriptor.family}: ${String(result.reason)}`,
        ]
      : [],
  );
  if (errors.length)
    throw new Error(`Failed to resolve fonts: ${errors.join("; ")}`);
  return new ResolvedFontEngine(resolved);
}
