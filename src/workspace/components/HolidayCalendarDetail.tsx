import React, { useRef } from "react";
import { toISODate } from "../../domain/date/date";
import type { LocalDate } from "../../domain/date/types";
import type {
  HolidayCalendar,
  HolidaySyncState,
  ManagementHolidayRecord,
} from "../../domain/holiday/types";
import { useI18n } from "../../shared/i18n/i18nStore";

export type HolidayCalendarDetailProps = {
  calendar: HolidayCalendar;
  records: readonly ManagementHolidayRecord[];
  coverageBadge: "confirmed" | "unconfirmed" | "unknown";
  syncState?: HolidaySyncState;
  targetYear: number;
  onYearChange: (year: number) => void;
  onSync?: () => Promise<void>;
  onImportProvider: (file: File) => Promise<void>;
  onImportMonthloom: (file: File) => Promise<void>;
  onExportMonthloom: () => void;
  onAddRecord: () => void;
  onAddRange: () => void;
  onEditRecord: (record: ManagementHolidayRecord) => void;
  onDeleteRecord: (date: LocalDate) => Promise<void>;
  onRestoreRecord: (date: LocalDate) => Promise<void>;
  onMarkConfirmed: () => Promise<void>;
  onRenameCalendar?: (name: string) => Promise<void>;
  onDeleteCalendar?: () => Promise<void>;
};

