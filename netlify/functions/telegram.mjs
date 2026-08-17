// Telegram bot — avtomat javoblar, menyu va ikki tomonlama yozishma.
// Webhook: https://SIZNING-SAYT/.netlify/functions/telegram

import { buyurtmaHubspotgaYoz } from "../lib/hubspot.mjs";

// ─────────── SOZLAMALAR ───────────
const SHOP = {
  nom: "Shtampchi",
  manzil: "Urganch tuman, Raysentr, Sherdor to'yxonasi yon tomoni",
  ishVaqti: "Dushanba–Shanba, 9:00–18:00",
  telefon: "+998 99 420 11 51",
  operator: "shtampchi_bola", // @ belgisisiz
  muddat: "15 daqiqa",
};
// ──────────────────────────────────

const esc = (s) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
  `Bo'limni tanlang yoki savolingizni yozing — javob beraman:`;

const manzilMatni = SHOP.manzil
  ? `📍 ${SHOP.manzil}\n`
  : `📍 Manzilni operatordan so'rang\n`;

const JAVOB = {
  mahsulot:
    "<b>Nima yasaymiz</b>\n\n" +
    "• MCHJ muhri\n" +
    "• YaTT muhri\n" +
    "• Avtomatik muhr (ichki bo'yoqli)\n" +
    "• Rekvizit shtampi\n" +
    "• Faksimile (imzo nusxasi)\n" +
    "• Datali shtamp: To'landi, Qabul qilindi, Nusxa asli bilan bir xil\n\n" +
    "Qaysi biri kerakligini yozing — narxini aytaman.",

  narx:
    "<b>Narxlar</b>\n\n" +
    "• Mexanik — <b>70 000 so'mdan</b> (komplekt: muhr + shtamp — 140 000 dan)\n" +
    "• Avtomat — <b>160 000 so'm</b> (komplekt: muhr + shtamp — 320 000)\n" +
    "• Faksimile / datali shtamp — mexanik 60 000 dan, avtomat 150 000 dan\n\n" +
    `Hammasi ${SHOP.muddat}da tayyor.\n\n` +
    "Sizga nima kerakligini yozing — aniq narxini aytaman.\n" +
    `Yoki qo'ng'iroq qiling: ${SHOP.telefon}`,

  muddat:
    "<b>Qancha vaqtda tayyor</b>\n\n" +
    `Maketni tasdiqlaganingizdan keyin <b>${SHOP.muddat}</b>.\n\n` +
    "1. Guvohnoma yoki eski muhr suratini yuborasiz\n" +
    "2. Maketni ko'rasiz, o'zgartirish bepul\n" +
    "3. Tasdiqlaysiz — tayyorlanadi",

  manzil:
    "<b>Manzil va ish vaqti</b>\n\n" +
    manzilMatni +
    `🕘 ${SHOP.ishVaqti}\n` +
    `📞 ${SHOP.telefon}\n\n` +
    "Yetkazib berish ham bor.",

  buyurtma:
    "<b>Buyurtma berish</b>\n\n" +
    "Bitta xabarda yozing:\n\n" +
    "• Nima kerak (muhr / shtamp / rekvizit)\n" +
    "• Tashkilot nomi yoki muhrdagi matn\n" +
    "• Telefon raqamingiz\n\n" +
    "Guvohnoma yoki eski muhr surati bo'lsa — shuni yuboring.",
};

// ── Kalit so'zlar. Tartib muhim: yuqoridagisi avval tekshiriladi. ──
const QOIDALAR = [
  ["narx", ["narx", "qancha turadi", "qanchaga", "pochom", "pochomga", "цен", "стоим", "сколько", "price"]],
  ["muddat", ["qancha vaqt", "muddat", "qachon tayyor", "tez", "necha kun", "necha soat", "срок", "когда", "быстро"]],
  ["manzil", ["manzil", "qayerda", "qayersiz", "joylash", "adres", "lokatsiya", "mo'ljal", "moljal", "адрес", "где", "ish vaqti", "soat nechi"]],
  ["buyurtma", ["buyurtma", "zakaz", "заказ", "buyurtma bermoq", "olmoqchi", "kerak edi"]],
  ["mahsulot", ["muhr", "muhr", "shtamp", "pechat", "печат", "штамп", "rekvizit", "faksimile", "faksimil", "mchj", "yatt", "datali"]],
];

