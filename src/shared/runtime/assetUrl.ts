/**
 * Resolves public asset URLs with proper respect for Vite's BASE_URL (e.g. on GitHub Pages).
 */
export function resolvePublicAssetUrl(relativePath: string, baseUrl = import.meta.env.BASE_URL): string {
  const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const cleanPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
}
