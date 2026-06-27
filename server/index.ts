import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pythonModelManager } from "./pythonProcess";
import { pool } from "./db";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

// ─── Load environment variables ───────────────────────────────────────────────
const result = dotenv.config();
if (result.error) {
  console.error("Error loading .env file:", result.error);
} else {
  console.log("Loaded environment variables from .env:");
  for (const key in result.parsed) {
    if (
      key.toLowerCase().includes("key") ||
      key.toLowerCase().includes("password") ||
      key.toLowerCase().includes("secret")
    ) {
      console.log(`${key}: [REDACTED]`);
    } else {
      console.log(`${key}: ${result.parsed[key]}`);
    }
  }
}

// ─── Validate required env vars ───────────────────────────────────────────────
const requiredEnvVars = ["DATABASE_URL"];
const optionalEnvVars = ["GEMINI_API_KEY", "PORT", "SESSION_SECRET"];

console.log("\n=== Environment Variables Validation ===");
const missingRequired = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingRequired.length > 0) {
  console.error(" Missing required environment variables:", missingRequired);
  throw new Error(`Missing required environment variables: ${missingRequired.join(", ")}`);
} else {
  console.log(" All required environment variables are present");
}

optionalEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(` ${varName}: Present`);
  } else {
    console.log(`  ${varName}: Not set (optional)`);
  }
});

if (process.env.GEMINI_API_KEY) {
  console.log(` GEMINI_API_KEY: Present (length: ${process.env.GEMINI_API_KEY.length})`);
  if (process.env.GEMINI_API_KEY.length < 10) {
    console.warn("  GEMINI_API_KEY seems too short. Please verify it's correct.");
  }
} else {
  console.log("  GEMINI_API_KEY: Not set - Chatbot will use mock responses");
}
console.log("=====================================\n");

// ─── Seed default admin user (BUG-21 fix: runs once, guarded by DB check) ─────
async function seedAdminUser(): Promise<void> {
  try {
    const existing = await storage.getUserByUsername("admin");
    if (!existing) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        username: "admin",
        email: "admin@ecoscrap.com",
        password: hashedPassword,
        name: "System Administrator",
        phone: "+1 (555) 000-0000",
        address: "EcoScrap HQ, San Francisco, CA",
        isAdmin: true,
      });
      console.log("✅ Admin user seeded.");
    } else {
      console.log("ℹ️  Admin user already exists, skipping seed.");
    }
  } catch (err) {
    console.error("Error seeding admin user:", err);
  }
}

// ─── Express app setup ────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static uploads
app.use("/uploads", express.static("uploads"));

// ─── Session middleware (BUG-04 fix) ─────────────────────────────────────────
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,                           // reuse existing pg pool
      createTableIfMissing: true,     // auto-create session table if not present
    }),
    secret: process.env.SESSION_SECRET || "ecoscrap-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // HTTPS-only in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ─── Request logger ───────────────────────────────────────────────────────────
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
        if (path === "/api/chatbot") {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } else {
          const responseStr = JSON.stringify(capturedJsonResponse);
          if (responseStr.length > 80) {
            logLine += ` :: ${responseStr.slice(0, 79)}`;
          } else {
            logLine += ` :: ${responseStr}`;
          }
        }
      }
      log(logLine);
    }
  });

  next();
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
(async () => {
  console.log("Starting EcoScrapPickup Backend...");

  // Seed admin user on first run
  await seedAdminUser();

  // Start Python model server before starting main server
  try {
    await pythonModelManager.startPythonModelServer();
    console.log("Python model server is ready!");
  } catch (error) {
    console.warn("Python model server failed to start:", error);
    console.warn("ML features will fall back to mock responses");
  }

  const server = await registerRoutes(app);

  // Global error handler — BUG-19 fix: removed throw after res.json()
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const isDevelopment = process.env.NODE_ENV === "development";
  console.log(`Environment: ${process.env.NODE_ENV}, isDevelopment: ${isDevelopment}`);

  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nReceived SIGINT. Gracefully shutting down...");
    await pythonModelManager.stopPythonModelServer();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nReceived SIGTERM. Gracefully shutting down...");
    await pythonModelManager.stopPythonModelServer();
    process.exit(0);
  });
})();
