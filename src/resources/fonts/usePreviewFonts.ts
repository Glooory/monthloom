import { useMemo, useRef } from "react";
import { usePreviewResource } from "../../shared/react/usePreviewResource";
import {
  fontRequirementsKey,
  type FontResolutionOptions,
} from "./resolveFonts";
import { resolvePreviewFontEngine, type PreviewFonts } from "./previewFonts";
import { ResolvedFontEngine, type ResolvedFontFace } from "./fontkitEngine";

export function usePreviewFonts(options: FontResolutionOptions) {
  const key = fontRequirementsKey(options.catalog, options.requirements);
  const resourceKey = useMemo(
    () => ({ key, resolver: options.assetResolver, fetch: options.fetchImpl }),
    [key, options.assetResolver, options.fetchImpl],
  );
  const previous = useRef<PreviewFonts | null>(null);
  const previousFaces = useRef(new Map<string, ResolvedFontFace>());
  const resource = usePreviewResource({
    resourceKey,
    retainPrevious: false,
    load: async () => {
      const result = await resolvePreviewFontEngine({
        ...options,
        previous: previous.current?.fontEngine,
      });
      return result;
    },
  });
  // Only accepted completions may become the fallback for a subsequent request.
  if (resource.value) {
    for (const id of options.requirements.keys()) {
      const face = resource.value.fontEngine.getResolvedFace(id);
      if (face) previousFaces.current.set(id, face);
    }
    previous.current = {
      ...resource.value,
      fontEngine: new ResolvedFontEngine(new Map(previousFaces.current)),
    };
  }
  return {
    fontEngine: resource.value?.fontEngine ?? null,
    issues: resource.value?.issues ?? [],
    loading: resource.loading,
    error: resource.error,
    retry: resource.retry,
  };
}
