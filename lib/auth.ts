import { cookies, headers } from "next/headers";
import { createHmac, randomBytes } from "crypto";

const ADMIN_COOKIE = "ditz_admin_session";
const VIP_COOKIE = "ditz_vip_access";
const MAX_AGE = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("SESSION_SECRET wajib diisi minimal 24 karakter.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function makeToken(payload: string) {
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token?: string) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  return sign(payload) === signature;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, makeToken("admin"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function setVipAccess() {
  const cookieStore = await cookies();
  const payload = `vip:${Date.now()}:${randomBytes(8).toString("hex")}`;
  cookieStore.set(VIP_COOKIE, makeToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE
  });
}

export async function clearVipAccess() {
  const cookieStore = await cookies();
  cookieStore.delete(VIP_COOKIE);
}

export async function hasVipAccess() {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(VIP_COOKIE)?.value);
}

export async function getRequestHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const ua = h.get("user-agent") ?? "unknown";
  return createHmac("sha256", getSecret()).update(`${ip}|${ua}`).digest("hex");
}
