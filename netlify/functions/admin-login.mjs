// Google "Sign in" tugmasidan kelgan ID tokenni tekshirib, admin sessiyasini ochadi.
// GOOGLE_CLIENT_ID, ADMIN_EMAIL, ADMIN_SESSION_SECRET — Netlify Environment variables'da.

import { env, adminEmails, signSession, sessionCookie } from "./lib/admin-auth.mjs";

export default async (req) => {
  const json = (body, status = 200, headers = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    });

  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  const CLIENT_ID = env("GOOGLE_CLIENT_ID");
  const SECRET = env("ADMIN_SESSION_SECRET");
  if (!CLIENT_ID || !SECRET || !adminEmails().length) {
    return json({ ok: false, error: "sozlanmagan" }, 500);
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return json({ ok: false, error: "format" }, 400);
  }

  const credential = data.credential;
  if (!credential) return json({ ok: false, error: "token yo'q" }, 400);

  let info;
  try {
    const r = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!r.ok) return json({ ok: false, error: "google" }, 401);
    info = await r.json();
  } catch {
    return json({ ok: false, error: "ulanish" }, 502);
  }

  if (info.aud !== CLIENT_ID || info.email_verified !== "true") {
    return json({ ok: false, error: "token noto'g'ri" }, 401);
  }

  const email = String(info.email || "").toLowerCase();
  if (!adminEmails().includes(email)) {
    return json({ ok: false, error: "ruxsat yo'q" }, 403);
  }

  const token = signSession(email);
  return json({ ok: true, email }, 200, { "Set-Cookie": sessionCookie(token) });
};
