import { useState, useEffect, useMemo } from "react";
import { fetchGoogleFontBytes } from "./fonts/googleFonts";
import { parseFont, type SpikeFont } from "./fonts/fontkitAdapter";
import { arrayBufferToDataUri } from "./assets/embedImage";
import { buildSpikeSvg } from "./render/buildSpikeSvg";
import { SvgPreview } from "./svg/SvgPreview";
import { serializeSvg } from "./svg/serializeSvg";
import {
  SPIKE_VIEW_WIDTH,
  SPIKE_VIEW_HEIGHT,
  WEEKDAYS,
  SAMPLE_TEXTS,
} from "./testData";

export function App() {
  const [font, setFont] = useState<SpikeFont | null>(null);
  const [markerDataUri, setMarkerDataUri] = useState<string>("");
  const [strokeWidth, setStrokeWidth] = useState<number>(1);
  const [fontBytesCount, setFontBytesCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initSpike() {
      try {
        setLoading(true);

        // 1. Fetch Google Font binary
        const textSubset = [
          ...WEEKDAYS,
          SAMPLE_TEXTS.singleDigit,
          SAMPLE_TEXTS.doubleDigit,
          SAMPLE_TEXTS.chinese,
          SAMPLE_TEXTS.japanese,
          SAMPLE_TEXTS.japaneseShort,
          SAMPLE_TEXTS.marker,
        ].join("");

        const fontBytes = await fetchGoogleFontBytes({
          family: "Noto Sans JP",
          weight: 400,
          style: "normal",
          text: textSubset,
        });

        setFontBytesCount(fontBytes.byteLength);
        const parsedFont = parseFont(fontBytes);
        setFont(parsedFont);

        // 2. Fetch Spike marker image
        const markerUrl = `${import.meta.env.BASE_URL}spike-marker.png`;
        const markerRes = await fetch(markerUrl);
        if (markerRes.ok) {
          const markerBuffer = await markerRes.arrayBuffer();
          const uri = arrayBufferToDataUri(markerBuffer, "image/png");
          setMarkerDataUri(uri);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    initSpike();
  }, []);

  const svgDocument = useMemo(() => {
    if (!font) return null;
    return buildSpikeSvg({
      strokeWidth,
      font,
      markerDataUri,
    });
  }, [font, strokeWidth, markerDataUri]);

  const handleExport = () => {
    if (!svgDocument) return;
    const svgString = serializeSvg(svgDocument);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monthloom-rendering-spike-stroke-${strokeWidth}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <h1>Monthloom Rendering Spike</h1>

      <div className="controls">
        <label>
          <strong>Stroke Width: </strong>
          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
          >
            <option value={0.5}>0.5 px</option>
            <option value={1}>1.0 px</option>
            <option value={2}>2.0 px</option>
          </select>
        </label>

        <button
          className="primary"
          onClick={handleExport}
          disabled={!svgDocument}
        >
          Export SVG (Stroke {strokeWidth})
        </button>
      </div>

      <div className="diagnostics">
        <div><strong>Runtime Diagnostics:</strong></div>
        <div>SVG size: {SPIKE_VIEW_WIDTH} × {SPIKE_VIEW_HEIGHT}</div>
        <div>viewBox: 0 0 {SPIKE_VIEW_WIDTH} {SPIKE_VIEW_HEIGHT}</div>
        <div>stroke: {strokeWidth}px</div>
        <div>font bytes: {fontBytesCount} bytes</div>
        {font && (
          <>
            <div>font unitsPerEm: {font.unitsPerEm}</div>
            <div>font ascent: {font.ascent}</div>
            <div>font descent: {font.descent}</div>
          </>
        )}
        <div>image marker: {markerDataUri ? "embedded data URI" : "none"}</div>
        {error && <div style={{ color: "red" }}>Error: {error}</div>}
      </div>

      {loading && <p>Loading Google Fonts &amp; resources...</p>}

      {svgDocument && (
        <div className="preview-container">
          <SvgPreview document={svgDocument} />
        </div>
      )}
    </main>
  );
}
