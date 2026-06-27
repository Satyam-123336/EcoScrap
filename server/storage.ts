import {
  type User,
  type InsertUser,
  type PickupRequest,
  type InsertPickupRequest,
  type Certificate,
  type InsertCertificate,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { users, pickupRequests, certificates, notifications } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// ─── Interface ────────────────────────────────────────────────────────────────

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

// ─── PostgreSQL Storage (primary) ─────────────────────────────────────────────

export class DbStorage implements IStorage {

  // ── Users ──────────────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    // Strip non-updatable fields before writing
    const { id: _id, createdAt: _createdAt, ...safeUpdates } = updates as any;
    const result = await db
      .update(users)
      .set(safeUpdates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // ── Pickup Requests ────────────────────────────────────────────────────────

  async getPickupRequest(id: string): Promise<PickupRequest | undefined> {
    const result = await db.select().from(pickupRequests).where(eq(pickupRequests.id, id));
    return result[0];
  }

  async getPickupRequestsByUser(userId: string): Promise<PickupRequest[]> {
    return db
      .select()
      .from(pickupRequests)
      .where(eq(pickupRequests.userId, userId))
      .orderBy(desc(pickupRequests.createdAt));
  }

  async getAllPickupRequests(): Promise<PickupRequest[]> {
    return db.select().from(pickupRequests).orderBy(desc(pickupRequests.createdAt));
  }

  async createPickupRequest(request: InsertPickupRequest): Promise<PickupRequest> {
    // DB generates a UUID via gen_random_uuid() — no manual ID needed (fixes BUG-22)
    const result = await db.insert(pickupRequests).values(request).returning();
    return result[0];
  }

  async updatePickupRequest(id: string, updates: Partial<PickupRequest>): Promise<PickupRequest | undefined> {
    const { id: _id, createdAt: _createdAt, ...safeUpdates } = updates as any;
    const result = await db
      .update(pickupRequests)
      .set(safeUpdates)
      .where(eq(pickupRequests.id, id))
      .returning();
    return result[0];
  }

  // ── Certificates ───────────────────────────────────────────────────────────

  async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    return db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.createdAt));
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const result = await db.insert(certificates).values(certificate).returning();
    return result[0];
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt));
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();
    return result.length > 0;
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────
// BUG-01 FIX: Use real PostgreSQL storage instead of in-memory MemStorage.
export const storage = new DbStorage();
