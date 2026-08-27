import { useState, useEffect } from "react";
import { fetchGoogleFontBytes } from "./fonts/googleFonts";
import { SAMPLE_TEXTS, WEEKDAYS } from "./testData";

export function App() {
  const [fontStatus, setFontStatus] = useState<{
    css: "idle" | "loading" | "loaded" | "failed";
    binaryBytes: number;
    error?: string;
  }>({
    css: "idle",
    binaryBytes: 0,
  });

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

        setFontStatus({
          css: "loaded",
          binaryBytes: bytes.byteLength,
        });
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
        <div><strong>Font Diagnostics:</strong></div>
        <div>Font CSS: {fontStatus.css}</div>
        <div>Font binary: {fontStatus.binaryBytes} bytes</div>
        {fontStatus.error && <div style={{ color: "red" }}>Error: {fontStatus.error}</div>}
      </div>
      <p>Rendering pipeline in progress...</p>
    </main>
  );
}
