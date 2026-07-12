/**
 * Get the API base URL from environment variable or use relative path
 * In development, uses relative URLs (same origin)
 * In production, uses VITE_API_URL if set, otherwise falls back to relative
 */
export function getApiBaseUrl(): string {
  // Always use relative URLs so Vercel can proxy the requests to Render
  // This solves third-party cookie blocking issues natively.
  return '';
}

/**
 * Build a full API URL from a path
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

