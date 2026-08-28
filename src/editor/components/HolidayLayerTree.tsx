import React, { useState } from "react";
import {
  addHolidayLayer,
  createDefaultCustomHolidayLayer,
  ensureLayerFontDescriptors,
  moveHolidayLayer,
  rebindHolidayLayer,
  removeHolidayLayer,
  updateHolidayLayer,
} from "../../domain/template/holidayLayer";
import { resolveEffectiveRecords } from "../../domain/holiday/effectiveRecords";
import type { HolidayCalendar } from "../../domain/holiday/types";
import {
  buildHolidaySemanticId,
  type HolidayLayerElement,
} from "../model/holidaySemanticId";
import type { EditorDocument, EditorSelection } from "../model/types";
import { useI18n } from "../../shared/i18n/i18nStore";
import { useHolidayLibraryStore } from "../../workspace/state/holidayLibraryStore";
import { useWorkspaceStore } from "../../workspace/state/workspaceStore";

export type HolidayLayerTreeProps = {
  document: EditorDocument;
  activeTemplate: "main" | "mini";
  selection: EditorSelection | null;
  calendars: readonly HolidayCalendar[];
  onSelect: (selection: EditorSelection | null) => void;
  onCommitDocument: (next: EditorDocument) => void;
};

export const HolidayLayerTree: React.FC<HolidayLayerTreeProps> = ({
  document,
  activeTemplate,
  selection,
  calendars,
  onSelect,
  onCommitDocument,
}) => {
  const { t } = useI18n();
  const { snapshot } = useHolidayLibraryStore();
  const targetYear = useWorkspaceStore((s) => s.targetYear);

  const layers = document.holidayLayers ?? [];
  const [isGroupExpanded, setIsGroupExpanded] = useState(true);
  const [expandedLayerIds, setExpandedLayerIds] = useState<Set<string>>(
    new Set(layers.map((l) => l.id)),
  );
  const [addingLayer, setAddingLayer] = useState(false);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

  const boundCalendarIds = new Set(layers.map((l) => l.calendarId));
  const availableCalendars = calendars.filter(
    (c) => !boundCalendarIds.has(c.id),
  );

  const toggleExpand = (layerId: string) => {
    setExpandedLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const handleAddLayer = (calendarId: string) => {
    try {
      const newLayer = createDefaultCustomHolidayLayer(calendarId);
      const nextLayers = addHolidayLayer(layers, newLayer);
      const nextCatalog = ensureLayerFontDescriptors(
        document.fontCatalog,
        newLayer,
      );
      onCommitDocument({
        ...document,
        holidayLayers: nextLayers,
        fontCatalog: nextCatalog,
      });
      setAddingLayer(false);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleToggleEnable = (layerId: string, enabled: boolean) => {
    const nextLayers = updateHolidayLayer(layers, layerId, (layer) => ({
      ...layer,
      enabled,
    }));
    onCommitDocument({ ...document, holidayLayers: nextLayers });
  };

  const handleMove = (layerId: string, direction: -1 | 1) => {
    const nextLayers = moveHolidayLayer(layers, layerId, direction);
    onCommitDocument({ ...document, holidayLayers: nextLayers });
  };

  const handleDragDropReorder = (targetLayerId: string) => {
    if (!draggedLayerId || draggedLayerId === targetLayerId) return;
    const fromIdx = layers.findIndex((l) => l.id === draggedLayerId);
    const toIdx = layers.findIndex((l) => l.id === targetLayerId);
    if (fromIdx === -1 || toIdx === -1) return;

    const nextLayers = [...layers];
    const [moved] = nextLayers.splice(fromIdx, 1);
    nextLayers.splice(toIdx, 0, moved);

    onCommitDocument({ ...document, holidayLayers: nextLayers });
    setDraggedLayerId(null);
  };

  const handleRemove = (layerId: string) => {
    const nextLayers = removeHolidayLayer(layers, layerId);
    onCommitDocument({ ...document, holidayLayers: nextLayers });
    if (selection?.semanticId.includes(layerId)) {
      onSelect(null);
    }
  };

  const handleRebind = (layerId: string, newCalendarId: string) => {
    try {
      const nextLayers = rebindHolidayLayer(layers, layerId, newCalendarId);
      onCommitDocument({ ...document, holidayLayers: nextLayers });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  const mainElements: Array<{ element: HolidayLayerElement; label: string }> = [
    { element: "name", label: t.holidayLayersUI.elements.name },
    {
      element: "holidayMarker",
      label: t.holidayLayersUI.elements.holidayMarkerMain,
    },
    {
      element: "workdayMarker",
      label: t.holidayLayersUI.elements.workdayMarkerMain,
    },
    { element: "dateColors", label: t.holidayLayersUI.elements.dateColors },
  ];

  const miniElements: Array<{ element: HolidayLayerElement; label: string }> = [
    {
      element: "holidayMarker",
      label: t.holidayLayersUI.elements.holidayMarkerMini,
    },
    {
      element: "workdayMarker",
      label: t.holidayLayersUI.elements.workdayMarkerMini,
    },
    { element: "dateColors", label: t.holidayLayersUI.elements.dateColors },
  ];

  const subElements = activeTemplate === "main" ? mainElements : miniElements;

  return (
    <div className="holiday-layer-tree-container" style={{ marginTop: "12px" }}>
      <div
        className="layers-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          borderTop: "1px solid var(--border-color, #334155)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setIsGroupExpanded(!isGroupExpanded)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: 0,
              fontSize: "0.75rem",
            }}
            title={
              isGroupExpanded
                ? t.holidayLayersUI.collapseGroupTitle
                : t.holidayLayersUI.expandGroupTitle
            }
          >
            {isGroupExpanded ? "▼" : "▶"}
          </button>
          <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "#94a3b8" }}>
            {t.holidayLayersUI.treeTitle(layers.length)}
          </span>
        </div>

        {availableCalendars.length > 0 && isGroupExpanded && (
          <button
            type="button"
            onClick={() => setAddingLayer(!addingLayer)}
            style={{
              background: "transparent",
              border: "1px solid #334155",
              color: "#60a5fa",
              borderRadius: "4px",
              padding: "2px 6px",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            {t.holidayLayersUI.addLayerBtn}
          </button>
        )}
      </div>

      {isGroupExpanded && (
        <>
          {addingLayer && (
            <div style={{ padding: "8px 12px", background: "rgba(15, 23, 42, 0.6)" }}>
              <select
                onChange={(e) => {
                  if (e.target.value) handleAddLayer(e.target.value);
                }}
                defaultValue=""
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "white",
                  fontSize: "0.75rem",
                  borderRadius: "4px",
                }}
              >
                <option value="" disabled>
                  {t.holidayLayersUI.selectCalendarPlaceholder}
                </option>
                {availableCalendars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="holiday-layers-list">
            {layers.map((layer, index) => {
              const calendar = calendars.find((c) => c.id === layer.calendarId);
              const isExpanded = expandedLayerIds.has(layer.id);
              const isMissingCalendar = !calendar;

              // Check coverage / records status for target year
              let hasDataForYear = false;
              if (calendar) {
                const effMap = resolveEffectiveRecords(snapshot, calendar.id);
                for (const rec of effMap.values()) {
                  if (rec.date.year === targetYear) {
                    hasDataForYear = true;
                    break;
                  }
                }
              }

              return (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedLayerId(layer.id);
                    e.dataTransfer.setData("text/plain", layer.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDragDropReorder(layer.id);
                  }}
                  style={{
                    borderBottom: "1px solid rgba(51, 65, 85, 0.3)",
                    background: layer.enabled ? "transparent" : "rgba(0, 0, 0, 0.2)",
                    opacity: draggedLayerId === layer.id ? 0.5 : 1,
                  }}
                >
                  {/* Layer Header Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 8px",
                      gap: "6px",
                      fontSize: "0.8rem",
                      cursor: "grab",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(layer.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "0.75rem",
                      }}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>

                    <input
                      type="checkbox"
                      checked={layer.enabled}
                      onChange={(e) =>
                        handleToggleEnable(layer.id, e.target.checked)
                      }
                      title={t.holidayLayersUI.toggleLayerTitle}
                    />

                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: layer.enabled ? "#f8fafc" : "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      {calendar ? calendar.name : t.holidayLayersUI.missingCalendar(layer.calendarId)}
                    </span>

                    {!isMissingCalendar && !hasDataForYear && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          background: "rgba(148, 163, 184, 0.15)",
                          color: "#94a3b8",
                          padding: "1px 4px",
                          borderRadius: "2px",
                        }}
                      >
                        {t.holidayLayersUI.noDataForCurrentYear}
                      </span>
                    )}

                    {isMissingCalendar && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          background: "rgba(239, 68, 68, 0.2)",
                          color: "#f87171",
                          padding: "1px 4px",
                          borderRadius: "2px",
                        }}
                      >
                        {t.holidayLayersUI.missingCalendarBadge}
                      </span>
                    )}

                    {/* Move buttons */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(layer.id, -1)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: index === 0 ? "#475569" : "#94a3b8",
                        cursor: index === 0 ? "default" : "pointer",
                        fontSize: "0.7rem",
                        padding: "0 2px",
                      }}
                      title={t.holidayLayersUI.moveUpTitle}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === layers.length - 1}
                      onClick={() => handleMove(layer.id, 1)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color:
                          index === layers.length - 1 ? "#475569" : "#94a3b8",
                        cursor:
                          index === layers.length - 1 ? "default" : "pointer",
                        fontSize: "0.7rem",
                        padding: "0 2px",
                      }}
                      title={t.holidayLayersUI.moveDownTitle}
                    >
                      ▼
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(layer.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#f87171",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        padding: "0 4px",
                      }}
                      title={t.holidayLayersUI.deleteLayerTitle}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Rebind Selector for Missing Calendar */}
                  {isMissingCalendar && availableCalendars.length > 0 && (
                    <div style={{ padding: "4px 8px 6px 24px", background: "rgba(239, 68, 68, 0.05)" }}>
                      <div style={{ fontSize: "0.7rem", color: "#f87171", marginBottom: "4px" }}>
                        {t.holidayLayersUI.missingCalendarWarning}
                      </div>
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleRebind(layer.id, e.target.value);
                        }}
                        defaultValue=""
                        style={{
                          width: "100%",
                          padding: "3px 6px",
                          background: "#0f172a",
                          border: "1px solid #ef4444",
                          color: "#f8fafc",
                          fontSize: "0.75rem",
                          borderRadius: "4px",
                        }}
                      >
                        <option value="" disabled>
                          {t.holidayLayersUI.selectRebindCalendar}
                        </option>
                        {availableCalendars.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sub-elements when expanded */}
                  {isExpanded && (
                    <div style={{ paddingLeft: "24px", paddingBottom: "4px" }}>
                      {subElements.map(({ element, label }) => {
                        const semanticId = buildHolidaySemanticId(
                          activeTemplate,
                          layer.id,
                          element,
                        );
                        const isSelected =
                          selection?.semanticId === semanticId;

                        return (
                          <button
                            key={element}
                            type="button"
                            className={`layer-item ${isSelected ? "active" : ""}`}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                              margin: "2px 0",
                            }}
                            onClick={() =>
                              onSelect({
                                semanticId,
                                instanceKey: `${semanticId}:default`,
                              })
                            }
                          >
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {layers.length > 0 && (
            <div
              style={{
                padding: "6px 12px",
                fontSize: "0.7rem",
                color: "#94a3b8",
                borderTop: "1px solid rgba(51, 65, 85, 0.3)",
                lineHeight: "1.3",
              }}
            >
              {t.holidayLayersUI.colorPriorityHint}
            </div>
          )}
        </>
      )}
    </div>
  );
};

