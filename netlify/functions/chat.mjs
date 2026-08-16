// Saytdagi AI yordamchi — mijoz savollariga Claude (Anthropic API) orqali javob beradi.
// ANTHROPIC_API_KEY — Netlify'ning Environment variables bo'limida saqlanadi,
// shuning uchun u sayt kodida hech qachon ko'rinmaydi (xuddi TELEGRAM_TOKEN kabi).

export default async (req) => {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const cut = (s, n) => String(s || "").trim().slice(0, n);

  if (req.method !== "POST") {
    return json({ ok: false, error: "method" }, 405);
  }

  const env = (k) =>
    typeof Netlify !== "undefined" && Netlify.env
      ? Netlify.env.get(k)
      : process.env[k];

  const KEY = env("ANTHROPIC_API_KEY");
  if (!KEY) {
    return json({ ok: false, error: "sozlanmagan" }, 500);
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return json({ ok: false, error: "format" }, 400);
  }

  // Suhbat tarixi: [{ role: "user" | "assistant", content: "..." }]
  const history = Array.isArray(data.messages) ? data.messages : [];
  const messages = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .slice(-12)
    .map((m) => ({ role: m.role, content: cut(m.content, 2000) }))
    .filter((m) => m.content);

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ ok: false, error: "bosh" }, 400);
  }

  const system = [
    'Sen "Shtampchi" — Toshkent markazidagi muhr, shtamp va rekvizit tayyorlaydigan',
    "do'konning veb-saytidagi yordamchisisan. Mijozlarga o'zbek tilida, qisqa va",
    "samimiy javob ber (odatda 1-4 gap).",
    "DO'KON MA'LUMOTLARI:",
    "- Muhr, shtamp va rekvizitlar 15 daqiqada tayyorlanadi.",
    "- Narxlar: mexanik — 70 000 so'mdan (komplekt muhr+shtamp 140 000 so'mdan);",
    "avtomat (Colop/Trodat korpusli, ichki bo'yoqli) — 160 000 so'mdan",
    "(komplekt 320 000 so'm); faksimile va maxsus/datali shtamplar —",
    "mexanik 60 000 so'mdan, avtomat 150 000 so'mdan.",
    "- Buyurtma: saytdagi shakl orqali yoki Telegram @shtampchi_bola,",
    "telefon +998 99 420 11 51.",
    "- Ish vaqti: Dushanba–Shanba, 9:00–18:00.",
    "QOIDALAR: Aniq narx muhr turi va korpusiga bog'liq — kerak bo'lsa mijozni",
    "buyurtma shakliga yoki Telegramga yo'naltir. Faqat muhr/shtamp/do'kon",
    "mavzusida yordam ber; boshqa mavzu so'ralsa, muloyimlik bilan do'kon",
    "xizmatlariga qaytar. Narxlarni o'zing o'ylab topma — faqat yuqoridagi",
    "ma'lumotlardan foydalan.",
  ].join(" ");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 400,
        system,
        messages,
      }),
    });

    const out = await res.json();
    if (!res.ok) {
      return json({ ok: false, error: (out && out.error && out.error.message) || "anthropic" }, 502);
    }

    const text = (out.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return json({ ok: true, reply: text || "Kechirasiz, hozir javob bera olmadim." });
  } catch {
    return json({ ok: false, error: "ulanish" }, 502);
  }
};
