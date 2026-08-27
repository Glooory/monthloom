import { useState, useEffect, useRef } from "react";
import type { CalendarMonth } from "../../domain/calendar/types";
import type { EditorDocument } from "../model/types";
import type { BinaryAssetResolver } from "../../resources/assets/types";
import {
  collectMainFontText,
  collectMiniFontText,
  mergeFontTextRequirements,
} from "../../resources/fonts/textRequirements";
import { resolveFontEngine } from "../../resources/fonts/resolveFonts";
import type { ResolvedFontEngine } from "../../resources/fonts/fontkitEngine";

export type EditorFontEngineState = {
  fontEngine: ResolvedFontEngine | null;
  loading: boolean;
  error: Error | null;
};

export function computeFontRequirementKey(args: {
  calendar: CalendarMonth;
  document: EditorDocument;
}): { key: string; requirements: ReturnType<typeof mergeFontTextRequirements> } {
  const { calendar, document } = args;
  const mainReq = collectMainFontText({ calendar, template: document.mainTemplate });
  const miniReq = collectMiniFontText({ calendar, template: document.miniTemplate });
  const requirements = mergeFontTextRequirements([mainReq, miniReq]);

  const parts: string[] = [];
  for (const [fontId, chars] of requirements) {
    const desc = document.fontCatalog[fontId];
    const sourceKey =
      desc?.source.type === "local" ? desc.source.assetId : (desc?.source.family ?? "");
    parts.push(
      `${fontId}=${chars}@${desc?.family ?? ""}:${desc?.weight ?? 0}:${desc?.style ?? ""}:${sourceKey}`,
    );
  }
  parts.sort();

  return {
    key: parts.join(";"),
    requirements,
  };
}

export function useEditorFontEngine(args: {
  calendar: CalendarMonth;
  document: EditorDocument;
  assetResolver: BinaryAssetResolver;
  fetchImpl?: typeof fetch;
}): EditorFontEngineState {
  const { calendar, document, assetResolver, fetchImpl } = args;

  const [state, setState] = useState<EditorFontEngineState>({
    fontEngine: null,
    loading: true,
    error: null,
  });

  const currentKeyRef = useRef<string>("");

  useEffect(() => {
    const { key, requirements } = computeFontRequirementKey({
      calendar,
      document,
    });

    if (key === currentKeyRef.current && state.fontEngine) {
      return;
    }

    let isMounted = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    resolveFontEngine({
      catalog: document.fontCatalog,
      requirements,
      assetResolver,
      fetchImpl,
    })
      .then((engine) => {
        if (!isMounted) return;
        currentKeyRef.current = key;
        setState({
          fontEngine: engine,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setState({
          fontEngine: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return () => {
      isMounted = false;
    };
  }, [
    calendar,
    document.fontCatalog,
    document.mainTemplate.date.typography.fontId,
    document.mainTemplate.weekdayRow.weekday.typography.fontId,
    document.mainTemplate.chinaHolidayName.typography.fontId,
    document.mainTemplate.japanHolidayName.typography.fontId,
    document.mainTemplate.chinaMarkers,
    document.miniTemplate.monthRow.label.typography.fontId,
    document.miniTemplate.weekdayRow.weekday.typography.fontId,
    document.miniTemplate.date.typography.fontId,
    assetResolver,
    fetchImpl,
  ]);

  return state;
}
