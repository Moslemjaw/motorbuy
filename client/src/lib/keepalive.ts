/**
 * Keepalive service to prevent server from sleeping
 * Uses multiple strategies to ensure server stays awake:
 * 1. Frequent pings (every 2 minutes)
 * 2. Multiple endpoints rotation
 * 3. Works even when tab is inactive (using Page Visibility API)
 * 4. Retry logic with exponential backoff
 */

import { buildApiUrl } from "./api-config";

const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes (reduced from 5 for better reliability)
const PING_TIMEOUT = 15000; // 15 seconds timeout
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Multiple endpoints to ping (rotation for better reliability)
const PING_ENDPOINTS = [
  "/api/health",
  "/api/products?limit=1", // Lightweight endpoint
  "/api/vendors?limit=1", // Another lightweight endpoint
];

let keepaliveInterval: number | null = null;
let retryTimeout: number | null = null;
let isActive = false;
let currentEndpointIndex = 0;
let consecutiveFailures = 0;

/**
 * Ping the server using the current endpoint
 */
async function pingServer(endpoint?: string): Promise<boolean> {
  const targetEndpoint = endpoint || PING_ENDPOINTS[currentEndpointIndex];
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    const startTime = Date.now();
    const response = await fetch(buildApiUrl(targetEndpoint), {
      method: "GET",
      credentials: "include",
      signal: controller.signal,
      cache: "no-cache", // Prevent caching
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (response.ok) {
      consecutiveFailures = 0;
      console.log(`[Keepalive] ✓ Ping successful (${targetEndpoint}) - ${duration}ms`);
      
      // Rotate to next endpoint for next ping
      currentEndpointIndex = (currentEndpointIndex + 1) % PING_ENDPOINTS.length;
      return true;
    } else {
      console.warn(
        `[Keepalive] ✗ Ping failed with status ${response.status} (${targetEndpoint})`
      );
      consecutiveFailures++;
      return false;
    }
  } catch (error) {
    consecutiveFailures++;
    if (error instanceof Error && error.name !== "AbortError") {
      console.warn(`[Keepalive] ✗ Ping error (${targetEndpoint}):`, error.message);
    }
    return false;
  }
}

/**
 * Ping with retry logic
 */
async function pingWithRetry(attempt = 1): Promise<void> {
  const success = await pingServer();
  
  if (!success && attempt < MAX_RETRIES) {
    // Try next endpoint immediately
    const nextEndpoint = PING_ENDPOINTS[(currentEndpointIndex + 1) % PING_ENDPOINTS.length];
    const retrySuccess = await pingServer(nextEndpoint);
    
    if (!retrySuccess) {
      // If still failing, wait and retry
      retryTimeout = window.setTimeout(() => {
        pingWithRetry(attempt + 1);
      }, RETRY_DELAY * attempt); // Exponential backoff
    }
  }
  
  // If too many consecutive failures, try all endpoints
  if (consecutiveFailures >= MAX_RETRIES) {
    console.warn("[Keepalive] Multiple failures detected, trying all endpoints...");
    for (const endpoint of PING_ENDPOINTS) {
      const success = await pingServer(endpoint);
      if (success) break;
    }
    consecutiveFailures = 0; // Reset after trying all
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
  consecutiveFailures = 0;

  // Ping immediately on start (multiple times to ensure server wakes up)
  pingWithRetry();
  setTimeout(() => pingWithRetry(), 5000); // Second ping after 5 seconds
  setTimeout(() => pingWithRetry(), 15000); // Third ping after 15 seconds

  // Then ping every interval
  keepaliveInterval = window.setInterval(() => {
    if (document.visibilityState === "visible" || document.visibilityState === "prerender") {
      pingWithRetry();
    } else {
      // Even when tab is hidden, try to ping (some browsers allow this)
      pingWithRetry();
    }
  }, PING_INTERVAL);

  // Also ping when tab becomes visible again
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      pingWithRetry();
    }
  };
  
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Ping on focus (user switches back to tab)
  const handleFocus = () => {
    pingWithRetry();
  };
  
  window.addEventListener("focus", handleFocus);

  console.log(
    `[Keepalive] Service started - pinging every ${PING_INTERVAL / 1000} seconds`
  );
  console.log(`[Keepalive] Using ${PING_ENDPOINTS.length} endpoints for rotation`);
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

  if (retryTimeout !== null) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }

  console.log("[Keepalive] Service stopped");
}

/**
 * Initialize keepalive service
 */
export function initKeepalive(): void {
  // Start keepalive immediately
  startKeepalive();

  // Restart if it somehow stops (safety net)
  const healthCheck = setInterval(() => {
    if (!isActive && document.visibilityState === "visible") {
      console.warn("[Keepalive] Service was inactive, restarting...");
      startKeepalive();
    }
  }, 60000); // Check every minute

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    stopKeepalive();
    clearInterval(healthCheck);
  });

  // Also handle pagehide (for mobile browsers)
  window.addEventListener("pagehide", () => {
    stopKeepalive();
    clearInterval(healthCheck);
  });
}