export const HolidayCalendarDetail: React.FC<HolidayCalendarDetailProps> = ({
  calendar,
  records,
  coverageBadge,
  syncState,
  targetYear,
  onYearChange,
  onSync,
  onImportProvider,
  onImportMonthloom,
  onExportMonthloom,
  onAddRecord,
  onAddRange,
  onEditRecord,
  onDeleteRecord,
  onRestoreRecord,
  onMarkConfirmed,
  onRenameCalendar,
  onDeleteCalendar,
}) => {
  const { t } = useI18n();
  const providerFileRef = useRef<HTMLInputElement>(null);
  const monthloomFileRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    if (!onRenameCalendar) return;
    const name = window.prompt(t.holidayLibrary.newCalendarPrompt, calendar.name);
    if (name && name.trim()) {
      onRenameCalendar(name.trim());
    }
  };

  const handleDelete = () => {
    if (!onDeleteCalendar) return;
    if (window.confirm(t.holidayLibrary.deleteCalendarConfirm(calendar.name))) {
      onDeleteCalendar();
    }
  };

  return (
    <div className="holiday-calendar-detail">
      {/* Header */}
      <div className="holiday-detail-header">
        <div className="holiday-detail-header-left">
          <h3 className="holiday-detail-title">{calendar.name}</h3>
          {!calendar.builtin && onRenameCalendar && (
            <button
              type="button"
              onClick={handleRename}
              style={{
                padding: "4px 8px",
                fontSize: "0.75rem",
                background: "transparent",
                border: "1px solid #334155",
                color: "#94a3b8",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {t.holidayLibrary.renameCalendarBtn}
            </button>
          )}
          {!calendar.builtin && onDeleteCalendar && (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                padding: "4px 8px",
                fontSize: "0.75rem",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {t.holidayLibrary.deleteCalendarBtn}
            </button>
          )}
        </div>

        {syncState?.lastSuccessAt && (
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            {t.holidayLibrary.lastSync(new Date(syncState.lastSuccessAt).toLocaleDateString())}
          </span>
        )}
      </div>

      {/* Coverage Banner */}
      <div className="holiday-coverage-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>
            {t.holidayLibrary.yearCoverageHeading(targetYear)}
            <span className={`holiday-badge holiday-badge-${coverageBadge}`}>
              {t.holidayLibrary.coverageStatus[coverageBadge]}
            </span>
          </span>
        </div>

        {coverageBadge !== "confirmed" && (
          <button
            type="button"
            onClick={onMarkConfirmed}
            style={{
              padding: "4px 10px",
              fontSize: "0.75rem",
              background: "rgba(34, 197, 94, 0.2)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              color: "#4ade80",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {t.holidayLibrary.markConfirmedBtn}
          </button>
        )}
      </div>

      {/* Action Bar */}
      <div className="holiday-actions-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <label htmlFor="holiday-year-select" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            {t.holidayLibrary.yearLabel}:
          </label>
          <select
            id="holiday-year-select"
            value={targetYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              background: "#0f172a",
              border: "1px solid #334155",
              color: "white",
              fontSize: "0.8rem",
            }}
          >
            {[targetYear - 2, targetYear - 1, targetYear, targetYear + 1, targetYear + 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {calendar.provider && onSync && (
          <button
            type="button"
            onClick={onSync}
            style={{
              padding: "4px 10px",
              fontSize: "0.8rem",
              background: "#2563eb",
              border: "none",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {t.holidayLibrary.syncBtn}
          </button>
        )}

        <input
          type="file"
          accept=".json"
          ref={providerFileRef}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onImportProvider(file);
              e.target.value = "";
            }
          }}
        />

        {calendar.provider && (
          <button
            type="button"
            onClick={() => providerFileRef.current?.click()}
            style={{
              padding: "4px 10px",
              fontSize: "0.8rem",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid #334155",
              color: "#f8fafc",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {t.holidayLibrary.importProviderBtn}
          </button>
        )}

        <input
          type="file"
          accept=".json"
          ref={monthloomFileRef}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onImportMonthloom(file);
              e.target.value = "";
            }
          }}
        />

        <button
          type="button"
          onClick={() => monthloomFileRef.current?.click()}
          style={{
            padding: "4px 10px",
            fontSize: "0.8rem",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid #334155",
            color: "#f8fafc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {t.holidayLibrary.importMonthloomBtn}
        </button>

        <button
          type="button"
          onClick={onExportMonthloom}
          style={{
            padding: "4px 10px",
            fontSize: "0.8rem",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid #334155",
            color: "#f8fafc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {t.holidayLibrary.exportMonthloomBtn}
        </button>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={onAddRecord}
          style={{
            padding: "4px 10px",
            fontSize: "0.8rem",
            background: "rgba(59, 130, 246, 0.2)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            color: "#60a5fa",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {t.holidayLibrary.addRecordBtn}
        </button>

        <button
          type="button"
          onClick={onAddRange}
          style={{
            padding: "4px 10px",
            fontSize: "0.8rem",
            background: "rgba(59, 130, 246, 0.2)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            color: "#60a5fa",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {t.holidayLibrary.addRangeBtn}
        </button>
      </div>

      {/* Record Table */}
      <div className="holiday-table-container">
        {records.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
            {t.holidayLibrary.recordTable.noRecords}
          </div>
        ) : (
          <table className="holiday-table">
            <thead>
              <tr>
                <th>{t.holidayLibrary.recordTable.date}</th>
                <th>{t.holidayLibrary.recordTable.type}</th>
                <th>{t.holidayLibrary.recordTable.name}</th>
                <th>{t.holidayLibrary.recordTable.provenance}</th>
                <th style={{ textAlign: "right" }}>{t.holidayLibrary.recordTable.actions}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const dateKey = toISODate(record.date);
                const isDeleted = record.provenance === "manual-deleted";
                const provBadgeClass =
                  record.provenance === "source"
                    ? "holiday-badge-source"
                    : record.provenance === "manual-modified"
                      ? "holiday-badge-modified"
                      : record.provenance === "manual-deleted"
                        ? "holiday-badge-deleted"
                        : "holiday-badge-added";

                const provText =
                  record.provenance === "source"
                    ? t.holidayLibrary.recordTable.provSource
                    : record.provenance === "manual-modified"
                      ? t.holidayLibrary.recordTable.provModified
                      : record.provenance === "manual-deleted"
                        ? t.holidayLibrary.recordTable.provDeleted
                        : t.holidayLibrary.recordTable.provAdded;

                return (
                  <tr
                    key={dateKey}
                    style={
                      isDeleted
                        ? { opacity: 0.6, textDecoration: "line-through" }
                        : undefined
                    }
                  >
                    <td style={{ fontFamily: "monospace", fontWeight: 500 }}>
                      {dateKey}
                    </td>
                    <td>
                      <span
                        className={`holiday-badge holiday-badge-${record.type}`}
                      >
                        {record.type === "holiday"
                          ? t.holidayLibrary.recordTable.holidayType
                          : t.holidayLibrary.recordTable.workdayType}
                      </span>
                    </td>
                    <td>{record.name || "—"}</td>
                    <td>
                      <span
                        className={`holiday-badge ${provBadgeClass}`}
                        style={
                          isDeleted
                            ? {
                                background: "rgba(239, 68, 68, 0.2)",
                                color: "#f87171",
                              }
                            : undefined
                        }
                      >
                        {provText}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", textDecoration: "none" }}>
                      {isDeleted ? (
                        <button
                          type="button"
                          onClick={() => onRestoreRecord(record.date)}
                          style={{
                            padding: "2px 6px",
                            fontSize: "0.75rem",
                            background: "transparent",
                            border: "none",
                            color: "#facc15",
                            cursor: "pointer",
                          }}
                        >
                          {t.holidayLibrary.recordTable.restoreBtn}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditRecord(record)}
                            style={{
                              padding: "2px 6px",
                              fontSize: "0.75rem",
                              background: "transparent",
                              border: "none",
                              color: "#60a5fa",
                              cursor: "pointer",
                              marginRight: "6px",
                            }}
                          >
                            {t.holidayLibrary.recordTable.editBtn}
                          </button>

                          {record.provenance === "manual-modified" && (
                            <button
                              type="button"
                              onClick={() => onRestoreRecord(record.date)}
                              style={{
                                padding: "2px 6px",
                                fontSize: "0.75rem",
                                background: "transparent",
                                border: "none",
                                color: "#facc15",
                                cursor: "pointer",
                                marginRight: "6px",
                              }}
                            >
                              {t.holidayLibrary.recordTable.restoreBtn}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteRecord(record.date)}
                            style={{
                              padding: "2px 6px",
                              fontSize: "0.75rem",
                              background: "transparent",
                              border: "none",
                              color: "#f87171",
                              cursor: "pointer",
                            }}
                          >
                            {t.holidayLibrary.recordTable.deleteBtn}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
