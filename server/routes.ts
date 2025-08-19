import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertPickupRequestSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { analyzeEWasteImage, getChatbotResponse } from "./openai";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  }
});

// Session middleware (simplified for demo)
interface AuthenticatedRequest extends Request {
  user?: { id: string };
  file?: Express.Multer.File;
}

const authenticateUser = (req: AuthenticatedRequest, res: Response, next: Function) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  req.user = { id: userId };
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });
  
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });
  
  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/user/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Pickup request routes
  app.post("/api/pickup-requests", upload.single('photo'), async (req: AuthenticatedRequest, res) => {
    try {
      const requestData = {
        ...req.body,
        pickupDate: new Date(req.body.pickupDate),
        weight: req.body.weight.toString(),
      };
      
      const validated = insertPickupRequestSchema.parse(requestData);
      
      let aiVerification = `Verified: ${validated.eWasteType} - Condition: Good, Weight estimate: ${validated.weight} kg, Recyclability: High`;
      
      // If photo was uploaded, use AI to analyze it
      if (req.file) {
        try {
          const fs = await import('fs');
          const imageData = fs.readFileSync(req.file.path);
          const base64Image = imageData.toString('base64');
          
          const aiAnalysis = await analyzeEWasteImage(base64Image);
          aiVerification = `AI Analysis: ${aiAnalysis.classification} (${Math.round(aiAnalysis.confidence * 100)}% confidence) - Recyclable: ${aiAnalysis.recyclable ? 'Yes' : 'No'} - Estimated Weight: ${aiAnalysis.estimatedWeight} - Suggestions: ${aiAnalysis.suggestions.join(', ')}`;
          
          // Optionally reject non-recyclable items
          if (!aiAnalysis.recyclable && aiAnalysis.confidence > 0.8) {
            return res.status(400).json({ 
              message: "AI verification failed: Item not recognized as recyclable e-waste",
              suggestions: aiAnalysis.suggestions
            });
          }
        } catch (error) {
          console.error('AI analysis failed:', error);
          aiVerification = `Verified: ${validated.eWasteType} - Manual verification required due to AI analysis error`;
        }
      }
      
      const request = await storage.createPickupRequest({
        ...validated,
        aiVerification,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      });
      
      res.json(request);
    } catch (error) {
      console.error('Pickup request error:', error);
      res.status(400).json({ message: "Invalid pickup request data" });
    }
  });
  
  app.get("/api/pickup-requests/user/:userId", async (req, res) => {
    try {
      const requests = await storage.getPickupRequestsByUser(req.params.userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/pickup-requests", async (req, res) => {
    try {
      const requests = await storage.getAllPickupRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/pickup-requests/:id/complete", async (req, res) => {
    try {
      const request = await storage.getPickupRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Pickup request not found" });
      }
      
      if (request.status === "completed") {
        return res.status(400).json({ message: "Request already completed" });
      }
      
      // Calculate points based on weight (50 points per kg)
      const weight = parseFloat(request.weight);
      const points = Math.floor(weight * 50);
      
      // Update pickup request
      const updatedRequest = await storage.updatePickupRequest(req.params.id, {
        status: "completed",
        completedAt: new Date(),
        pointsAwarded: points,
      });
      
      // Update user's eco points and total weight
      const user = await storage.getUser(request.userId);
      if (user) {
        const newTotalWeight = parseFloat(user.totalWeight) + weight;
        const newEcoPoints = user.ecoPoints + points;
        
        // Update user level based on points
        let level = "Eco Beginner";
        if (newEcoPoints >= 1000) level = "Eco Champion";
        if (newEcoPoints >= 2500) level = "Eco Legend";
        if (newEcoPoints >= 5000) level = "Eco Master";
        
        await storage.updateUser(request.userId, {
          ecoPoints: newEcoPoints,
          totalWeight: newTotalWeight.toString(),
          level,
        });
        
        // Create digital certificate
        const co2Saved = weight * 0.4; // Approximate CO2 savings
        await storage.createCertificate({
          userId: request.userId,
          title: "Eco Champion Certificate",
          description: `Congrats! You recycled ${weight}kg of e-waste and saved ${co2Saved.toFixed(1)}kg CO₂`,
          weight: weight.toString(),
          co2Saved: co2Saved.toString(),
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error('Complete pickup error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Certificate routes
  app.get("/api/certificates/user/:userId", async (req, res) => {
    try {
      const certificates = await storage.getCertificatesByUser(req.params.userId);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const allRequests = await storage.getAllPickupRequests();
      const completed = allRequests.filter(r => r.status === "completed");
      const totalWeight = completed.reduce((sum, r) => sum + parseFloat(r.weight), 0);
      const co2Saved = totalWeight * 0.4;
      
      const stats = {
        totalPickups: completed.length,
        wasteCollected: `${totalWeight.toFixed(1)} tons`,
        activeUsers: Array.from(new Set(allRequests.map(r => r.userId))).length,
        carbonSaved: `${co2Saved.toFixed(1)} kg`,
        pending: allRequests.filter(r => r.status === "scheduled").length,
        inProgress: allRequests.filter(r => r.status === "in-progress").length,
        completedToday: completed.filter(r => {
          const today = new Date();
          const completedDate = new Date(r.completedAt!);
          return completedDate.toDateString() === today.toDateString();
        }).length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Chatbot API endpoint
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await getChatbotResponse(message, history);
      res.json({ message: response });
    } catch (error) {
      console.error('Chatbot error:', error);
      res.status(500).json({ 
        message: "Sorry, I'm having trouble responding right now. Please try again later." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
