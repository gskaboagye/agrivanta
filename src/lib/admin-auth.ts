import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

const ADMIN_COOKIE_NAME = "agrivanta_admin_session";
const ADMIN_SESSION_DURATION = 60 * 60 * 8;

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  status: "active" | "disabled";
  createdAt?: Date;
};

type AdminDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  status: "active" | "disabled";
  createdAt?: Date;
};

function getAdminSecret() {
  const secret = process.env.ADMIN_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_AUTH_SECRET must contain at least 32 characters."
    );
  }

  return new TextEncoder().encode(secret);
}

function isValidAdminId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function hashAdminPassword(password: string) {
  const passwordBytes = new TextEncoder().encode(password).length;

  if (password.length < 12 || passwordBytes > 72) {
    throw new Error(
      "Administrator passwords must contain at least 12 characters and not exceed 72 UTF-8 bytes."
    );
  }

  return bcrypt.hash(password, 12);
}

export async function verifyAdminPassword(
  password: string,
  passwordHash: string
) {
  return bcrypt.compare(password, passwordHash);
}

export async function createAdminSession(admin: AdminUser) {
  if (!isValidAdminId(admin.id) || admin.status !== "active") {
    throw new Error("Invalid administrator account.");
  }

  const token = await new SignJWT({
    type: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_DURATION}s`)
    .sign(getAdminSecret());

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION,
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

async function getAdminSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAdminSecret(), {
      algorithms: ["HS256"],
    });

    if (
      payload.type !== "admin" ||
      typeof payload.sub !== "string" ||
      !isValidAdminId(payload.sub)
    ) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const adminId = await getAdminSessionId();

  if (!adminId) return null;

  try {
    const db = await getDatabase();

    const admin = await db
      .collection<AdminDocument>("administrators")
      .findOne({
        _id: new ObjectId(adminId),
        status: "active",
      });

    if (!admin) return null;

    return {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      status: admin.status,
      createdAt: admin.createdAt,
    };
  } catch (error) {
    console.error("Administrator lookup failed:", error);
    return null;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error("ADMIN_UNAUTHORIZED");
  }

  return admin;
}
