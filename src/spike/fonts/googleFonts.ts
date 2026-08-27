export type GoogleFontRequest = {
  family: string;
  weight: number;
  style: "normal" | "italic";
  text?: string;
};

export function buildGoogleFontsCssUrl(request: GoogleFontRequest): string {
  const familyEncoded = request.family.trim().replace(/ /g, "+");
  const isItalic = request.style === "italic";
  const familyParam = isItalic
    ? `${familyEncoded}:ital,wght@1,${request.weight}`
    : `${familyEncoded}:wght@${request.weight}`;

  let url = `https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`;
  if (request.text) {
    url += `&text=${encodeURIComponent(request.text)}`;
  }
  return url;
}

export function extractFontUrl(css: string): string {
  const match = css.match(/src:\s*(?:[^;]*?)url\((?:'|")?([^'")]+)(?:'|")?\)/i);
  if (!match || !match[1]) {
    throw new Error("No font binary URL found in CSS response");
  }
  return match[1];
}

export async function fetchGoogleFontBytes(
  request: GoogleFontRequest,
): Promise<ArrayBuffer> {
  const cssUrl = buildGoogleFontsCssUrl(request);
  const cssResponse = await fetch(cssUrl, {
    headers: {
      // Modern browsers receive WOFF2
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!cssResponse.ok) {
    throw new Error(
      `Failed to fetch Google Fonts CSS: HTTP ${cssResponse.status} from ${cssUrl}`,
    );
  }

  const css = await cssResponse.text();
  const fontUrl = extractFontUrl(css);

  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(
      `Failed to fetch Google Fonts binary: HTTP ${fontResponse.status} from ${fontUrl}`,
    );
  }

  return await fontResponse.arrayBuffer();
}
