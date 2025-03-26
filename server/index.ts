import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";

const app = express();

// Resolve publicPath dynamically based on environment
const publicPath =
  process.env.NODE_ENV === "production"
    ? path.resolve(process.cwd(), "dist/public") // Use process.cwd() in production
    : path.resolve(__dirname, "../dist/public"); // Use __dirname in development

console.log("Serving static files from:", publicPath); // Debug log

// Middleware to serve static files
app.use(express.static(publicPath));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware for API requests
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register API routes
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    log(`Error: ${message} (Status: ${status})`);
  });

  // Serve static files and fallback to index.html in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Serve static files from dist/public
    app.use(express.static(publicPath));

    // Fallback to index.html for SPA routing
    app.get("*", (req, res) => {
      console.log("Fallback route triggered for:", req.path); // Debug log
      const resolvedPath = path.resolve(publicPath, "index.html"); // Corrected path
      console.log("Resolved path for index.html:", resolvedPath); // Debug log
      res.sendFile(resolvedPath);
    });
  }

  // Start the server
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`Server running on http://localhost:${port}`);
    }
  );
})();