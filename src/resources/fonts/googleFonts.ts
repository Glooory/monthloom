export type GoogleFontFaceRequest = Readonly<{
  family: string;
  weight: number;
  style: "normal" | "italic";
  text: string;
}>;

export function buildGoogleFontsCssUrl(request: GoogleFontFaceRequest): string {
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

export function extractGoogleFontBinaryUrl(css: string): string {
  const match = css.match(/src:\s*(?:[^;]*?)url\((?:'|")?([^'")]+)(?:'|")?\)/i);
  if (!match || !match[1]) {
    throw new Error("No font binary URL found in CSS response");
  }
  return match[1];
}

export async function fetchGoogleFontBinary(
  request: GoogleFontFaceRequest,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<ArrayBuffer> {
  const cssUrl = buildGoogleFontsCssUrl(request);
  const cssResponse = await fetchImpl(cssUrl, {
    headers: {
      // Chrome User-Agent receives WOFF2
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!cssResponse.ok) {
    throw new Error(
      `Failed to fetch Google Fonts CSS: HTTP ${cssResponse.status} for ${request.family} (weight: ${request.weight}, style: ${request.style}) from ${cssUrl}`,
    );
  }

  const css = await cssResponse.text();
  const fontUrl = extractGoogleFontBinaryUrl(css);

  const fontResponse = await fetchImpl(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(
      `Failed to fetch Google Font binary: HTTP ${fontResponse.status} for ${request.family} (weight: ${request.weight}, style: ${request.style}) from ${fontUrl}`,
    );
  }

  return await fontResponse.arrayBuffer();
}
