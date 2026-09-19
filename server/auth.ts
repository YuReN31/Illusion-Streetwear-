import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db/index";
import { users, sessions } from "./db/schema";
import { eq, and, gt } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "illusion-secret-streetwear-key-2026";
const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(user: AuthenticatedUser): Promise<string> {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  const now = Date.now();
  const expiresAt = now + TOKEN_MAX_AGE_MS;

  await db.insert(sessions).values({
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: user.id,
    token,
    expiresAt,
    createdAt: now,
  });

  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function authenticateToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    // Check if session exists in DB and is not expired
    const now = Date.now();
    const sessionList = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
      .limit(1);

    if (sessionList.length === 0) {
      return null;
    }

    // Fetch up-to-date user
    const userList = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    if (userList.length === 0) {
      return null;
    }

    const u = userList[0];
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as "CUSTOMER" | "ADMIN",
    };
  } catch {
    return null;
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.illusion_token || req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    const user = await authenticateToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.illusion_token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Authentication required", errorKey: "unauthorized" });
    return;
  }

  const user = await authenticateToken(token);
  if (!user) {
    res.status(401).json({ error: "Session expired or invalid", errorKey: "sessionExpired" });
    return;
  }

  req.user = user;
  next();
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.illusion_token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Authentication required", errorKey: "unauthorized" });
    return;
  }

  const user = await authenticateToken(token);
  if (!user || user.role !== "ADMIN") {
    res.status(403).json({ error: "Access denied: Admin required", errorKey: "forbidden" });
    return;
  }

  req.user = user;
  next();
}

// In-memory rate limiter for login and order creation
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "global";
    const now = Date.now();
    const entry = rateLimits.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      res.status(429).json({
        error: "Too many requests. Please try again shortly.",
        errorKey: "rateLimited",
      });
      return;
    }

    entry.count += 1;
    next();
  };
}
