// Saqlangan buyurtmalar ro'yxatini qaytaradi. Faqat tizimga kirgan admin uchun.

import { getStore } from "@netlify/blobs";
import { verifySession } from "./lib/admin-auth.mjs";

export default async (req) => {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const email = verifySession(req.headers.get("cookie") || "");
  if (!email) return json({ ok: false, error: "ruxsat yo'q" }, 401);

  try {
    const store = getStore("orders");
    const { blobs } = await store.list();
    const keys = blobs.map((b) => b.key).sort().reverse().slice(0, 200);
    const orders = [];
    for (const key of keys) {
      const item = await store.get(key, { type: "json" });
      if (item) orders.push(item);
    }
    return json({ ok: true, orders });
  } catch {
    return json({ ok: false, error: "xato" }, 500);
  }
};