function javobTop(matn) {
  const t = matn.toLowerCase().replace(/[''`ʻʼ]/g, "'");
  for (const [kalit, sozlar] of QOIDALAR) {
    if (sozlar.some((s) => t.includes(s))) return kalit;
  }
  return null;
}

export default async (req) => {
  const ok = () => new Response("ok", { status: 200 });
  if (req.method !== "POST") return ok();

  const TOKEN = env("TELEGRAM_TOKEN");
  const OWNER = env("TELEGRAM_CHAT_ID");
  const SECRET = env("TELEGRAM_WEBHOOK_SECRET");
  if (!TOKEN || !OWNER) return ok();

  if (!SECRET) {
    console.warn(
      "[telegram] TELEGRAM_WEBHOOK_SECRET o'rnatilmagan — webhook himoyasiz. Netlify env'ga qo'shing."
    );
  }

  if (SECRET && req.headers.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const api = async (method, body) => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let out = null;
      try {
        out = await res.json();
      } catch (e) {
        console.error(`[telegram] ${method}: javobni o'qib bo'lmadi`, res.status, e);
        return null;
      }
      if (!out.ok) {
        console.error(`[telegram] ${method} xato`, res.status, out.description || out);
      }
      return out;
    } catch (e) {
      console.error(`[telegram] ${method} so'rovi muvaffaqiyatsiz`, e);
      return null;
    }
  };

  const send = (chat_id, text, reply_markup) =>
    api("sendMessage", {
      chat_id,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(reply_markup ? { reply_markup } : {}),
    });

  const soraw = (chat_id, text) =>
    api("sendMessage", {
      chat_id,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { force_reply: true, input_field_placeholder: "Shu yerga yozing…" },
    });

  let update;
  try {
    update = await req.json();
  } catch (e) {
    console.error("[telegram] update JSON o'qib bo'lmadi", e);
    return ok();
  }

  console.log(
    "[telegram] update",
    update.callback_query ? "callback_query" : update.message ? "message" : "boshqa"
  );

  // ── Tugma bosilganda ──
  const cq = update.callback_query;
  if (cq) {
    // Telegram spinnerini to'xtatish uchun har doim javob beramiz.
    await api("answerCallbackQuery", { callback_query_id: cq.id });
    const chat = cq.message?.chat?.id;
    if (!chat) return ok();
    if (cq.data === "menyu") await send(chat, SALOM, MENU);
    else if (cq.data === "buyurtma")
      await soraw(
        chat,
        "📝 <b>Buyurtma (1/3)</b>\n\n🧾 Nima kerak? (masalan: dumaloq muhr, shtamp, rekvizit)"
      );
    else if (JAVOB[cq.data]) await send(chat, JAVOB[cq.data], ORQAGA);
    else {
      // Noma'lum tugma — menyuni qaytaramiz.
      console.warn("[telegram] noma'lum callback_data:", cq.data);
      await send(chat, SALOM, MENU);
    }
    return ok();
  }

  const msg = update.message;
  if (!msg || !msg.chat) return ok();

  const chat = msg.chat.id;
  const matn = (msg.text || msg.caption || "").trim();
  const egaMi = String(chat) === String(OWNER);

  // ── EGA javob yozganda: mijozga yetkazamiz ──
  if (egaMi) {
    const javob = msg.reply_to_message;
    if (javob) {
      // Mijoz ID sini bir necha yo'l bilan topamiz:
      // 1) forward_from.id, 2) matndagi #id, 3) captiondagi #id.
      let mijozId = javob.forward_from?.id || null;
      if (!mijozId) {
        const belgiMatn = (javob.text || "").match(/#id(\d+)/);
        if (belgiMatn) mijozId = belgiMatn[1];
      }
      if (!mijozId) {
        const belgiCaption = (javob.caption || "").match(/#id(\d+)/);
        if (belgiCaption) mijozId = belgiCaption[1];
      }
      if (mijozId) {
        const res = await api("copyMessage", {
          chat_id: mijozId,
          from_chat_id: chat,
          message_id: msg.message_id,
        });
        if (res && res.ok) {
          console.log(`[telegram] egadan mijozga (#id${mijozId}) javob yetkazildi`);
          await send(chat, "✅ Mijozga yuborildi.");
        } else {
          console.error(`[telegram] mijozga (#id${mijozId}) yuborib bo'lmadi`, res);
          await send(
            chat,
            "⚠️ Mijozga yuborib bo'lmadi. Mijoz botni bloklagan bo'lishi mumkin."
          );
        }
      } else {
        console.warn("[telegram] egadan javob: mijoz ID topilmadi");
        await send(
          chat,
          "Mijozni aniqlay olmadim. Iltimos, <b>#id</b> raqami bor bildirishnoma xabariga " +
            "(forward qilingan xabarning o'ziga emas) reply qilib javob yozing."
        );
      }
    }
    return ok();
  }

  // ── MIJOZ xabari ──
  if (matn === "/start" || matn === "/menu" || matn === "/help") {
    await send(chat, SALOM, MENU);
    return ok();
  }

  if (matn === "/buyurtma") {
    await soraw(
      chat,
      "📝 <b>Buyurtma (1/3)</b>\n\n🧾 Nima kerak? (masalan: dumaloq muhr, shtamp, rekvizit)"
    );
    return ok();
  }

  const from = msg.from || {};
  const ism = esc([from.first_name, from.last_name].filter(Boolean).join(" ") || "Mijoz");
  const username = from.username ? ` (@${esc(from.username)})` : "";
  const havola = `<a href="tg://user?id=${from.id}">${ism}</a>${username}`;

  // ── Bosqichma-bosqich buyurtma oqimi ──
  const javob = msg.reply_to_message;
  const oqimda = javob && /Buyurtma \(\d\/3\)/.test(javob.text || "");
  if (oqimda) {
    if (matn === "/bekor" || matn === "/start" || matn === "/menu") {
      await send(chat, SALOM, MENU);
      return ok();
    }

    const turBor = /🧾 Tur:\s*(.+)/.exec(javob.text);
    const matnBor = /✍️ Matn:\s*(.+)/.exec(javob.text);
    const ans = matn.slice(0, 300);

    if (!turBor) {
      await soraw(
        chat,
        "🧾 Tur: " +
          esc(ans) +
          "\n\n📝 <b>Buyurtma (2/3)</b>\n✍️ Muhr/shtampdagi matn yoki tashkilot nomini yozing:"
      );
      return ok();
    } else if (!matnBor) {
      await soraw(
        chat,
        "🧾 Tur: " +
          esc(turBor[1].trim()) +
          "\n✍️ Matn: " +
          esc(ans) +
          "\n\n📝 <b>Buyurtma (3/3)</b>\n📞 Telefon raqamingizni yozing:"
      );
      return ok();
    } else {
      await send(
        chat,
        "✅ <b>Buyurtmangiz qabul qilindi!</b>\n\nTez orada siz bilan bog'lanamiz. Rahmat! 🙏",
        MENU
      );
      await send(
        OWNER,
        "🆕 <b>Yangi buyurtma</b>\n\n" +
          "🧾 Tur: " +
          esc(turBor[1].trim()) +
          "\n" +
          "✍️ Matn: " +
          esc(matnBor[1].trim()) +
          "\n" +
          "📞 Tel: " +
          esc(ans) +
          "\n\n" +
          havola +
          "\n#id" +
          from.id +
          "\n\n<i>Javob berish uchun shu xabarga reply yozing.</i>"
      );

      // HubSpot CRM'ga yozamiz — best-effort, mijoz/ega xabarlaridan keyin.
      await buyurtmaHubspotgaYoz({
        tur: turBor[1].trim(),
        izoh: matnBor[1].trim(),
        telefon: ans,
        ism,
      });
      return ok();
    }
  }

  const kalit = matn ? javobTop(matn) : null;

  // Avtomat javob
  if (kalit) {
    await send(chat, JAVOB[kalit], MENU);
  } else {
    await send(
      chat,
      "Xabaringiz yuborildi ✅\n\nTez orada javob beramiz. Shoshilinch bo'lsa: " + SHOP.telefon,
      MENU
    );
  }

  // Egaga xabar — har doim, mijoz yo'qolmasin.
  await api("forwardMessage", {
    chat_id: OWNER,
    from_chat_id: chat,
    message_id: msg.message_id,
  });
  await send(
    OWNER,
    (kalit ? `🤖 <b>Avtomat javob berildi</b> (${kalit})` : `❗ <b>Javob kerak</b>`) +
      `\n${havola}\n#id${from.id}\n\n<i>Javob berish uchun shu xabarga reply yozing.</i>`
  );

  return ok();
};

