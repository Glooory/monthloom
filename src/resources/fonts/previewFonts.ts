import type { FontDescriptor } from "../../domain/template/font";
import {
  ResolvedFontEngine,
  parseFontkitFace,
  type ResolvedFontFace,
} from "./fontkitEngine";
import {
  assertFontCharacters,
  resolveFontFace,
  type FontResolutionOptions,
} from "./resolveFonts";

export type FontIssue = {
  fontId: string;
  requested: FontDescriptor;
  actual: FontDescriptor;
  error: Error;
};
export type PreviewFonts = {
  fontEngine: ResolvedFontEngine;
  issues: FontIssue[];
};
let bundledFace: Promise<ResolvedFontFace> | undefined;

export function loadBundledPreviewFace(): Promise<ResolvedFontFace> {
  if (!bundledFace) {
    const pending = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(
          new URL("./bundled/NotoSansSC-Regular.otf", import.meta.url),
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(
            `Bundled preview font could not be loaded: HTTP ${response.status}`,
          );
        return parseFontkitFace({
          fontId: "preview-fallback",
          bytes: await response.arrayBuffer(),
          descriptor: {
            family: "Noto Sans SC (preview)",
            weight: 400,
            style: "normal",
            source: { type: "local", assetId: "bundled-preview-font" },
          },
        });
      } finally {
        clearTimeout(timeout);
      }
    })();
    bundledFace = pending;
    void pending.catch(() => {
      if (bundledFace === pending) bundledFace = undefined;
    });
  }
  return bundledFace;
}

/** Substitution is explicit and preview-only. Strict export never calls this. */
export async function resolvePreviewFontEngine(
  options: FontResolutionOptions & {
    previous?: ResolvedFontEngine | null;
    loadFallback?: () => Promise<ResolvedFontFace>;
  },
): Promise<PreviewFonts> {
  const faces = new Map<string, ResolvedFontFace>();
  const issues: FontIssue[] = [];
  await Promise.all(
    [...options.requirements].map(async ([fontId, text]) => {
      const requested = options.catalog[fontId];
      if (!requested)
        throw new Error(`Missing font in catalog for fontId: "${fontId}"`);
      try {
        const face = await resolveFontFace(requested, text, options);
        faces.set(fontId, { ...face, fontId });
      } catch (error) {
        let replacement = options.previous?.getResolvedFace(fontId);
        if (replacement) {
          try {
            assertFontCharacters(replacement, text);
          } catch {
            replacement = undefined;
          }
        }
        replacement ??= await (
          options.loadFallback ?? loadBundledPreviewFace
        )();
        assertFontCharacters(replacement, text);
        faces.set(fontId, {
          ...replacement,
          fontId,
          requestedDescriptor: requested,
        });
        issues.push({
          fontId,
          requested,
          actual: replacement.descriptor,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }),
  );
  return { fontEngine: new ResolvedFontEngine(faces), issues };
}
