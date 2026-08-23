import { verifySession } from "./lib/admin-auth.mjs";

export default async (req) => {
  const email = verifySession(req.headers.get("cookie") || "");
  return new Response(JSON.stringify(email ? { ok: true, email } : { ok: false }), {
    headers: { "Content-Type": "application/json" },
  });
};
