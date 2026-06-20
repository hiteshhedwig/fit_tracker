import "server-only";

import { cookies } from "next/headers";
import { compareSync } from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";

const cookieName = "fit_session";

function secret() {
  return process.env.SESSION_SECRET || process.env.APP_PASSWORD || "dev-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export async function createSession() {
  const issued = String(Date.now());
  const token = `${issued}.${sign(issued)}`;
  const cookieStore = await cookies();

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function isAuthed() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return false;

  const [issued, signature] = token.split(".");
  if (!issued || !signature) return false;

  const expected = sign(issued);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export function hasPasswordConfigured() {
  return Boolean(process.env.APP_PASSWORD_HASH || process.env.APP_PASSWORD);
}

export function verifyPassword(password: string) {
  const hash = process.env.APP_PASSWORD_HASH;
  const plain = process.env.APP_PASSWORD;

  if (hash) return compareSync(password, hash);
  if (plain) return password === plain;
  return password === "fit";
}
