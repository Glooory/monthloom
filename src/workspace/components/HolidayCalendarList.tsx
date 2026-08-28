import React, { useRef } from "react";
import type { HolidayCalendar } from "../../domain/holiday/types";
import { useI18n } from "../../shared/i18n/i18nStore";

export type HolidayCalendarListProps = {
  calendars: readonly HolidayCalendar[];
  selectedCalendarId: string;
  onSelectCalendar: (id: string) => void;
  onAddCalendar: () => void;
  onImportCalendar?: (file: File) => void;
  getRecordCount: (calendarId: string) => number;
  getCoverageBadge: (
    calendarId: string,
  ) => "confirmed" | "unconfirmed" | "unknown";
};

export const HolidayCalendarList: React.FC<HolidayCalendarListProps> = ({
  calendars,
  selectedCalendarId,
  onSelectCalendar,
  onAddCalendar,
  onImportCalendar,
  getRecordCount,
  getCoverageBadge,
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="holiday-calendar-list">
      <div className="holiday-calendar-list-header">
        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
          {t.holidayLibrary.calendarListHeading}
        </span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={onAddCalendar}
            style={{
              padding: "4px 8px",
              fontSize: "0.75rem",
              background: "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              color: "#60a5fa",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {t.holidayLibrary.addCalendarBtn}
          </button>
          {onImportCalendar && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportCalendar(file);
                    e.target.value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  background: "rgba(148, 163, 184, 0.15)",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  color: "#cbd5e1",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {t.holidayLibrary.importCalendarBtn}
              </button>
            </>
          )}
        </div>
      </div>


      <div className="holiday-calendar-items">
        {calendars.map((cal) => {
          const count = getRecordCount(cal.id);
          const coverage = getCoverageBadge(cal.id);
          const isSelected = cal.id === selectedCalendarId;

          return (
            <button
              key={cal.id}
              type="button"
              className={`holiday-calendar-item ${isSelected ? "active" : ""}`}
              onClick={() => onSelectCalendar(cal.id)}
            >
              <div className="holiday-calendar-item-title">{cal.name}</div>
              <div className="holiday-calendar-item-meta">
                <span>{t.holidayLibrary.recordCount(count)}</span>
                <span className={`holiday-badge holiday-badge-${coverage}`}>
                  {t.holidayLibrary.coverageStatus[coverage]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
