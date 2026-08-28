import React, { useEffect, useState } from "react";
import { parseISODate, toISODate } from "../../domain/date/date";
import type { LocalDate } from "../../domain/date/types";
import type { HolidayRecordType } from "../../domain/holiday/types";
import { useI18n } from "../../shared/i18n/i18nStore";

export type HolidayRecordDialogProps = {
  isOpen: boolean;
  initialMode?: "single" | "range";
  initialRecord?: {
    date: LocalDate;
    type: HolidayRecordType;
    name?: string;
  };
  onClose: () => void;
  onSaveSingle: (input: {
    date: LocalDate;
    type: HolidayRecordType;
    name?: string;
  }) => Promise<void>;
  onSaveRange: (input: {
    start: LocalDate;
    end: LocalDate;
    type: HolidayRecordType;
    name?: string;
  }) => Promise<void>;
};

export const HolidayRecordDialog: React.FC<HolidayRecordDialogProps> = ({
  isOpen,
  initialMode,
  initialRecord,
  onClose,
  onSaveSingle,
  onSaveRange,
}) => {
  const { t } = useI18n();
  const [tab, setTab] = useState<"single" | "range">(
    initialRecord ? "single" : (initialMode ?? "single"),
  );

  const [dateStr, setDateStr] = useState<string>(
    initialRecord
      ? toISODate(initialRecord.date)
      : new Date().toISOString().slice(0, 10),
  );
  const [startDateStr, setStartDateStr] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [endDateStr, setEndDateStr] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [type, setType] = useState<HolidayRecordType>(
    initialRecord?.type ?? "holiday",
  );
  const [name, setName] = useState<string>(initialRecord?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(initialRecord ? "single" : (initialMode ?? "single"));
      setDateStr(
        initialRecord
          ? toISODate(initialRecord.date)
          : new Date().toISOString().slice(0, 10),
      );
      setStartDateStr(new Date().toISOString().slice(0, 10));
      setEndDateStr(new Date().toISOString().slice(0, 10));
      setType(initialRecord?.type ?? "holiday");
      setName(initialRecord?.name ?? "");
      setError(null);
      setSaving(false);
    }
  }, [isOpen, initialRecord, initialMode]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (tab === "single") {
        const parsedDate = parseISODate(dateStr);
        if (!parsedDate) {
          throw new Error("Invalid date format (YYYY-MM-DD)");
        }
        await onSaveSingle({
          date: parsedDate,
          type,
          name: name.trim() ? name.trim() : undefined,
        });
      } else {
        const start = parseISODate(startDateStr);
        const end = parseISODate(endDateStr);
        if (!start || !end) {
          throw new Error("Invalid start or end date format (YYYY-MM-DD)");
        }
        await onSaveRange({
          start,
          end,
          type,
          name: name.trim() ? name.trim() : undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="holiday-dialog-overlay" role="dialog" aria-modal="true">
      <div className="holiday-dialog">
        <h3>
          {initialRecord
            ? t.holidayLibrary.dialog.editTitle
            : t.holidayLibrary.dialog.addTitle}
        </h3>

        {!initialRecord && (
          <div className="holiday-dialog-tabs">
            <button
              type="button"
              className={`holiday-dialog-tab ${tab === "single" ? "active" : ""}`}
              onClick={() => setTab("single")}
            >
              {t.holidayLibrary.dialog.singleTab}
            </button>
            <button
              type="button"
              className={`holiday-dialog-tab ${tab === "range" ? "active" : ""}`}
              onClick={() => setTab("range")}
            >
              {t.holidayLibrary.dialog.rangeTab}
            </button>
          </div>
        )}

        <form onSubmit={handleSave}>
          {tab === "single" ? (
            <div className="holiday-form-group">
              <label htmlFor="holiday-date-input">
                {t.holidayLibrary.dialog.dateLabel}
              </label>
              <input
                id="holiday-date-input"
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="holiday-form-group">
                <label htmlFor="holiday-start-date-input">
                  {t.holidayLibrary.dialog.startDateLabel}
                </label>
                <input
                  id="holiday-start-date-input"
                  type="date"
                  required
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                />
              </div>
              <div className="holiday-form-group">
                <label htmlFor="holiday-end-date-input">
                  {t.holidayLibrary.dialog.endDateLabel}
                </label>
                <input
                  id="holiday-end-date-input"
                  type="date"
                  required
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="holiday-form-group">
            <label htmlFor="holiday-type-select">
              {t.holidayLibrary.dialog.typeLabel}
            </label>
            <select
              id="holiday-type-select"
              value={type}
              onChange={(e) => setType(e.target.value as HolidayRecordType)}
            >
              <option value="holiday">
                {t.holidayLibrary.recordTable.holidayType}
              </option>
              <option value="workday">
                {t.holidayLibrary.recordTable.workdayType}
              </option>
            </select>
          </div>

          <div className="holiday-form-group">
            <label htmlFor="holiday-name-input">
              {t.holidayLibrary.dialog.nameLabel}
            </label>
            <input
              id="holiday-name-input"
              type="text"
              placeholder={t.holidayLibrary.dialog.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error && (
            <div
              style={{
                color: "#f87171",
                fontSize: "0.8rem",
                marginBottom: "12px",
              }}
            >
              {error}
            </div>
          )}

          <div className="holiday-dialog-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                border: "1px solid #334155",
                background: "transparent",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              {t.holidayLibrary.dialog.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={saving}
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
              {saving ? "..." : t.holidayLibrary.dialog.saveBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
