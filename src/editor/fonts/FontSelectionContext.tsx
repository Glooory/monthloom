import { createContext, useEffect, useRef, useState } from "react";
import type { FontDescriptor } from "../../domain/template/font";
import type { Typography } from "../../domain/template/primitives";
import type { BinaryAssetResolver } from "../../resources/assets/types";
import { resolveFontFace } from "../../resources/fonts/resolveFonts";
import { collectFormalExportFontRequirements } from "../../export/formal/fontRequirements";
import { createFormalExportCalendarSet } from "../../export/formal/monthSet";
import { resolveHolidayIndex } from "../../domain/holiday/resolveHolidayIndex";
import { useHolidayLibraryStore } from "../../workspace/state/holidayLibraryStore";
import { useDocumentStore } from "../state/documentStore";
import { useUiStore } from "../state/uiStore";
import { FontSelectionRequest } from "./prepareFontSelection";
import { FontCoverageError } from "../../resources/fonts/fontErrors";

type SelectFont = (descriptor: FontDescriptor, typography: Typography) => void;
export const FontSelectionContext = createContext<{
  select: (
    descriptor: FontDescriptor,
    typography: Typography,
    commit: SelectFont,
  ) => void;
  cancel: () => void;
} | null>(null);

export function usePreparedFontSelection(args: {
  targetYear: number;
  assetResolver: BinaryAssetResolver;
  fetchImpl?: typeof fetch;
}) {
  type Job = {
    descriptor: FontDescriptor;
    typography: Typography;
    commit: SelectFont;
    document: ReturnType<typeof useDocumentStore.getState>["document"];
    semanticId: string | undefined;
  };
  const request = useRef(new FontSelectionRequest());
  const latestYear = useRef(args.targetYear);
  latestYear.current = args.targetYear;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cancel = () => {
    request.current.cancel();
    setJob(null);
    setLoading(false);
    setError(null);
  };
  const selectionId = useUiStore((state) => state.selection?.semanticId);
  useEffect(() => {
    cancel();
  }, [selectionId, args.targetYear]);
  useEffect(
    () =>
      useDocumentStore.subscribe((state, previous) => {
        if (state.document !== previous.document) cancel();
      }),
    [],
  );
  useEffect(() => () => request.current.cancel(), []);
  useEffect(() => useHolidayLibraryStore.subscribe((state, previous) => {
    if (state.snapshot !== previous.snapshot) cancel();
  }), []);

  const run = async (next: Job) => {
    const library = useHolidayLibraryStore.getState().snapshot;
    setJob(next);
    setLoading(true);
    setError(null);
    const isCurrent = () =>
      latestYear.current === args.targetYear &&
      useHolidayLibraryStore.getState().snapshot === library &&
      useDocumentStore.getState().document === next.document &&
      useUiStore.getState().selection?.semanticId === next.semanticId;
    try {
      const applied = await request.current.run({
        isCurrent,
        prepare: async () => {
          const holidayIndex = resolveHolidayIndex({
            library,
            layers: next.document.holidayLayers,
          });
          const calendarSet = createFormalExportCalendarSet({
            targetYear: args.targetYear,
            holidayIndex,
            mainStartOfWeek: next.document.mainTemplate.weekdayRow.startOfWeek,
            miniStartOfWeek: next.document.miniTemplate.weekdayRow.startOfWeek,
          });
          const requirements = collectFormalExportFontRequirements({
            calendarSet,
            mainTemplate: next.document.mainTemplate,
            miniTemplate: next.document.miniTemplate,
            holidayLayers: next.document.holidayLayers,
          });
          // Hidden elements have no current text; validate a small face sample.
          const text =
            requirements.get(next.typography.fontId) ?? "0123456789Aa";
          await resolveFontFace(next.descriptor, text, args);
        },
        commit: () => next.commit(next.descriptor, next.typography),
      });
      if (applied) {
        setJob(null);
        setLoading(false);
      }
    } catch (reason) {
      if (isCurrent()) {
        setError(reason instanceof Error ? reason : new Error(String(reason)));
        setLoading(false);
      }
    }
  };
  return {
    job,
    loading,
    error,
    coverageError: error instanceof FontCoverageError ? error : null,
    cancel,
    retry: () => {
      if (job) void run(job);
    },
    select: (
      descriptor: FontDescriptor,
      typography: Typography,
      commit: SelectFont,
    ) => {
      void run({
        descriptor,
        typography,
        commit,
        document: useDocumentStore.getState().document,
        semanticId: useUiStore.getState().selection?.semanticId,
      });
    },
  };
}
