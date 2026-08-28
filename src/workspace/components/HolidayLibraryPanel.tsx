import React, { useMemo, useState } from "react";
import { getUncoveredCalendarRanges } from "../../domain/holiday/coverage";
import {
  resolveEffectiveRecords,
  resolveManagementRecords,
} from "../../domain/holiday/effectiveRecords";
import { serializeMonthloomHolidayJson } from "../../domain/holiday/monthloomJson";
import {
  BUILTIN_CHINA_CALENDAR_ID,
  type ManagementHolidayRecord,
} from "../../domain/holiday/types";
import type { DateRange } from "../../domain/date/types";
import type { EditorDocument } from "../../editor/model/types";
import { db } from "../../persistence/db/monthloomDb";
import type { HolidayLibraryRepository } from "../../persistence/db/holidayLibraryRepository";
import { useI18n } from "../../shared/i18n/i18nStore";
import {
  HolidayLibraryOperations,
  type PreparedHolidayUpdate,
} from "../holiday/holidayLibraryOperations";
import { useHolidayLibraryStore } from "../state/holidayLibraryStore";
import { HolidayCalendarDetail } from "./HolidayCalendarDetail";
import { HolidayCalendarList } from "./HolidayCalendarList";
import { HolidayRecordDialog } from "./HolidayRecordDialog";
import "./holiday-library.css";

export type HolidayLibraryPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  targetYear: number;
  activeDocument?: EditorDocument;
  repository?: HolidayLibraryRepository;
};

