import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  comparePassword,
  createSession,
  deleteSession,
  requireAuth,
  rateLimiter,
  type AuthRequest,
} from "../auth";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must have at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Register
authRouter.post("/register", rateLimiter(10, 60 * 1000), async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message, errorKey: "validationError" });
      return;
    }

    const { name, email, password } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered", errorKey: "emailExists" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const now = Date.now();
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "CUSTOMER" as const,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(users).values(newUser);

    const token = await createSession({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    res.cookie("illusion_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error", errorKey: "serverError" });
  }
});

// Login
authRouter.post("/login", rateLimiter(15, 60 * 1000), async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message, errorKey: "validationError" });
      return;
    }

    const { email, password } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    const userList = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (userList.length === 0) {
      res.status(401).json({ error: "Invalid email or password", errorKey: "invalidCredentials" });
      return;
    }

    const user = userList[0];
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password", errorKey: "invalidCredentials" });
      return;
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "CUSTOMER" | "ADMIN",
    });

    res.cookie("illusion_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error", errorKey: "serverError" });
  }
});

// Logout
authRouter.post("/logout", async (req: AuthRequest, res) => {
  const token = req.cookies?.illusion_token || req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    await deleteSession(token);
  }
  res.clearCookie("illusion_token");
  res.json({ ok: true });
});

// Me (Current user)
authRouter.get("/me", async (req: AuthRequest, res) => {
  const token = req.cookies?.illusion_token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.json({ user: null });
    return;
  }

  const { authenticateToken } = await import("../auth");
  const user = await authenticateToken(token);
  res.json({ user: user || null });
});

// Forgot Password - clear informational response
authRouter.post("/forgot-password", (req, res) => {
  res.json({
    message: "A recuperação de senha por e-mail será disponibilizada futuramente.",
    messageEn: "Password recovery via email will be available in a future release.",
  });
});
