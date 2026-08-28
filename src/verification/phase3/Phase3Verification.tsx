import { useEffect, useState } from "react";
import { generateCalendarMonth } from "../../domain/calendar/generateCalendarMonth";
import type { SvgDocument } from "../../rendering/svg/document";
import { downloadSvg } from "../../rendering/svg/exportSvg";
import type { SvgTextMode } from "../../rendering/svg/materialize";
import {
  renderMainSvgDocument,
  renderMiniSvgDocument,
} from "../../rendering/svg/renderCalendarSvg";
import { SvgPreview } from "../../rendering/svg/SvgPreview";
import { createDefaultHolidayLayers } from "../../domain/template/holidayLayer";
import {
  createPhase3AssetResolver,
  FIXTURE_HOLIDAYS,
  PHASE3_FONT_CATALOG,
  PHASE3_MAIN_TEMPLATE,
  PHASE3_MINI_TEMPLATE,
  SAMPLE_MONTHS,
} from "./fixture";
import "./phase3-verification.css";

const assetResolver = createPhase3AssetResolver();

export function Phase3Verification(): JSX.Element {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(2); // 2027-05 (6 weeks) by default
  const [mode, setMode] = useState<SvgTextMode>("outlined");
  const [useImageMarker, setUseImageMarker] = useState(false);

  const [mainDoc, setMainDoc] = useState<SvgDocument | null>(null);
  const [miniDoc, setMiniDoc] = useState<SvgDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = SAMPLE_MONTHS[selectedMonthIndex];

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setLoading(true);
      setError(null);

      try {
        const calendar = generateCalendarMonth(
          currentMonth.year,
          currentMonth.month,
          FIXTURE_HOLIDAYS,
        );

        const defaultLayers = createDefaultHolidayLayers();
        const holidayLayers = useImageMarker
          ? defaultLayers.map((l) =>
              l.id === "builtin-cn-layer"
                ? {
                    ...l,
                    main: {
                      ...l.main,
                      holidayMarker: {
                        ...l.main.holidayMarker,
                        marker: {
                          type: "image" as const,
                          assetId: "phase3-marker",
                          position: { anchor: "top-right" as const, offsetX: -4, offsetY: 4 },
                          width: 14,
                          height: 14,
                          opacity: 1,
                        },
                      },
                    },
                  }
                : l,
            )
          : defaultLayers;

        const main = await renderMainSvgDocument({
          calendar,
          template: PHASE3_MAIN_TEMPLATE,
          holidayLayers,
          fontCatalog: PHASE3_FONT_CATALOG,
          assetResolver,
          mode,
        });

        const mini = await renderMiniSvgDocument({
          calendar,
          template: PHASE3_MINI_TEMPLATE,
          holidayLayers,
          fontCatalog: PHASE3_FONT_CATALOG,
          assetResolver,
          mode,
        });

        if (!cancelled) {
          setMainDoc(main);
          setMiniDoc(mini);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [currentMonth.year, currentMonth.month, mode, useImageMarker]);

  const handleExport = async (target: "main" | "mini", exportMode: SvgTextMode) => {
    try {
      const calendar = generateCalendarMonth(
        currentMonth.year,
        currentMonth.month,
        FIXTURE_HOLIDAYS,
      );

      const defaultLayers = createDefaultHolidayLayers();
      const holidayLayers = useImageMarker
        ? defaultLayers.map((l) =>
            l.id === "builtin-cn-layer"
              ? {
                  ...l,
                  main: {
                    ...l.main,
                    holidayMarker: {
                      ...l.main.holidayMarker,
                      marker: {
                        type: "image" as const,
                        assetId: "phase3-marker",
                        position: { anchor: "top-right" as const, offsetX: -4, offsetY: 4 },
                        width: 14,
                        height: 14,
                        opacity: 1,
                      },
                    },
                  },
                }
              : l,
          )
        : defaultLayers;

      const doc =
        target === "main"
          ? await renderMainSvgDocument({
              calendar,
              template: PHASE3_MAIN_TEMPLATE,
              holidayLayers,
              fontCatalog: PHASE3_FONT_CATALOG,
              assetResolver,
              mode: exportMode,
            })
          : await renderMiniSvgDocument({
              calendar,
              template: PHASE3_MINI_TEMPLATE,
              holidayLayers,
              fontCatalog: PHASE3_FONT_CATALOG,
              assetResolver,
              mode: exportMode,
            });

      const filename = `${currentMonth.year}-${currentMonth.month}-${target}-${exportMode}.svg`;
      downloadSvg({ document: doc, filename });
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="phase3-container">
      <header className="phase3-header">
        <h1 className="phase3-title">Monthloom Phase 3 — Production Font Engine + SVG Renderer</h1>
        <p className="phase3-subtitle">
          Real Google Fonts binary loading, fontkit outlining, unified SVG AST, Outlined & Editable
          modes, embedded data URI image markers.
        </p>
      </header>

      <section className="phase3-controls">
        <div className="phase3-control-group">
          <label className="phase3-label" htmlFor="month-select">
            Month:
          </label>
          <select
            id="month-select"
            className="phase3-select"
            value={selectedMonthIndex}
            onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
          >
            {SAMPLE_MONTHS.map((m, idx) => (
              <option key={idx} value={idx}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="phase3-control-group">
          <label className="phase3-label">Render Mode:</label>
          <button
            type="button"
            className={`phase3-btn ${mode === "outlined" ? "phase3-btn-primary" : "phase3-btn-secondary"}`}
            onClick={() => setMode("outlined")}
          >
            Outlined (High Fidelity)
          </button>
          <button
            type="button"
            className={`phase3-btn ${mode === "editable" ? "phase3-btn-primary" : "phase3-btn-secondary"}`}
            onClick={() => setMode("editable")}
          >
            Editable (&lt;text&gt;)
          </button>
        </div>

        <div className="phase3-control-group">
          <label className="phase3-label">
            <input
              type="checkbox"
              checked={useImageMarker}
              onChange={(e) => setUseImageMarker(e.target.checked)}
            />{" "}
            Use Image Marker
          </label>
        </div>

        <div className="phase3-export-group">
          <button
            type="button"
            className="phase3-btn phase3-btn-export"
            onClick={() => handleExport("main", "outlined")}
          >
            Export Main Outlined
          </button>
          <button
            type="button"
            className="phase3-btn phase3-btn-export"
            onClick={() => handleExport("main", "editable")}
          >
            Export Main Editable
          </button>
          <button
            type="button"
            className="phase3-btn phase3-btn-export"
            onClick={() => handleExport("mini", "outlined")}
          >
            Export Mini Outlined
          </button>
          <button
            type="button"
            className="phase3-btn phase3-btn-export"
            onClick={() => handleExport("mini", "editable")}
          >
            Export Mini Editable
          </button>
        </div>
      </section>

      {error && <div className="phase3-error-banner">❌ Font / Render Error: {error}</div>}

      {loading && <div className="phase3-preview-info">Loading font binaries and rendering...</div>}

      <div className="phase3-previews">
        <div className="phase3-preview-card">
          <div className="phase3-preview-header">
            <h2 className="phase3-preview-title">Main Calendar Preview ({mode})</h2>
            <span className="phase3-preview-info">
              {mainDoc ? `${mainDoc.width} × ${mainDoc.height}` : "..."}
            </span>
          </div>
          <div className="phase3-svg-wrapper">
            {mainDoc && <SvgPreview document={mainDoc} />}
          </div>
        </div>

        <div className="phase3-preview-card">
          <div className="phase3-preview-header">
            <h2 className="phase3-preview-title">Mini Calendar Preview ({mode})</h2>
            <span className="phase3-preview-info">
              {miniDoc ? `${miniDoc.width} × ${miniDoc.height}` : "..."}
            </span>
          </div>
          <div className="phase3-svg-wrapper">
            {miniDoc && <SvgPreview document={miniDoc} />}
          </div>
        </div>
      </div>

      <section className="phase3-diagnostics">
        <h3>Active Font Catalog & Requirements</h3>
        <pre>
          {JSON.stringify(
            {
              catalog: PHASE3_FONT_CATALOG,
              currentMonth: currentMonth.label,
              mode,
              mainNodesCount: mainDoc?.children.length ?? 0,
              miniNodesCount: miniDoc?.children.length ?? 0,
            },
            null,
            2,
          )}
        </pre>
      </section>
    </div>
  );
}
