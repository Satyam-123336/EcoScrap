import { type User, type InsertUser, type PickupRequest, type InsertPickupRequest, type Certificate, type InsertCertificate, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Pickup request operations
  getPickupRequest(id: string): Promise<PickupRequest | undefined>;
  getPickupRequestsByUser(userId: string): Promise<PickupRequest[]>;
  getAllPickupRequests(): Promise<PickupRequest[]>;
  createPickupRequest(request: InsertPickupRequest): Promise<PickupRequest>;
  updatePickupRequest(id: string, updates: Partial<PickupRequest>): Promise<PickupRequest | undefined>;
  
  // Certificate operations
  getCertificatesByUser(userId: string): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  
  // Notification operations
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  getUnreadNotificationsByUser(userId: string): Promise<Notification[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private pickupRequests: Map<string, PickupRequest>;
  private certificates: Map<string, Certificate>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.pickupRequests = new Map();
    this.certificates = new Map();
    this.notifications = new Map();
    
    // Create default admin user
    this.createDefaultAdmin();
    
    // Create a test user and pickup request for testing notifications
    setTimeout(() => {
      this.createTestData();
    }, 100);
  }

  private async createDefaultAdmin() {
    const bcrypt = await import('bcryptjs');
    const adminId = randomUUID();
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin: User = {
      id: adminId,
      username: "admin",
      email: "admin@ecoscrap.com",
      password: hashedPassword,
      name: "System Administrator",
      phone: "+1 (555) 000-0000",
      address: "EcoScrap HQ, San Francisco, CA",
      latitude: null,
      longitude: null,
      ecoPoints: 0,
      totalWeight: "0",
      level: "Admin",
      isAdmin: true,
      createdAt: new Date(),
    };
    this.users.set(adminId, admin);
  }

  private async createTestData() {
    // Create a test user
    const bcrypt = await import('bcryptjs');
    const testUserId = randomUUID();
    const hashedPassword = await bcrypt.hash("test123", 10);
    const testUser: User = {
      id: testUserId,
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
      phone: "+1 (555) 123-4567",
      address: "123 Test Street, Test City, CA 90210",
      latitude: null,
      longitude: null,
      ecoPoints: 0,
      totalWeight: "0",
      level: "Eco Beginner",
      isAdmin: false,
      createdAt: new Date(),
    };
    this.users.set(testUserId, testUser);
    
    console.log("Created test data:");
    console.log("- Test user ID:", testUserId);
  }



  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      latitude: insertUser.latitude || null,
      longitude: insertUser.longitude || null,
      ecoPoints: 0,
      totalWeight: "0",
      level: "Eco Beginner",
      isAdmin: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getPickupRequest(id: string): Promise<PickupRequest | undefined> {
    return this.pickupRequests.get(id);
  }

  async getPickupRequestsByUser(userId: string): Promise<PickupRequest[]> {
    return Array.from(this.pickupRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllPickupRequests(): Promise<PickupRequest[]> {
    return Array.from(this.pickupRequests.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createPickupRequest(insertRequest: InsertPickupRequest): Promise<PickupRequest> {
    const id = `ECO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
    const request: PickupRequest = {
      ...insertRequest,
      id,
      latitude: insertRequest.latitude || null,
      longitude: insertRequest.longitude || null,
      status: "scheduled",
      pointsAwarded: 0,
      createdAt: new Date(),
      completedAt: null,
      photoUrl: insertRequest.photoUrl || null,
      aiVerification: insertRequest.aiVerification || null,
    };
    this.pickupRequests.set(id, request);
    return request;
  }

  async updatePickupRequest(id: string, updates: Partial<PickupRequest>): Promise<PickupRequest | undefined> {
    const request = this.pickupRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...updates };
    this.pickupRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    return Array.from(this.certificates.values())
      .filter(cert => cert.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const id = randomUUID();
    const certificate: Certificate = {
      ...insertCertificate,
      id,
      createdAt: new Date(),
    };
    this.certificates.set(id, certificate);
    return certificate;
  }

  // Notification operations
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      type: insertNotification.type || "info",
      isRead: insertNotification.isRead || false,
      relatedPickupId: insertNotification.relatedPickupId || null,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();

