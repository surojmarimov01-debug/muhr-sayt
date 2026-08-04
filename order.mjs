// Saytdagi buyurtma shaklini Telegram botga uzatadi.
// TELEGRAM_TOKEN va TELEGRAM_CHAT_ID — Netlify'ning Environment variables
// bo'limida saqlanadi, shuning uchun ular sayt kodida hech qachon ko'rinmaydi.

export default async (req) => {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const cut = (s, n) => String(s || "").trim().slice(0, n);

  if (req.method !== "POST") {
    return json({ ok: false, error: "method" }, 405);
  }

  const env = (k) =>
    typeof Netlify !== "undefined" && Netlify.env
      ? Netlify.env.get(k)
      : process.env[k];

  const TOKEN = env("TELEGRAM_TOKEN");
  const CHAT_ID = env("TELEGRAM_CHAT_ID");

  if (!TOKEN || !CHAT_ID) {
    return json({ ok: false, error: "sozlanmagan" }, 500);
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return json({ ok: false, error: "format" }, 400);
  }

  // Spam tuzog'i: bu maydon odamga ko'rinmaydi, faqat robotlar to'ldiradi.
  if (data.website) return json({ ok: true });

  const tur = cut(data.tur, 60);
  const ism = cut(data.ism, 60);
  const tel = cut(data.tel, 30);
  const izoh = cut(data.izoh, 800);

  if (!tel && !ism) {
    return json({ ok: false, error: "bosh" }, 400);
  }

  const vaqt = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });

  const lines = [
    "🟣 <b>Yangi buyurtma</b>",
    "",
    `<b>Turi:</b> ${esc(tur || "—")}`,
    `<b>Ism:</b> ${esc(ism || "—")}`,
    `<b>Telefon:</b> ${esc(tel || "—")}`,
  ];
  if (izoh) lines.push("", `<b>Matn:</b>\n${esc(izoh)}`);
  lines.push("", `<i>${esc(vaqt)} · sayt orqali</i>`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const out = await res.json();
    if (!out.ok) {
      return json({ ok: false, error: out.description || "telegram" }, 502);
    }
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "ulanish" }, 502);
  }
};
