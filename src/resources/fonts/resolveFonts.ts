import type { BinaryAssetResolver } from "../assets/types";
import { fetchGoogleFontBinary } from "./googleFonts";
import {
  parseFontkitFace,
  ResolvedFontEngine,
  type ResolvedFontFace,
} from "./fontkitEngine";
import type { FontCatalog, FontTextRequirements } from "./types";

export async function resolveFontEngine(args: {
  catalog: FontCatalog;
  requirements: FontTextRequirements;
  assetResolver?: BinaryAssetResolver;
  fetchImpl?: typeof fetch;
}): Promise<ResolvedFontEngine> {
  const { catalog, requirements, assetResolver, fetchImpl } = args;
  const faces = new Map<string, ResolvedFontFace>();
  const byteCache = new Map<string, Promise<ArrayBuffer>>();

  for (const [fontId, text] of requirements) {
    const descriptor = catalog[fontId];
    if (!descriptor) {
      throw new Error(`Missing font in catalog for fontId: "${fontId}"`);
    }

    let bytesPromise: Promise<ArrayBuffer>;

    if (descriptor.source.type === "google") {
      const cacheKey = `google:${descriptor.family}:${descriptor.weight}:${descriptor.style}:${text}`;
      let cached = byteCache.get(cacheKey);
      if (!cached) {
        cached = fetchGoogleFontBinary(
          {
            family: descriptor.family,
            weight: descriptor.weight,
            style: descriptor.style,
            text,
          },
          fetchImpl,
        );
        byteCache.set(cacheKey, cached);
      }
      bytesPromise = cached;
    } else if (descriptor.source.type === "local") {
      if (!assetResolver) {
        throw new Error(
          `No assetResolver provided to resolve local font "${fontId}" (assetId: "${descriptor.source.assetId}")`,
        );
      }
      const assetId = descriptor.source.assetId;
      const cacheKey = `local:${assetId}`;
      let cached = byteCache.get(cacheKey);
      if (!cached) {
        cached = assetResolver.resolve(assetId).then((a) => a.bytes);
        byteCache.set(cacheKey, cached);
      }
      bytesPromise = cached;
    } else {
      throw new Error(
        `Unknown font source type for fontId "${fontId}": ${(descriptor.source as { type: string }).type}`,
      );
    }

    const bytes = await bytesPromise;
    const face = parseFontkitFace({
      fontId,
      descriptor,
      bytes,
    });
    faces.set(fontId, face);
  }

  return new ResolvedFontEngine(faces);
}
