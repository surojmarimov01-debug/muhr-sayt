// Admin login sahifasiga ochiq (maxfiy bo'lmagan) Google Client ID'ni beradi.

import { env } from "./lib/admin-auth.mjs";

export default async () => {
  return new Response(
    JSON.stringify({ ok: true, clientId: env("GOOGLE_CLIENT_ID") || "" }),
    { headers: { "Content-Type": "application/json" } }
  );
};
