import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

export const ACCOUNT_ROLES = [
  "farmer",
  "buyer",
  "supplier",
  "worker",
  "expert",
] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AccountRole;
};

const COOKIE_NAME = "agrivanta_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must contain a strong secret of at least 32 characters."
    );
  }

  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(user: AuthUser) {
  const token = await new SignJWT({
    role: user.role,
    name: user.name,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionClaims() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.role !== "string" ||
      !ACCOUNT_ROLES.includes(payload.role as AccountRole)
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role as AccountRole,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const claims = await getSessionClaims();

  if (!claims || !ObjectId.isValid(claims.userId)) {
    return null;
  }

  const db = await getDatabase();

  const user = await db.collection("users").findOne(
    { _id: new ObjectId(claims.userId) },
    {
      projection: {
        name: 1,
        email: 1,
        phone: 1,
        role: 1,
      },
    }
  );

  if (!user || !ACCOUNT_ROLES.includes(user.role as AccountRole)) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: String(user.name ?? ""),
    email: String(user.email ?? ""),
    phone: String(user.phone ?? ""),
    role: user.role as AccountRole,
  };
}