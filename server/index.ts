import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectMongoDB } from "./mongodb";
import MemoryStore from "memorystore";

const app = express();
const httpServer = createServer(app);

// Behind Render/HTTPS we must trust proxy so secure cookies work
app.set("trust proxy", 1);

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin = process.env.FRONTEND_ORIGIN || origin || "";
  // When using credentials, we must specify the origin (can't use *)
  if (allowedOrigin) {
    res.header("Access-Control-Allow-Origin", allowedOrigin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const MemoryStoreSession = MemoryStore(session);

app.use(
  session({
    name: "connect.sid", // Explicit cookie name
    secret: process.env.SESSION_SECRET!,
    resave: true, // Changed to true to ensure session is saved
    saveUninitialized: true, // Changed to true to save session even if not modified
    cookie: {
      secure: process.env.NODE_ENV === "production", // true in production (HTTPS required for sameSite: "none")
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" for cross-origin in production
      maxAge: 24 * 60 * 60 * 1000 * 7, // 7 days
      path: "/", // Ensure cookie is available for all paths
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // 24 hours
    }),
  })
);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

import path from "path";
app.use("/attached_assets", express.static(path.join(process.cwd(), "attached_assets")));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await connectMongoDB();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
