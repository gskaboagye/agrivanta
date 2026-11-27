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

export function isAccountDisabled(user: unknown): boolean {
  if (!user || typeof user !== "object") {
    return false;
  }

  const account = user as { status?: unknown; disabled?: unknown };

  return account.status === "disabled" || account.disabled === true;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AccountRole;
};

const COOKIE_NAME = "agrivanta_session";

// Session expires after 30 minutes without activity.
export const SESSION_DURATION_SECONDS = 60 * 30;

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must contain a strong secret of at least 32 characters."
    );
  }

  return new TextEncoder().encode(secret);
}

function isValidUserId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
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

export async function createSession(user: AuthUser, expectedSessionVersion?: number) {
  if (
    !isValidUserId(user.id) ||
    !ACCOUNT_ROLES.includes(user.role)
  ) {
    throw new Error("Invalid user information for session creation.");
  }

  const db = await getDatabase();

  const account = await db.collection("users").findOne(
    { _id: new ObjectId(user.id) },
    { projection: { sessionVersion: 1 } }
  );

  if (!account) {
    throw new Error("Unable to create a session for this account.");
  }

  const sessionVersion =
    typeof account.sessionVersion === "number" &&
    Number.isInteger(account.sessionVersion) &&
    account.sessionVersion >= 0
      ? account.sessionVersion
      : 0;

  if (
    expectedSessionVersion !== undefined &&
    sessionVersion !== expectedSessionVersion
  ) {
    throw new Error("Session has been revoked.");
  }

  const token = await new SignJWT({
    role: user.role,
    sessionVersion,
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

export async function refreshSession(): Promise<boolean> {
  const claims = await getSessionClaims();

  if (!claims) {
    return false;
  }

  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  await createSession(user, claims.sessionVersion);
  return true;
}

export async function revokeCurrentSession(): Promise<void> {
  const claims = await getSessionClaims();

  try {
    if (claims) {
      const db = await getDatabase();

      await db.collection("users").updateOne(
        { _id: new ObjectId(claims.userId) },
        { $inc: { sessionVersion: 1 } }
      );
    }
  } finally {
    await destroySession();
  }
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
      !isValidUserId(payload.sub) ||
      typeof payload.role !== "string" ||
      !ACCOUNT_ROLES.includes(payload.role as AccountRole) ||
      typeof payload.sessionVersion !== "number" ||
      !Number.isInteger(payload.sessionVersion) ||
      payload.sessionVersion < 0
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role as AccountRole,
      sessionVersion: payload.sessionVersion,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const claims = await getSessionClaims();

  if (!claims) {
    return null;
  }

  try {
    const db = await getDatabase();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(claims.userId) },
      {
        projection: {
          name: 1,
          email: 1,
          phone: 1,
          role: 1,
          status: 1,
          disabled: 1,
          sessionVersion: 1,
        },
      }
    );

    if (
      !user ||
      typeof user.role !== "string" ||
      !ACCOUNT_ROLES.includes(user.role as AccountRole)
    ) {
      return null;
    }

    if (isAccountDisabled(user)) {
      return null;
    }

    if (user.role !== claims.role) {
      return null;
    }

    const currentSessionVersion =
      typeof user.sessionVersion === "number" &&
      Number.isInteger(user.sessionVersion) &&
      user.sessionVersion >= 0
        ? user.sessionVersion
        : 0;

    if (currentSessionVersion !== claims.sessionVersion) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: String(user.name ?? ""),
      email: String(user.email ?? ""),
      phone: String(user.phone ?? ""),
      role: user.role as AccountRole,
    };
  } catch (error) {
    console.error("Current user lookup failed:", error);
    return null;
  }
}

