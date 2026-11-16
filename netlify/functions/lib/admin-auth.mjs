// Admin panel uchun sessiya yordamchisi: cookie imzolash/tekshirish.
// Bu fayl Netlify funksiyasi emas (default export yo'q) — faqat boshqa
// funksiyalar ichida import qilinadi.

import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "admin_session";
const WEEK_SECONDS = 60 * 60 * 24 * 7;

export const env = (k) =>
  typeof Netlify !== "undefined" && Netlify.env
    ? Netlify.env.get(k)
    : process.env[k];

export function adminEmails() {
  return (env("ADMIN_EMAIL") || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

export function signSession(email) {
  const secret = env("ADMIN_SESSION_SECRET");
  const payload = JSON.stringify({ email, exp: Date.now() + WEEK_SECONDS * 1000 });
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${b64url(payload)}.${sig}`;
}

export function verifySession(cookieHeader) {
  const secret = env("ADMIN_SESSION_SECRET");
  if (!secret || !cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const [payloadB64, sig] = match[1].split(".");
  if (!payloadB64 || !sig) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const expected = createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (!payload.exp || payload.exp < Date.now()) return null;
  if (!adminEmails().includes(String(payload.email || "").toLowerCase())) return null;

  return payload.email;
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${WEEK_SECONDS}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
