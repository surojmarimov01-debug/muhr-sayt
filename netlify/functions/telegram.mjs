// Telegram bot — tayyor javoblar va mijoz xabarlarini egaga uzatish.
// Webhook manzili: https://SIZNING-SAYT/.netlify/functions/telegram

// ─────────── SOZLAMALAR ───────────
// Faqat shu blokni tahrirlash kifoya.
const SHOP = {
  nom: "Shtampchi",
  manzil: "— manzilni shu yerga yozing —",
  ishVaqti: "Dushanba–Shanba, 9:00–18:00",
  telefon: "+998 99 420 11 51",
  operator: "shtampchi_bola", // @ belgisisiz
  muddat: "15 daqiqa",
};
// ──────────────────────────────────

const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const env = (k) =>
  typeof Netlify !== "undefined" && Netlify.env ? Netlify.env.get(k) : process.env[k];

const MENU = {
  inline_keyboard: [
    [{ text: "📋 Nima yasaymiz", callback_data: "mahsulot" }],
    [
      { text: "💰 Narxlar", callback_data: "narx" },
      { text: "⏱ Muddat", callback_data: "muddat" },
    ],
    [{ text: "📍 Manzil va ish vaqti", callback_data: "manzil" }],
    [{ text: "📝 Buyurtma berish", callback_data: "buyurtma" }],
    [{ text: "👤 Operator bilan gaplashish", url: `https://t.me/${SHOP.operator}` }],
  ],
};

const ORQAGA = { inline_keyboard: [[{ text: "‹ Menyuga qaytish", callback_data: "menyu" }]] };

const SALOM =
  `Assalomu alaykum! Bu <b>${SHOP.nom}</b> boti.\n\n` +
  `Muhr, shtamp va rekvizit tayyorlaymiz — ${SHOP.muddat}da.\n\n` +
  `Kerakli bo'limni tanlang yoki shunchaki savolingizni yozing:`;

const JAVOB = {
  mahsulot:
    "<b>Nima yasaymiz</b>\n\n" +
    "• MCHJ muhri\n" +
    "• YaTT muhri\n" +
    "• Avtomatik muhr (ichki bo'yoqli)\n" +
    "• Rekvizit shtampi\n" +
    "• Faksimile (imzo nusxasi)\n" +
    "• Datali shtamp: To'landi, Qabul qilindi, Nusxa asli bilan bir xil\n\n" +
    "Ro'yxatda yo'q narsa kerakmi? Yozing — aytamiz.",

  narx:
    "<b>Narxlar</b>\n\n" +
    "Narx muhr turiga va korpusiga bog'liq, shuning uchun aniq raqamni suhbatda aytamiz.\n\n" +
    "Sizga nima kerakligini yozing — bir daqiqada narxini aytaman.",

  muddat:
    "<b>Qancha vaqtda tayyor</b>\n\n" +
    `Maketni tasdiqlaganingizdan keyin <b>${SHOP.muddat}</b>.\n\n` +
    "Tartib shunday:\n" +
    "1. Guvohnoma yoki eski muhr suratini yuborasiz\n" +
    "2. Maketni ko'rasiz, o'zgartirish bepul\n" +
    "3. Tasdiqlaysiz — tayyorlanadi",

  manzil:
    "<b>Manzil va ish vaqti</b>\n\n" +
    `📍 ${SHOP.manzil}\n` +
    `🕘 ${SHOP.ishVaqti}\n` +
    `📞 ${SHOP.telefon}\n\n` +
    "Yetkazib berish ham bor.",

  buyurtma:
    "<b>Buyurtma berish</b>\n\n" +
    "Quyidagilarni bitta xabarda yozing:\n\n" +
    "• Nima kerak (muhr / shtamp / rekvizit)\n" +
    "• Tashkilot nomi yoki muhrdagi matn\n" +
    "• Telefon raqamingiz\n\n" +
    "Guvohnoma yoki eski muhr surati bo'lsa — shuni yuborsangiz ham bo'ladi.\n\n" +
    "Xabaringiz to'g'ridan-to'g'ri bizga tushadi.",
};

export default async (req) => {
  const ok = () => new Response("ok", { status: 200 });

  if (req.method !== "POST") return ok();

  const TOKEN = env("TELEGRAM_TOKEN");
  const OWNER = env("TELEGRAM_CHAT_ID");
  const SECRET = env("TELEGRAM_WEBHOOK_SECRET");

  if (!TOKEN || !OWNER) return ok();

  // Ixtiyoriy himoya: setWebhook'da secret_token bergan bo'lsangiz ishlaydi.
  if (SECRET && req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const api = (method, body) =>
    fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});

  const send = (chat_id, text, reply_markup) =>
    api("sendMessage", {
      chat_id,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(reply_markup ? { reply_markup } : {}),
    });

  let update;
  try {
    update = await req.json();
  } catch {
    return ok();
  }

  // ── Tugma bosilganda ──
  const cq = update.callback_query;
  if (cq) {
    await api("answerCallbackQuery", { callback_query_id: cq.id });
    const chat = cq.message?.chat?.id;
    if (!chat) return ok();

    if (cq.data === "menyu") await send(chat, SALOM, MENU);
    else if (JAVOB[cq.data]) await send(chat, JAVOB[cq.data], ORQAGA);
    return ok();
  }

  // ── Oddiy xabar ──
  const msg = update.message;
  if (!msg || !msg.chat) return ok();

  const chat = msg.chat.id;
  const text = (msg.text || "").trim();

  if (text === "/start" || text === "/menu" || text === "/help") {
    await send(chat, SALOM, MENU);
    return ok();
  }

  // Egadan kelgan xabarlarga javob bermaymiz.
  if (String(chat) === String(OWNER)) return ok();

  // Mijoz xabarini egaga uzatamiz.
  const from = msg.from || {};
  const ism = esc([from.first_name, from.last_name].filter(Boolean).join(" ") || "Mijoz");
  const username = from.username ? ` (@${esc(from.username)})` : "";
  const havola = `<a href="tg://user?id=${from.id}">${ism}</a>${username}`;

  await api("forwardMessage", {
    chat_id: OWNER,
    from_chat_id: chat,
    message_id: msg.message_id,
  });
  await send(OWNER, `💬 <b>Botga xabar</b> — ${havola}\nJavob berish uchun ismini bosing.`);

  await send(
    chat,
    "Xabaringiz yuborildi ✅\n\nTez orada javob beramiz. Shoshilinch bo'lsa qo'ng'iroq qiling: " +
      SHOP.telefon,
    ORQAGA
  );

  return ok();
};
