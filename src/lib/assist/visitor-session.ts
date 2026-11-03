import "server-only";

import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "agrivanta_assist_visitor";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must contain a strong secret of at least 32 characters."
    );
  }

  return new TextEncoder().encode(secret);
}

async function verifyVisitorToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (
      payload.type !== "visitor" ||
      typeof payload.sub !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(payload.sub)
    ) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

export async function getVisitorSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyVisitorToken(token);
}

export async function createVisitorSession(): Promise<string> {
  const sessionId = randomUUID();

  const token = await new SignJWT({
    type: "visitor",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sessionId)
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

  return sessionId;
}

export async function getOrCreateVisitorSession(): Promise<string> {
  const existingSessionId = await getVisitorSessionId();

  if (existingSessionId) {
    return existingSessionId;
  }

  return createVisitorSession();
}

export async function destroyVisitorSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}