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
  const [fontJP, setFontJP] = useState<SpikeFont | null>(null);
  const [fontSC, setFontSC] = useState<SpikeFont | null>(null);
  const [markerDataUri, setMarkerDataUri] = useState<string>("");
  const [strokeWidth, setStrokeWidth] = useState<number>(1);
  const [fontBytesCount, setFontBytesCount] = useState<{ jp: number; sc: number }>({ jp: 0, sc: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initSpike() {
      try {
        setLoading(true);

        // 1. Fetch Google Font binary for Noto Sans JP (Latin, digits, Japanese holidays)
        const jpSubset = [
          ...WEEKDAYS,
          SAMPLE_TEXTS.singleDigit,
          SAMPLE_TEXTS.doubleDigit,
          SAMPLE_TEXTS.japanese,
          SAMPLE_TEXTS.japaneseShort,
        ].join("");

        const jpBytes = await fetchGoogleFontBytes({
          family: "Noto Sans JP",
          weight: 400,
          style: "normal",
          text: jpSubset,
        });

        // 2. Fetch Google Font binary for Noto Sans SC (Chinese holidays, markers)
        const scSubset = [
          SAMPLE_TEXTS.chinese,
          SAMPLE_TEXTS.marker,
        ].join("");

        const scBytes = await fetchGoogleFontBytes({
          family: "Noto Sans SC",
          weight: 400,
          style: "normal",
          text: scSubset,
        });

        setFontBytesCount({
          jp: jpBytes.byteLength,
          sc: scBytes.byteLength,
        });

        setFontJP(parseFont(jpBytes));
        setFontSC(parseFont(scBytes));

        // 3. Fetch Spike marker image
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
    if (!fontJP || !fontSC) return null;
    return buildSpikeSvg({
      strokeWidth,
      fontJP,
      fontSC,
      markerDataUri,
    });
  }, [fontJP, fontSC, strokeWidth, markerDataUri]);

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
        <div>
          font binaries: Noto Sans JP ({fontBytesCount.jp} bytes), Noto Sans SC ({fontBytesCount.sc} bytes)
        </div>
        {fontJP && (
          <div>
            Noto Sans JP metrics &rarr; unitsPerEm: {fontJP.unitsPerEm}, ascent: {fontJP.ascent}, descent: {fontJP.descent}
          </div>
        )}
        {fontSC && (
          <div>
            Noto Sans SC metrics &rarr; unitsPerEm: {fontSC.unitsPerEm}, ascent: {fontSC.ascent}, descent: {fontSC.descent}
          </div>
        )}
        <div>image marker: {markerDataUri ? "embedded data URI (valid)" : "none"}</div>
        {error && <div style={{ color: "red" }}>Error: {error}</div>}
      </div>

      {loading && <p>Loading Google Fonts (SC &amp; JP) &amp; resources...</p>}

      {svgDocument && (
        <div className="preview-container">
          <SvgPreview document={svgDocument} />
        </div>
      )}
    </main>
  );
}
