/**
 * Keepalive service to prevent Render server from sleeping
 * Sends periodic health check requests to keep the server awake
 */

import { buildApiUrl } from "./api-config";

const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const PING_TIMEOUT = 10000; // 10 seconds timeout

let keepaliveInterval: number | null = null;
let isActive = false;

/**
 * Ping the health check endpoint
 */
async function pingServer(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    const response = await fetch(buildApiUrl("/api/health"), {
      method: "GET",
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log("[Keepalive] Server ping successful");
    } else {
      console.warn(
        "[Keepalive] Server ping failed with status:",
        response.status
      );
    }
  } catch (error) {
    // Silently fail - don't spam console if server is down
    if (error instanceof Error && error.name !== "AbortError") {
      console.warn("[Keepalive] Server ping error:", error.message);
    }
  }
}

/**
 * Start the keepalive service
 */
export function startKeepalive(): void {
  if (isActive) {
    return; // Already running
  }

  isActive = true;

  // Ping immediately on start
  pingServer();

  // Then ping every interval
  keepaliveInterval = window.setInterval(() => {
    pingServer();
  }, PING_INTERVAL);

  console.log(
    "[Keepalive] Service started - pinging every",
    PING_INTERVAL / 1000,
    "seconds"
  );
}

/**
 * Stop the keepalive service
 */
export function stopKeepalive(): void {
  if (!isActive) {
    return; // Not running
  }

  isActive = false;

  if (keepaliveInterval !== null) {
    clearInterval(keepaliveInterval);
    keepaliveInterval = null;
  }

  console.log("[Keepalive] Service stopped");
}

/**
 * Initialize keepalive service
 */
export function initKeepalive(): void {
  // Always start keepalive
  startKeepalive();

  // Clean up on page unload
  window.addEventListener("beforeunload", stopKeepalive);
}
