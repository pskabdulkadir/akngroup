
import "dotenv/config";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import net from "net";
import express from "express";

// Wrap startup logic in async function
(async () => {
  try {
    // 1. Initialize In-Memory Database if needed
    // This must happen BEFORE importing ./index because imports are hoisted/cached
    const mongoUri = process.env.MONGODB_URI;

    // Check for common default/placeholder values that indicate no real DB is configured
    const isLocal = !mongoUri ||
      mongoUri.includes("localhost") ||
      mongoUri.includes("127.0.0.1") ||
      mongoUri.includes("example") ||
      mongoUri.includes("username:password") ||
      mongoUri.includes("your-app-specific-password");

    if (isLocal) {
      console.log("🚀 Checking Database Configuration...");
      try {
        console.log("⚠️ No valid remote MongoDB found. Attempting to start In-Memory MongoDB...");

        // Dynamically import to avoid production build issues if dev dependency is missing
        const { MongoMemoryServer } = await import('mongodb-memory-server');

        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        process.env.MONGODB_URI = uri;
        console.log(`✅ In-Memory MongoDB Started: ${uri}`);
        console.log("⚠️ NOTE: Data will be lost upon server restart!");

        // Set flag for Queue to use memory too
        process.env.USE_REDIS = 'false';

      } catch (error) {
        console.warn("❌ Failed to start In-Memory MongoDB. Ensure 'mongodb-memory-server' is installed.", error);
      }
    } else {
      console.log("✅ Using Configured MongoDB Connection");
      // Only enable Redis if explicitly set or if Redis config exists
      if (process.env.USE_REDIS === 'true') {
        // Keep as is
      } else if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        process.env.USE_REDIS = 'true';
      } else {
        process.env.USE_REDIS = 'false';
      }
    }

    // 2. Dynamically import the app after environment setup
    const { createServer } = await import("./index");
    const app = await createServer();
    const defaultPort = Number(process.env.PORT || 3000);

    // Function to find an available port
    const findAvailablePort = (startPort: number): Promise<number> => {
      return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", (err: any) => {
          if (err.code === "EADDRINUSE") {
            resolve(findAvailablePort(startPort + 1));
          } else {
            reject(err);
          }
        });
        server.listen(startPort, () => {
          server.close(() => {
            resolve(startPort);
          });
        });
      });
    };

    // Start server with dynamic port
    findAvailablePort(defaultPort).then((port) => {
      console.log(`🔍 Checking port availability... Selected port: ${port}`);

      // In production, serve the built SPA files
      // @ts-ignore
      const __dirname = import.meta.dirname || path.resolve();

      // Determine correct dist path (handle both dev/source and prod/build structures)
      let distPath = path.join(__dirname, "../spa");
      if (!fs.existsSync(distPath)) {
        distPath = path.join(__dirname, "../dist/spa");
      }
      if (!fs.existsSync(distPath)) {
        // Fallback for when running from project root
        distPath = path.join(process.cwd(), "dist/spa");
      }


      // Serve static files
      // @ts-ignore
      app.use(express.static(distPath));

      // Handle React Router - serve index.html for all non-API routes
      app.get("*", (req: any, res: any) => {
        // Don't serve index.html for API routes
        if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
          return res.status(404).json({ error: "API endpoint not found" });
        }

        res.sendFile(path.join(distPath, "index.html"));
      });

      const keyPath = process.env.SSL_KEY_PATH;
      const certPath = process.env.SSL_CERT_PATH;

      if (keyPath && certPath && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        try {
          const key = fs.readFileSync(keyPath);
          const cert = fs.readFileSync(certPath);
          const server = https.createServer({ key, cert }, app);
          server.listen(port, () => {
            console.log(`🔐 HTTPS server running on port ${port}`);
            console.log(`📱 Frontend: https://localhost:${port}`);
            console.log(`🔧 API: https://localhost:${port}/api`);
          });
        } catch (e) {
          console.warn("HTTPS failed, falling back to HTTP:", (e as any)?.message || e);
          app.listen(port, () => {
            console.log(`🚀 HTTP server running on port ${port}`);
            console.log(`📱 Frontend: http://localhost:${port}`);
            console.log(`🔧 API: http://localhost:${port}/api`);
          });
        }
      } else {
        app.listen(port, () => {
          console.log(`🚀 HTTP server running on port ${port}`);
          console.log(`📱 Frontend: http://localhost:${port}`);
          console.log(`🔧 API: http://localhost:${port}/api`);
        });
      }
    }).catch((err) => {
      console.error("❌ Failed to find an available port:", err);
      process.exit(1);
    });

  } catch (error) {
    console.error("❌ Fatal Server Error:", error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
