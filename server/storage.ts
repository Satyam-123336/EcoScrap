import { type User, type InsertUser, type PickupRequest, type InsertPickupRequest, type Certificate, type InsertCertificate } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private pickupRequests: Map<string, PickupRequest>;
  private certificates: Map<string, Certificate>;

  constructor() {
    this.users = new Map();
    this.pickupRequests = new Map();
    this.certificates = new Map();
    
    // Create default admin user
    this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
      username: "admin",
      email: "admin@ecoscrap.com",
      password: "$2b$10$K8Q8K8K8K8K8K8K8K8K8KuO8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K", // "admin123"
      name: "System Administrator",
      phone: "+1 (555) 000-0000",
      address: "EcoScrap HQ, San Francisco, CA",
      ecoPoints: 0,
      totalWeight: "0",
      level: "Admin",
      isAdmin: true,
      createdAt: new Date(),
    };
    this.users.set(adminId, admin);
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
      status: "scheduled",
      pointsAwarded: 0,
      createdAt: new Date(),
      completedAt: null,
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
}

export const storage = new MemStorage();
