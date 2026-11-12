export type LocalFontOption = Readonly<{
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
  blob?: () => Promise<Blob>;
}>;

export type LocalFontFace = LocalFontOption & Readonly<{
  blob(): Promise<Blob>;
}>;

const STORAGE_KEY = "monthloom_installed_fonts_v1";
let installedFontsCache: LocalFontFace[] | null = null;

export function getCachedInstalledFonts(): LocalFontOption[] | null {
  return installedFontsCache;
}

export function getStoredInstalledFonts(): LocalFontOption[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((font) =>
      typeof font === "object" && font !== null &&
      typeof font.family === "string" && typeof font.fullName === "string" &&
      typeof font.postscriptName === "string" && typeof font.style === "string"
    )) return null;
    return parsed as LocalFontOption[];
  } catch {
    return null;
  }
}

export function clearStoredInstalledFonts(): void {
  installedFontsCache = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
}

function fontWindow(): Window & {
  queryLocalFonts?: (options?: { postscriptNames?: string[] }) => Promise<LocalFontFace[]>;
} {
  return window as Window & {
    queryLocalFonts?: (options?: { postscriptNames?: string[] }) => Promise<LocalFontFace[]>;
  };
}

export async function queryInstalledFonts(): Promise<LocalFontFace[]> {
  const provider = fontWindow();
  if (!provider.queryLocalFonts) {
    throw new Error("Local Font Access is unavailable in this browser");
  }
  installedFontsCache = (await provider.queryLocalFonts()).sort((a, b) =>
    a.family.localeCompare(b.family) || a.style.localeCompare(b.style),
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installedFontsCache.map(
      ({ family, fullName, postscriptName, style }) => ({ family, fullName, postscriptName, style }),
    )));
  } catch { /* Font selection still works for this page session. */ }
  return installedFontsCache;
}

export async function queryLocalFontFace(postscriptName: string): Promise<LocalFontFace> {
  const provider = fontWindow();
  if (!provider.queryLocalFonts) {
    throw new Error("Local Font Access is unavailable in this browser");
  }
  const faces = await provider.queryLocalFonts({ postscriptNames: [postscriptName] });
  const face = faces.find((item) => item.postscriptName === postscriptName);
  if (!face) throw new Error(`System font face was not found: ${postscriptName}`);
  return face;
}

export function localFontWeight(style: string): number {
  if (/thin|hairline/i.test(style)) return 100;
  if (/extra.?light|ultra.?light/i.test(style)) return 200;
  if (/light/i.test(style)) return 300;
  if (/medium/i.test(style)) return 500;
  if (/semi.?bold|demi.?bold/i.test(style)) return 600;
  if (/extra.?bold|ultra.?bold/i.test(style)) return 800;
  if (/black|heavy/i.test(style)) return 900;
  if (/bold/i.test(style)) return 700;
  return 400;
}
