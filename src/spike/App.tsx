import { useState, useEffect } from "react";
import { fetchGoogleFontBytes } from "./fonts/googleFonts";
import { parseFont, type SpikeFont } from "./fonts/fontkitAdapter";
import { SAMPLE_TEXTS, WEEKDAYS } from "./testData";

type SampleDiagnostics = {
  text: string;
  glyphCount: number;
  glyphIds: number[];
  advanceWidth: number;
  samplePath?: string;
};

export function App() {
  const [fontStatus, setFontStatus] = useState<{
    css: "idle" | "loading" | "loaded" | "failed";
    binaryBytes: number;
    unitsPerEm?: number;
    ascent?: number;
    descent?: number;
    error?: string;
  }>({
    css: "idle",
    binaryBytes: 0,
  });

  const [diagnostics, setDiagnostics] = useState<SampleDiagnostics[]>([]);

  useEffect(() => {
    async function loadSampleFont() {
      setFontStatus({ css: "loading", binaryBytes: 0 });
      try {
        const textSubset = [
          ...WEEKDAYS,
          SAMPLE_TEXTS.singleDigit,
          SAMPLE_TEXTS.doubleDigit,
          SAMPLE_TEXTS.chinese,
          SAMPLE_TEXTS.japanese,
          SAMPLE_TEXTS.japaneseShort,
          SAMPLE_TEXTS.marker,
        ].join("");

        const bytes = await fetchGoogleFontBytes({
          family: "Noto Sans JP",
          weight: 400,
          style: "normal",
          text: textSubset,
        });

        const font: SpikeFont = parseFont(bytes);

        setFontStatus({
          css: "loaded",
          binaryBytes: bytes.byteLength,
          unitsPerEm: font.unitsPerEm,
          ascent: font.ascent,
          descent: font.descent,
        });

        const testStrings = [
          SAMPLE_TEXTS.singleDigit,
          SAMPLE_TEXTS.doubleDigit,
          SAMPLE_TEXTS.chinese,
          SAMPLE_TEXTS.japanese,
          SAMPLE_TEXTS.japaneseShort,
          SAMPLE_TEXTS.marker,
        ];

        const diag = testStrings.map((str) => {
          const run = font.layout(str);
          return {
            text: str,
            glyphCount: run.glyphs.length,
            glyphIds: run.glyphs.map((g) => g.id),
            advanceWidth: run.advanceWidth,
            samplePath: run.glyphs[0]?.pathData,
          };
        });

        setDiagnostics(diag);
      } catch (err: unknown) {
        setFontStatus({
          css: "failed",
          binaryBytes: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    loadSampleFont();
  }, []);

  return (
    <main>
      <h1>Monthloom Rendering Spike</h1>
      <div className="diagnostics">
        <div><strong>Font Metrics &amp; Loading:</strong></div>
        <div>Font CSS: {fontStatus.css}</div>
        <div>Font binary: {fontStatus.binaryBytes} bytes</div>
        {fontStatus.unitsPerEm !== undefined && (
          <>
            <div>unitsPerEm: {fontStatus.unitsPerEm}</div>
            <div>ascent: {fontStatus.ascent}</div>
            <div>descent: {fontStatus.descent}</div>
          </>
        )}
        {fontStatus.error && <div style={{ color: "red" }}>Error: {fontStatus.error}</div>}
      </div>

      <div className="diagnostics">
        <div><strong>Glyph Run Diagnostics:</strong></div>
        {diagnostics.map((d) => (
          <div key={d.text}>
            "{d.text}" &rarr; {d.glyphCount} glyphs (IDs: [{d.glyphIds.join(", ")}]), advance: {d.advanceWidth}
          </div>
        ))}
      </div>

      <p>Rendering pipeline in progress...</p>
    </main>
  );
}