export const HolidayLibraryPanel: React.FC<HolidayLibraryPanelProps> = ({
  isOpen,
  onClose,
  targetYear: initialTargetYear,
  activeDocument,
  repository,
}) => {
  const { t } = useI18n();
  const { snapshot, refresh } = useHolidayLibraryStore();
  const ops = useMemo(
    () =>
      new HolidayLibraryOperations(
        repository ? (repository as any).db : db,
      ),
    [repository],
  );

  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(
    BUILTIN_CHINA_CALENDAR_ID,
  );
  const [selectedYear, setSelectedYear] = useState<number>(initialTargetYear);

  // Dialog state
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordDialogMode, setRecordDialogMode] = useState<"single" | "range">(
    "single",
  );
  const [editingRecord, setEditingRecord] = useState<
    ManagementHolidayRecord | undefined
  >(undefined);

  // Confirmation dialog for sync / import
  const [pendingPrepared, setPendingPrepared] = useState<
    PreparedHolidayUpdate | undefined
  >(undefined);

  if (!isOpen) return null;

  const currentCalendar =
    snapshot.calendars.find((c) => c.id === selectedCalendarId) ??
    snapshot.calendars[0];

  const allRecords = currentCalendar
    ? resolveManagementRecords(snapshot, currentCalendar.id)
    : [];

  const yearRecords = allRecords.filter((r) => r.date.year === selectedYear);

  const getRecordCount = (calendarId: string) => {
    const map = resolveEffectiveRecords(snapshot, calendarId);
    return map.size;
  };

  const getCoverageBadge = (
    calendarId: string,
  ): "confirmed" | "unconfirmed" | "unknown" => {
    const calendarCoverage = snapshot.coverage.filter(
      (c) => c.calendarId === calendarId,
    );
    const fullYearRange: DateRange = {
      start: { year: selectedYear, month: 1, day: 1 },
      end: { year: selectedYear, month: 12, day: 31 },
    };
    const gaps = getUncoveredCalendarRanges(
      fullYearRange,
      calendarCoverage,
      calendarId,
    );
    if (gaps.length === 0) return "confirmed";
    if (
      calendarCoverage.some(
        (c) => c.start.year <= selectedYear && c.end.year >= selectedYear,
      )
    ) {
      return "unconfirmed";
    }
    return "unknown";
  };

  const handleAddCalendar = async () => {
    const name = window.prompt(
      t.holidayLibrary.newCalendarPrompt,
      t.holidayLibrary.customCalendarDefaultName,
    );
    if (name && name.trim()) {
      const created = await ops.createCalendar(name.trim());
      await refresh(repository);
      setSelectedCalendarId(created.id);
    }
  };

  const handleRenameCalendar = async (name: string) => {
    if (!currentCalendar) return;
    await ops.renameCalendar(currentCalendar.id, name);
    await refresh(repository);
  };

  const handleDeleteCalendar = async () => {
    if (!currentCalendar) return;
    try {
      await ops.deleteCalendar(currentCalendar.id, activeDocument);
      await refresh(repository);
      setSelectedCalendarId(BUILTIN_CHINA_CALENDAR_ID);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSync = async () => {
    if (!currentCalendar) return;
    try {
      const prepared = await ops.prepareSyncYear(currentCalendar.id, selectedYear);
      setPendingPrepared(prepared);
    } catch (err) {
      window.alert(t.holidayLibrary.syncError(err instanceof Error ? err.message : String(err)));
    }
  };

  const handleImportProvider = async (file: File) => {
    if (!currentCalendar?.provider) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const prepared = await ops.prepareProviderImport(
        currentCalendar.id,
        currentCalendar.provider,
        selectedYear,
        raw,
      );
      setPendingPrepared(prepared);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleImportNewCalendar = async (file: File) => {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const prepared = await ops.prepareMonthloomImport(raw);
      setPendingPrepared(prepared);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleImportMonthloom = async (file: File) => {
    if (!currentCalendar) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const prepared = await ops.prepareMonthloomImport(raw, currentCalendar.id);
      setPendingPrepared(prepared);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleExportMonthloom = () => {
    if (!currentCalendar) return;
    const effectiveMap = resolveEffectiveRecords(snapshot, currentCalendar.id);
    const jsonStr = serializeMonthloomHolidayJson({
      calendar: currentCalendar,
      records: Array.from(effectiveMap.values()),
      coverage: snapshot.coverage.filter((c) => c.calendarId === currentCalendar.id),
    });
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthloom-holidays-${currentCalendar.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyPendingUpdate = async () => {
    if (!pendingPrepared) return;
    const targetId = pendingPrepared.calendarId;
    await ops.applyPreparedUpdate(pendingPrepared);
    setPendingPrepared(undefined);
    await refresh(repository);
    setSelectedCalendarId(targetId);
  };

  const syncState = snapshot.syncStates.find(
    (s) => s.calendarId === currentCalendar?.id,
  );

  return (
    <div className="holiday-dialog-overlay" role="dialog" aria-modal="true">
      <div className="holiday-library-modal">
        {/* Modal Header */}
        <div className="holiday-library-header">
          <h2>{t.holidayLibrary.title}</h2>
          <button
            type="button"
            className="holiday-library-close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="holiday-library-body">
          <HolidayCalendarList
            calendars={snapshot.calendars}
            selectedCalendarId={selectedCalendarId}
            onSelectCalendar={(id) => setSelectedCalendarId(id)}
            onAddCalendar={handleAddCalendar}
            onImportCalendar={handleImportNewCalendar}
            getRecordCount={getRecordCount}
            getCoverageBadge={getCoverageBadge}
          />


          {currentCalendar && (
            <HolidayCalendarDetail
              calendar={currentCalendar}
              records={yearRecords}
              coverageBadge={getCoverageBadge(currentCalendar.id)}
              syncState={syncState}
              targetYear={selectedYear}
              onYearChange={(y) => setSelectedYear(y)}
              onSync={currentCalendar.provider ? handleSync : undefined}
              onImportProvider={handleImportProvider}
              onImportMonthloom={handleImportMonthloom}
              onExportMonthloom={handleExportMonthloom}
              onAddRecord={() => {
                setEditingRecord(undefined);
                setRecordDialogMode("single");
                setRecordDialogOpen(true);
              }}
              onAddRange={() => {
                setEditingRecord(undefined);
                setRecordDialogMode("range");
                setRecordDialogOpen(true);
              }}
              onEditRecord={(record) => {
                setEditingRecord(record);
                setRecordDialogMode("single");
                setRecordDialogOpen(true);
              }}
              onDeleteRecord={async (date) => {
                await ops.deleteRecord(currentCalendar.id, date);
                await refresh(repository);
              }}
              onRestoreRecord={async (date) => {
                await ops.restoreSourceRecord(currentCalendar.id, date);
                await refresh(repository);
              }}
              onMarkConfirmed={async () => {
                await ops.markCoverageConfirmed(currentCalendar.id, {
                  start: { year: selectedYear, month: 1, day: 1 },
                  end: { year: selectedYear, month: 12, day: 31 },
                });
                await refresh(repository);
              }}
              onRenameCalendar={
                !currentCalendar.builtin ? handleRenameCalendar : undefined
              }
              onDeleteCalendar={
                !currentCalendar.builtin ? handleDeleteCalendar : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Record Dialog */}
      {currentCalendar && (
        <HolidayRecordDialog
          isOpen={recordDialogOpen}
          initialMode={recordDialogMode}
          initialRecord={editingRecord}
          onClose={() => {
            setRecordDialogOpen(false);
            setEditingRecord(undefined);
          }}
          onSaveSingle={async (input) => {
            await ops.upsertManualRecord({
              calendarId: currentCalendar.id,
              ...input,
            });
            await refresh(repository);
          }}
          onSaveRange={async (input) => {
            await ops.upsertManualDateRange({
              calendarId: currentCalendar.id,
              ...input,
            });
            await refresh(repository);
          }}
        />
      )}

      {/* Sync/Import Confirmation Dialog */}
      {pendingPrepared && (
        <div className="holiday-dialog-overlay" role="dialog" aria-modal="true">
          <div className="holiday-dialog">
            <h3>{t.holidayLibrary.confirmation.title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "16px 0", fontSize: "0.9rem" }}>
              <div style={{ color: "#4ade80" }}>
                {t.holidayLibrary.confirmation.addedLabel(pendingPrepared.summary.added)}
              </div>
              <div style={{ color: "#facc15" }}>
                {t.holidayLibrary.confirmation.updatedLabel(pendingPrepared.summary.updated)}
              </div>
              <div style={{ color: "#f87171" }}>
                {t.holidayLibrary.confirmation.deletedLabel(pendingPrepared.summary.deleted)}
              </div>
              <div style={{ color: "#93c5fd" }}>
                {t.holidayLibrary.confirmation.retainedOverridesLabel(pendingPrepared.summary.retainedOverrides)}
              </div>
            </div>
            <div className="holiday-dialog-actions">
              <button
                type="button"
                onClick={() => setPendingPrepared(undefined)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #334155",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                {t.holidayLibrary.confirmation.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleApplyPendingUpdate}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t.holidayLibrary.confirmation.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
