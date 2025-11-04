require("dotenv").config();
const fastify = require("fastify");
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const multipart = require("@fastify/multipart");
const staticFiles = require("@fastify/static");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/auth");
const adRoutes = require("./routes/ads");
const deviceRoutes = require("./routes/devices");
const playlistRoutes = require("./routes/playlist");
const statsRoutes = require("./routes/stats");
const reportRoutes = require("./routes/reports");

const app = fastify({
  logger: {
    level: process.env.NODE_ENV === "development" ? "info" : "warn",
    transport:
      process.env.NODE_ENV === "development"
        ? { target: "pino-pretty" }
        : undefined,
  },
});

// Plugins
async function registerPlugins() {
  // CORS
  await app.register(cors, {
    origin:
      process.env.NODE_ENV === "development"
        ? true
        : ["https://dashboard.yourdomain.com"],
    credentials: true,
  });

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET,
    sign: {
      expiresIn: "7d",
    },
  });

  // Multipart (file uploads)
  await app.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 104857600, // 100MB
    },
  });

  // Static files (serve uploaded videos)
  await app.register(staticFiles, {
    root: path.join(__dirname, "../uploads"),
    prefix: "/uploads/",
  });
}

// Routes
async function registerRoutes() {
  // Health check
  app.get("/health", async (request, reply) => {
    return {
      success: true,
      message: "DOOH Backend API is running",
      timestamp: new Date().toISOString(),
    };
  });

  // API routes
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(adRoutes, { prefix: "/api/ads" });
  app.register(deviceRoutes, { prefix: "/api/devices" });
  app.register(playlistRoutes, { prefix: "/api/playlist" });
  app.register(statsRoutes, { prefix: "/api/stats" });
  app.register(reportRoutes, { prefix: "/api/reports" });
}

// Error handler
app.setErrorHandler(errorHandler);

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    const host = process.env.HOST || "0.0.0.0";
    const port = process.env.PORT || 3000;

    await app.listen({ host, port });
    console.log(`\n🚀 DOOH Backend running on http://${host}:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔥 Health check: http://${host}:${port}/health\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
