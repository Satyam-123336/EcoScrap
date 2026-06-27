import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertPickupRequestSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { getChatbotResponse } from "./openai";
import { analyzeEWasteImageLocal } from "./modelService";
import { simulationService } from "./simulationService";

// ─── Session type augmentation (BUG-04 fix) ───────────────────────────────────
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// ─── File upload config ───────────────────────────────────────────────────────
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG images are allowed"));
    }
  },
});

// ─── Auth middleware (BUG-04 fix: reads from session, not header) ─────────────
interface AuthenticatedRequest extends Request {
  user?: { id: string };
  file?: Express.Multer.File;
}

const authenticateUser = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required. Please log in." });
  }
  req.user = { id: userId };
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────
export async function registerRoutes(app: Express): Promise<Server> {

  // ── Auth: Register ──────────────────────────────────────────────────────────
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) return res.status(400).json({ message: "Username already exists" });

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) return res.status(400).json({ message: "Email already exists" });

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({ ...userData, password: hashedPassword });

      // Establish session immediately after register (BUG-04 fix)
      req.session.userId = user.id;

      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  // ── Auth: Login ─────────────────────────────────────────────────────────────
  app.post("/api/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(credentials.username);
      if (!user) {
        return res.status(401).json({
          message: "Invalid username or password",
          code: "INVALID_CREDENTIALS",
        });
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          message: "Invalid username or password",
          code: "INVALID_CREDENTIALS",
        });
      }

      // Store userId in session (BUG-04 fix)
      req.session.userId = user.id;

      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof Error && err.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid login data format",
          code: "INVALID_FORMAT",
        });
      }
      res.status(500).json({
        message: "An error occurred during login",
        code: "SERVER_ERROR",
      });
    }
  });

  // ── Auth: Logout ────────────────────────────────────────────────────────────
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // ── Auth: Current user (BUG-04 fix: replaces localStorage-based loadUser) ───
  app.get("/api/me", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to retrieve user information" });
    }
  });

  // ── Users: Get by ID ────────────────────────────────────────────────────────
  app.get("/api/user/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.params.id) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User account not found" });
      }
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to retrieve user information" });
    }
  });

  // ── Users: Update ───────────────────────────────────────────────────────────
  app.put("/api/user/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      // BUG-04 fix: only allow users to update their own profile
      if (req.params.id !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: cannot update another user's profile" });
      }
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Auth: Update Profile ──────────────────────────────────────────────────────
  app.put("/api/user/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.id !== req.params.id) {
        return res.status(403).json({ message: "Forbidden: You can only update your own profile" });
      }
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (err) {
      console.error("Update profile error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Pickup Requests: Create ──────────────────────────────────────────────────
  app.post(
    "/api/pickup-requests",
    authenticateUser,                                   // BUG-04 fix: require auth
    upload.fields([{ name: "photos", maxCount: 10 }]),
    async (req: AuthenticatedRequest, res) => {
      try {
        let eWasteTypes = req.body.eWasteTypes || [];
        if (!Array.isArray(eWasteTypes)) {
          eWasteTypes = [];
          for (let i = 0; i < 10; i++) {
            const key = `eWasteTypes[${i}]`;
            if (req.body[key]) {
              eWasteTypes.push(req.body[key]);
            }
          }
        }

        const eWasteType = eWasteTypes.join(", ");

        const requestData = {
          ...req.body,
          userId: req.user!.id,               // BUG-05 fix: use session userId, not form body
          eWasteType,
          pickupDate: new Date(req.body.pickupDate),
          weight: req.body.weight.toString(),
        };

        const validated = insertPickupRequestSchema.parse(requestData);
        let aiVerification = `Verified: ${validated.eWasteType} - Condition: Good - Weight: ${validated.weight}kg - Recyclability: High`;

        const fileObj = req.files as { [fieldname: string]: Express.Multer.File[] };
        const files = fileObj?.photos || [];
        if (files && files.length > 0) {
          try {
            const fs = await import("fs");
            const analyses = [];

            for (const file of files) {
              const imageData = fs.readFileSync(file.path);
              const aiAnalysis = await analyzeEWasteImageLocal(imageData);

              analyses.push({
                filename: file.originalname,
                classification: aiAnalysis.classification,
                confidence: aiAnalysis.confidence,
                recyclable: aiAnalysis.recyclable,
                estimatedWeight: aiAnalysis.estimatedWeight,
                suggestions: aiAnalysis.suggestions,
              });
            }

            aiVerification = analyses
              .map(
                (a) =>
                  `File: ${a.filename} - Classification: ${a.classification} (${Math.round(a.confidence * 100)}% confidence) - Recyclable: ${a.recyclable ? "Yes" : "No"} - Estimated Weight: ${a.estimatedWeight} - Suggestions: ${a.suggestions.join(", ")}`
              )
              .join(" | ");

            const invalidImage = analyses.find((a) => !a.recyclable && a.confidence > 0.8);
            if (invalidImage) {
              return res.status(400).json({
                message: `AI verification failed: Item not recyclable in file ${invalidImage.filename}`,
                suggestions: invalidImage.suggestions,
              });
            }
          } catch (err) {
            console.error("AI analysis failed:", err);
            aiVerification = `Verified: ${validated.eWasteType} - Manual verification required`;
          }
        }

        let photoUrls = "";
        if (files && files.length > 0) {
          photoUrls = files.map((file) => `/uploads/${file.filename}`).join(",");
        }

        const request = await storage.createPickupRequest({
          ...validated,
          aiVerification,
          photoUrl: photoUrls || null,
        });

        res.json(request);
      } catch (err) {
        console.error("Pickup request error:", err);
        res.status(400).json({ message: "Invalid pickup request data" });
      }
    }
  );

  // ── Pickup Requests: By User ─────────────────────────────────────────────────
  app.get("/api/pickup-requests/user/:userId", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const requests = await storage.getPickupRequestsByUser(req.params.userId);
      res.json(requests);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Pickup Requests: All (admin) ─────────────────────────────────────────────
  app.get("/api/pickup-requests", authenticateUser, async (req, res) => {
    try {
      const requests = await storage.getAllPickupRequests();
      res.json(requests);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Pickup Requests: Accept ──────────────────────────────────────────────────
  app.put("/api/pickup-requests/:id/accept", authenticateUser, async (req, res) => {
    try {
      const request = await storage.getPickupRequest(req.params.id);
      if (!request) return res.status(404).json({ message: "Pickup request not found" });
      if (request.status === "completed") return res.status(400).json({ message: "Already completed" });

      const weight = parseFloat(request.weight);
      const points = Math.floor(weight * 50);

      const updatedRequest = await storage.updatePickupRequest(req.params.id, {
        status: "in-progress",
        pointsAwarded: points,
      });

      console.log(`Starting simulation mission for pickup request: ${req.params.id}`);
      const missionStarted = await simulationService.startMission(req.params.id);

      let notificationMessage = `Your pickup request for ${request.eWasteType} (${request.weight}kg) has been accepted by our team.`;

      if (missionStarted) {
        notificationMessage += " Our automated pickup robot is now heading to your location!";
      } else {
        notificationMessage += " We'll be in touch soon to schedule the pickup.";
      }

      await storage.createNotification({
        userId: request.userId,
        title: "Pickup Request Accepted! 🎉",
        message: notificationMessage,
        type: "success",
        relatedPickupId: request.id,
      });

      res.json({
        ...updatedRequest,
        simulationStarted: missionStarted,
        message: missionStarted
          ? "Pickup request accepted and simulation mission started!"
          : "Pickup request accepted!",
      });
    } catch (err) {
      console.error("Accept pickup error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Pickup Requests: Complete ────────────────────────────────────────────────
  app.put("/api/pickup-requests/:id/complete", authenticateUser, async (req, res) => {
    try {
      const request = await storage.getPickupRequest(req.params.id);
      if (!request) return res.status(404).json({ message: "Pickup request not found" });
      if (request.status === "completed") return res.status(400).json({ message: "Already completed" });

      const weight = parseFloat(request.weight);
      const points = Math.floor(weight * 50);

      const updatedRequest = await storage.updatePickupRequest(req.params.id, {
        status: "completed",
        completedAt: new Date(),
        pointsAwarded: points,
      });

      const user = await storage.getUser(request.userId);
      if (user) {
        const newWeight = parseFloat(user.totalWeight) + weight;
        const newPoints = user.ecoPoints + points;

        let level = "Eco Beginner";
        if (newPoints >= 1000) level = "Eco Champion";
        if (newPoints >= 2500) level = "Eco Legend";
        if (newPoints >= 5000) level = "Eco Master";

        await storage.updateUser(request.userId, {
          ecoPoints: newPoints,
          totalWeight: newWeight.toString(),
          level,
        });

        const co2Saved = weight * 0.4;
        await storage.createCertificate({
          userId: request.userId,
          title: "Eco Champion Certificate",
          // BUG-11 fix: CO₂ subscript restored
          description: `Congrats! You recycled ${weight}kg and saved ${co2Saved.toFixed(1)}kg CO₂`,
          weight: weight.toString(),
          co2Saved: co2Saved.toString(),
        });

        await storage.createNotification({
          userId: request.userId,
          title: "Pickup Completed! ✅",
          // BUG-11 fix: CO₂ subscript in notification message
          message: `Your pickup request for ${request.eWasteType} (${request.weight}kg) has been completed successfully! You earned ${points} EcoPoints and saved ${co2Saved.toFixed(1)}kg of CO₂ emissions.`,
          type: "success",
          relatedPickupId: request.id,
        });
      }

      res.json(updatedRequest);
    } catch (err) {
      console.error("Complete pickup error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Certificates ─────────────────────────────────────────────────────────────
  app.get("/api/certificates/user/:userId", authenticateUser, async (req, res) => {
    try {
      const cert = await storage.getCertificatesByUser(req.params.userId);
      res.json(cert);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Notifications ────────────────────────────────────────────────────────────
  app.get("/api/notifications/user/:userId", authenticateUser, async (req, res) => {
    try {
      const notifs = await storage.getNotificationsByUser(req.params.userId);
      res.json(notifs);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/notifications/user/:userId/unread", authenticateUser, async (req, res) => {
    try {
      const notifs = await storage.getUnreadNotificationsByUser(req.params.userId);
      res.json(notifs);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateUser, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) return res.status(404).json({ message: "Notification not found" });
      res.json(notification);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/notifications/:id", authenticateUser, async (req, res) => {
    try {
      const success = await storage.deleteNotification(req.params.id);
      if (!success) return res.status(404).json({ message: "Notification not found" });
      res.json({ message: "Notification deleted" });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  app.get("/api/stats", async (req, res) => {
    try {
      const allRequests = await storage.getAllPickupRequests();
      const completed = allRequests.filter((r) => r.status === "completed");
      const totalWeight = completed.reduce((sum, r) => sum + parseFloat(r.weight), 0);
      const co2Saved = totalWeight * 0.4;

      const stats = {
        totalPickups: completed.length,
        wasteCollected:
          totalWeight >= 1000
            ? `${(totalWeight / 1000).toFixed(1)} tons`
            : `${totalWeight.toFixed(1)} kg`,
        activeUsers: new Set(allRequests.map((r) => r.userId)).size,
        carbonSaved: `${co2Saved.toFixed(1)} kg`,
        pending: allRequests.filter((r) => r.status === "scheduled").length,
        inProgress: allRequests.filter((r) => r.status === "in-progress").length,
        completedToday: completed.filter((r) => {
          if (!r.completedAt) return false;   // BUG-09 fix: guard null completedAt
          const today = new Date();
          const date = new Date(r.completedAt);
          return date.toDateString() === today.toDateString();
        }).length,
      };

      res.json(stats);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ── Image Analysis: Single ───────────────────────────────────────────────────
  app.post("/api/analyze-image", authenticateUser, upload.single("image"), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }
      const fs = await import("fs");
      const imageBuffer = fs.readFileSync(req.file.path);
      const analysis = await analyzeEWasteImageLocal(imageBuffer);
      fs.unlinkSync(req.file.path);
      res.json(analysis);
    } catch (err) {
      console.error("Image analysis error:", err);
      res.status(500).json({
        message: "Failed to analyze image",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  // ── Image Analysis: Batch ────────────────────────────────────────────────────
  app.post("/api/analyze-images-batch", authenticateUser, upload.array("images", 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No images provided" });
      }

      const selectedTypes = JSON.parse(req.body.selectedTypes || "[]");
      const fs = await import("fs");
      const results: any[] = [];
      const type_mismatches: any[] = [];
      const files = Array.isArray(req.files) ? req.files : [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i] as Express.Multer.File;
        try {
          const imageBuffer = fs.readFileSync(file.path);
          const analysis = await analyzeEWasteImageLocal(imageBuffer);

          const result: any = { ...analysis, filename: file.originalname, index: i, mismatch: false };

          if (selectedTypes.length > 0) {
            const typeMapping: { [key: string]: string[] } = {
              mobile: ["Mobile"],
              charging_accessories: ["Charging and Connectivity Accessories"],
              chargers: ["Charging and Connectivity Accessories"],
              battery: ["Battery"],
              keyboard: ["Keyboard"],
              mouse: ["Mouse"],
              hard_drive: ["Hard Drive"],
              small_electronics: ["PCB", "Pen Drive"],
              audio_devices: ["Audio devices"],
            };

            const typeMatches = selectedTypes.some((selectedType: string) => {
              const mappedTypes = typeMapping[selectedType] || [];
              return mappedTypes.some((mappedType) =>
                analysis.classification.toLowerCase().includes(mappedType.toLowerCase())
              );
            });

            if (!typeMatches) {
              type_mismatches.push({
                filename: file.originalname,
                detected: analysis.classification,
                confidence: analysis.confidence,
                expected: selectedTypes,
              });
              result.mismatch = true;
            }
          }

          results.push(result);
          fs.unlinkSync(file.path);
        } catch (error) {
          results.push({
            filename: file.originalname,
            index: i,
            error: error instanceof Error ? error.message : "Unknown error",
            classification: "Error",
            confidence: 0,
            mismatch: true,
          });
          try {
            fs.unlinkSync(file.path);
          } catch {}
        }
      }

      res.json({
        batch_results: results,
        total_images: files.length,
        successful_predictions: results.filter((r) => !("error" in r)).length,
        type_mismatches,
        has_mismatches: type_mismatches.length > 0,
        summary: {
          successful: results.filter((r) => !("error" in r) && !r.mismatch).length,
          mismatched: type_mismatches.length,
          errors: results.filter((r) => "error" in r).length,
        },
      });
    } catch (err) {
      console.error("Batch image analysis error:", err);
      if (req.files) {
        const fs = await import("fs");
        for (const file of req.files as Express.Multer.File[]) {
          try {
            fs.unlinkSync(file.path);
          } catch {}
        }
      }
      res.status(500).json({
        message: "Failed to analyze images",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  // ── Simulation Control ───────────────────────────────────────────────────────
  app.get("/api/simulation/status", authenticateUser, async (req, res) => {
    try {
      const status = simulationService.getMissionStatus();
      const stats = simulationService.getSimulationStats();
      const healthCheck = await simulationService.checkSimulationServerHealth();
      res.json({
        mission: status,
        server: { url: stats.serverUrl, healthy: healthCheck, monitoring: stats.isMonitoring },
      });
    } catch (error) {
      console.error("Simulation status error:", error);
      res.status(500).json({ message: "Failed to get simulation status" });
    }
  });

  app.post("/api/simulation/stop", authenticateUser, async (req, res) => {
    try {
      const stopped = await simulationService.stopMission();
      res.json({ success: stopped, message: stopped ? "Mission stopped successfully" : "Failed to stop mission" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop simulation" });
    }
  });

  app.post("/api/simulation/resume", authenticateUser, async (req, res) => {
    try {
      const resumed = await simulationService.resumeMission();
      res.json({ success: resumed, message: resumed ? "Mission resumed successfully" : "Failed to resume mission" });
    } catch (error) {
      res.status(500).json({ message: "Failed to resume simulation" });
    }
  });

  app.post("/api/simulation/reset", authenticateUser, async (req, res) => {
    try {
      const reset = await simulationService.resetMission();
      res.json({ success: reset, message: reset ? "Mission reset successfully" : "Failed to reset mission" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset simulation" });
    }
  });

  app.post("/api/simulation/complete", authenticateUser, async (req, res) => {
    try {
      const completed = await simulationService.forceCompleteMission();
      res.json({
        success: completed,
        message: completed ? "Mission force-completed successfully" : "No active mission to complete",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete simulation" });
    }
  });

  // ── Chatbot ──────────────────────────────────────────────────────────────────
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }
      const response = await getChatbotResponse(message, history);
      res.json({ message: response });
    } catch (err) {
      console.error("Chatbot error:", err);
      res.status(500).json({
        message: "Sorry, I'm having trouble responding right now. Please try again later.",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
