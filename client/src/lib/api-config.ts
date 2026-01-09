/**
 * Get the API base URL from environment variable or use relative path
 * In development, uses relative URLs (same origin)
 * In production, uses VITE_API_URL if set, otherwise falls back to relative
 */
export function getApiBaseUrl(): string {
  // Vite exposes env vars prefixed with VITE_ to the client
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If VITE_API_URL is set, use it (remove trailing slash if present)
  if (apiUrl) {
    return apiUrl.replace(/\/$/, '');
  }
  
  // Otherwise, use relative URLs (same origin)
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

