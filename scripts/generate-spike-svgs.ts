import fs from "fs";
import { fetchGoogleFontBytes } from "../src/spike/fonts/googleFonts";
import { parseFont } from "../src/spike/fonts/fontkitAdapter";
import { arrayBufferToDataUri } from "../src/spike/assets/embedImage";
import { buildSpikeSvg } from "../src/spike/render/buildSpikeSvg";
import { serializeSvg } from "../src/spike/svg/serializeSvg";
import { WEEKDAYS, SAMPLE_TEXTS } from "../src/spike/testData";

async function generate() {
  const textSubset = [
    ...WEEKDAYS,
    SAMPLE_TEXTS.singleDigit,
    SAMPLE_TEXTS.doubleDigit,
    SAMPLE_TEXTS.chinese,
    SAMPLE_TEXTS.japanese,
    SAMPLE_TEXTS.japaneseShort,
    SAMPLE_TEXTS.marker,
  ].join("");

  console.log("Fetching font binary for Noto Sans JP...");
  const fontBytes = await fetchGoogleFontBytes({
    family: "Noto Sans JP",
    weight: 400,
    style: "normal",
    text: textSubset,
  });

  const font = parseFont(fontBytes);
  const markerBuf = fs.readFileSync("public/spike-marker.png");
  const markerDataUri = arrayBufferToDataUri(
    new Uint8Array(markerBuf.buffer, markerBuf.byteOffset, markerBuf.byteLength),
    "image/png",
  );

  if (!fs.existsSync("docs/spike")) {
    fs.mkdirSync("docs/spike", { recursive: true });
  }

  for (const strokeWidth of [0.5, 1, 2]) {
    const doc = buildSpikeSvg({ strokeWidth, font, markerDataUri });
    const svg = serializeSvg(doc);
    const filename = `docs/spike/monthloom-rendering-spike-stroke-${strokeWidth}.svg`;
    fs.writeFileSync(filename, svg);
    console.log(`Generated ${filename} (${svg.length} bytes)`);
  }
}

generate().catch((err) => {
  console.error("Failed to generate spike SVGs:", err);
  process.exit(1);
});
