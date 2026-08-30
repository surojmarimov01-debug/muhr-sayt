// Telegram bot — avtomat javoblar, menyu va ikki tomonlama yozishma.
// Webhook: https://SIZNING-SAYT/.netlify/functions/telegram

import { buyurtmaHubspotgaYoz } from "../lib/hubspot.mjs";

// ─────────── SOZLAMALAR ───────────
const SHOP = {
  nom: "Shtampchi",
  manzil: "Urganch tuman, Raysentr, Sherdor to'yxonasi yon tomoni",
  ishVaqti: "Dushanba–Shanba, 9:00–18:00",
  // Mijozga KO'RSATILMAYDI: mijoz o'zi qo'ng'iroq qilmasin, biz bog'lanamiz.
  // Shu sababli hozir hech qayerda ishlatilmaydi — kerak bo'lsa qaytarish uchun turibdi.
  telefon: "+998 99 420 11 51",
  operator: "shtampchi_bola", // @ belgisisiz
  muddat: "15 daqiqa",
  sayt: "https://shtampchi-muhr.netlify.app",
};

// Buyurtma boshlanganda ko'rsatiladigan mahsulot rasmlari.
// Fayllar public/ papkasida turadi, Telegram ularni sayt manzilidan oladi.
const RASMLAR = [
  ["muhr-colop-r40-aftomat.jpg", "Avtomat muhr — Colop R40"],
  ["muhr-mouse-r40-aftomat.jpg", "Avtomat muhr — Mouse R40"],
  ["muhr-mexanik.jpg", "Mexanik muhr"],
  ["shtamp-trodat-4924-aftomat.jpg", "Avtomat shtamp — Trodat 4924"],
  ["shtamp-mexanik.jpg", "Mexanik shtamp"],
  ["rekvizit-colop-c50-aftomat.jpg", "Rekvizit shtampi — Colop C50"],
  ["rekvizit-mexanik.jpg", "Rekvizit shtampi — mexanik"],
];
// ──────────────────────────────────

const esc = (s) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// esc() ning teskarisi — HubSpot kabi tashqi tizimlarga HTML belgilarisiz
// toza matn ketishi uchun. &amp; oxirida almashtiriladi, aks holda ikki marta
// ochilib ketadi.
const unEsc = (s) =>
  String(s || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const env = (k) =>
  typeof Netlify !== "undefined" && Netlify.env ? Netlify.env.get(k) : process.env[k];

const MENU = {
  inline_keyboard: [
    [{ text: "🖼 Katalog va narxlar", callback_data: "katalog" }],
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

// ── Katalog: har bir mahsulotning rasmi, o'lchami va narxi. ──
// Fayllar public/ papkasida turadi; manzil ishga tushgan saytdan olinadi
// (BASE), shuning uchun preview va asosiy sayt — ikkalasida ham ishlaydi.
const KATALOG = [
  {
    kalit: "mm",
    fayl: "muhr-mexanik.jpg",
    nom: "Mexanik muhr",
    narx: "70 000 so'm",
    tafsilot: "Dumaloq, 41,5 mm · qo'lda bosiladi · alohida shtempel bo'yoq kerak",
    tugma: "Mexanik muhr · 70 000",
  },
  {
    kalit: "sm",
    fayl: "shtamp-mexanik.jpg",
    nom: "Mexanik shtamp",
    narx: "70 000 so'm",
    tafsilot: "To'rtburchak, 40×50 mm · qo'lda bosiladi",
    tugma: "Mexanik shtamp · 70 000",
  },
  {
    kalit: "rm",
    fayl: "rekvizit-mexanik.jpg",
    nom: "Mexanik rekvizit",
    narx: "70 000 so'm",
    tafsilot: "To'rtburchak, 32×65 mm · qo'lda bosiladi",
    tugma: "Mexanik rekvizit · 70 000",
  },
  {
    kalit: "mc",
    fayl: "muhr-colop-r40-aftomat.jpg",
    nom: "Avtomat muhr — Colop R40",
    narx: "160 000 so'm",
    tafsilot: "Dumaloq · avtomat (ichida bo'yoq) · 5 yil xizmat",
    tugma: "Avtomat muhr R40 · 160 000",
  },
  {
    kalit: "mo",
    fayl: "muhr-mouse-r40-aftomat.jpg",
    nom: "Avtomat muhr — Colop Mouse R40",
    narx: "160 000 so'm",
    tafsilot: "Dumaloq, 41,5 mm · cho'ntak uchun qulay «mouse» korpus",
    tugma: "Avtomat muhr Mouse · 160 000",
  },
  {
    kalit: "rc",
    fayl: "rekvizit-colop-c50-aftomat.jpg",
    nom: "Avtomat rekvizit — Colop C50",
    narx: "160 000 so'm",
    tafsilot: "To'rtburchak, 30×69 mm · avtomat (ichida bo'yoq)",
    tugma: "Avtomat rekvizit C50 · 160 000",
  },
  {
    kalit: "st",
    fayl: "shtamp-trodat-4924-aftomat.jpg",
    nom: "Avtomat shtamp — Ideal Trodat 4924",
    narx: "160 000 so'm",
    tafsilot: "Kvadrat, 40×40 mm · avtomat (ichida bo'yoq)",
    tugma: "Avtomat shtamp 4924 · 160 000",
  },
];

const mahsulotTop = (kalit) => KATALOG.find((m) => m.kalit === kalit) || null;

const KATALOG_SALOM =
  "🖼 <b>Katalog va narxlar</b>\n\n" +
  "Mahsulotni tanlang — rasmi, o'lchami va narxi bilan ko'rsataman:";

const KATALOG_TUGMALAR = {
  inline_keyboard: [
    ...KATALOG.map((m) => [{ text: m.tugma, callback_data: "k_" + m.kalit }]),
    [{ text: "‹ Menyuga qaytish", callback_data: "menyu" }],
  ],
};

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
    "• <b>Mexanik</b> (qo'lda bosiladi) — <b>70 000 so'm</b>\n" +
    "• <b>Avtomat</b> (ichida bo'yoq) — <b>160 000 so'm</b>\n\n" +
    "Muhr ham, shtamp ham, rekvizit ham shu narxda.\n" +
    `Hammasi ${SHOP.muddat}da tayyor.\n\n` +
    "Har bir modelning rasmi va o'lchami — 🖼 <b>Katalog va narxlar</b> bo'limida.\n\n" +
    "Buyurtma berish uchun pastdagi tugmani bosing.",

  muddat:
    "<b>Qancha vaqtda tayyor</b>\n\n" +
    `Maketni tasdiqlaganingizdan keyin <b>${SHOP.muddat}</b>.\n\n` +
    "1. Guvohnoma yoki eski muhr suratini yuborasiz\n" +
    "2. Maketni ko'rasiz, o'zgartirish bepul\n" +
    "3. Tasdiqlaysiz — tayyorlanadi",

  manzil:
    "<b>Manzil va ish vaqti</b>\n\n" +
    manzilMatni +
    `🕘 ${SHOP.ishVaqti}\n\n` +
    "Yetkazib berish ham bor.",

  buyurtma:
    "<b>Buyurtma berish</b>\n\n" +
    "To'rtta qadam, har biriga alohida javob berasiz:\n\n" +
    "1. Qanaqa muhr kerak\n" +
    "2. Firma guvohnomasi (surat)\n" +
    "3. Rahbar passporti yoki ID kartasi (surat)\n" +
    "4. Telefon raqamingiz\n\n" +
    "Boshlash uchun /buyurtma deb yozing.",
};

// ── Buyurtma bosqichlari. Har bir savolda "Buyurtma (N/4)" belgisi bor —
// funksiya holatni saqlamaydi, shuning uchun mijoz javob bergan xabardan
// nechanchi qadamda ekanini shu belgi orqali biladi. ──
const NARX_QISQA =
  "<b>Narxlar</b>\n" +
  "• Mexanik muhr — 70 000 so'mdan\n" +
  "• Avtomat muhr (Colop/Trodat) — 160 000 so'mdan\n" +
  "• Rekvizit shtampi — mexanik 60 000, avtomat 150 000 so'mdan\n" +
  "• Komplekt (muhr + shtamp) — 140 000 / 320 000 so'mdan\n\n" +
  `Hammasi ${SHOP.muddat}da tayyor.`;

const QADAM1 =
  "📝 <b>Buyurtma (1/4)</b>\n\n" +
  "🧾 Qanaqa muhr kerak?\n\n" +
  "Yuqoridagi rasmlardan tanlab yozing yoki o'zingiz ayting — masalan " +
  "\"MCHJ uchun avtomat muhr\" yoki \"rekvizit shtampi\".";

// Mijoz nima buyurtma qilgani keyingi savollarda ham ko'rinib turadi.
// Bu bezak emas: funksiya holatni saqlamagani uchun oxirgi qadamda turni
// aynan shu satrdan qayta o'qiymiz.
const turSatri = (tur) => (tur ? "🧾 Tur: " + esc(tur) + "\n" : "");

const turdan = (matn) => {
  const m = /🧾 Tur:\s*(.+)/.exec(matn || "");
  return m ? m[1].trim() : "";
};

const QADAM2 = (tur) =>
  "📝 <b>Buyurtma (2/4)</b>\n" +
  turSatri(tur) +
  "\n🏢 Firma guvohnomasini yuboring — suratga olib tashlang yoki fayl qilib biriktiring.\n\n" +
  "<i>Muhrdagi matn shundan olinadi, shuning uchun yozuvlar aniq ko'rinsin.</i>";

const QADAM3 = (tur) =>
  "📝 <b>Buyurtma (3/4)</b>\n" +
  turSatri(tur) +
  "\n🪪 Rahbarning passporti yoki ID kartasini yuboring.\n\n" +
  "<i>Muhr qonuniy tayyorlanishi uchun kerak.</i>";

const TUGADI =
  "✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n" +
  `Maketni tayyorlab, tez orada yuboramiz. Tasdiqlaganingizdan keyin ${SHOP.muddat}da tayyor bo'ladi.\n\n` +
  "Rahmat! 🙏";

// Egaga: yangi buyurtma boshlandi. Oqim 1-qadamdan ham, katalogdagi
// «Shuni buyurtma qilaman» tugmasidan ham shu xabarni yuboradi.
const BOSHLANDI = (tur, havola, id) =>
  "🆕 <b>Yangi buyurtma boshlandi</b>\n" + turSatri(tur) + "\n" + havola + "\n#id" + id;

// Xabar egasi haqidagi ma'lumot — mijoz xabarida ham, tugma bosilganda ham
// bir xil ko'rinishda kerak.
const kimdan = (from = {}) => {
  const ismXom = [from.first_name, from.last_name].filter(Boolean).join(" ") || "Mijoz";
  const ism = esc(ismXom);
  const username = from.username ? ` (@${esc(from.username)})` : "";
  return { ismXom, havola: `<a href="tg://user?id=${from.id}">${ism}</a>${username}` };
};

// ── Kalit so'zlar. Tartib muhim: yuqoridagisi avval tekshiriladi. ──
const QOIDALAR = [
  ["katalog", ["katalog", "rasm", "namuna", "modellar", "каталог", "фото"]],
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

  // Katalog rasmlari shu funksiya ishlab turgan saytdan olinadi — deploy
  // preview'da ham, asosiy saytda ham to'g'ri manzil chiqadi.
  const BASE = new URL(req.url).origin;

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

  const rasm = (chat_id, photo, caption, reply_markup) =>
    api("sendPhoto", {
      chat_id,
      photo,
      caption,
      parse_mode: "HTML",
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

  // 4-qadam: Telegram raqamni o'zi yuboradigan tugma.
  // Bu tugma reply_markup ni band qiladi, shuning uchun force_reply bilan
  // birga ishlata olmaymiz — mijoz javobi kontakt xabari bo'lib keladi.
  const kontaktSora = (chat_id, tur) =>
    api("sendMessage", {
      chat_id,
      text:
        "📝 <b>Buyurtma (4/4)</b>\n" +
        turSatri(tur) +
        "\n📞 Telefon raqamingiz kerak — maket tayyor bo'lganda qo'ng'iroq qilamiz.\n\n" +
        "Pastdagi <b>«📱 Raqamni ulashish»</b> tugmasini bosing.",
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [[{ text: "📱 Raqamni ulashish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
        input_field_placeholder: "Yoki raqamni qo'lda yozing",
      },
    });

  // Buyurtma boshlanishi: avval mahsulot rasmlari va narxlar, keyin 1-savol.
  const buyurtmaBoshla = async (chat_id) => {
    const res = await api("sendMediaGroup", {
      chat_id,
      media: RASMLAR.map(([fayl, izoh], i) => ({
        type: "photo",
        media: `${SHOP.sayt}/${fayl}`,
        caption: i === 0 ? NARX_QISQA : izoh,
        parse_mode: i === 0 ? "HTML" : undefined,
      })),
    });
    // Rasmlar yuborilmasa ham buyurtma to'xtamasin — narxlarni matn bilan beramiz.
    if (!res || !res.ok) await send(chat_id, NARX_QISQA);
    await soraw(chat_id, QADAM1);
  };

  // Katalogdagi bitta mahsulot kartochkasi: rasm + o'lchami + narxi.
  const kartochka = (m) =>
    `<b>${esc(m.nom)}</b>\n` +
    `${esc(m.tafsilot)}\n\n` +
    `💰 Narxi: <b>${esc(m.narx)}</b>\n` +
    `⏱ Maket tasdiqlangach — ${SHOP.muddat}da tayyor.`;

  const kartochkaYubor = async (chat_id, m) => {
    const yozuv = kartochka(m);
    const tugmalar = {
      inline_keyboard: [
        [{ text: "📝 Shuni buyurtma qilaman", callback_data: "b_" + m.kalit }],
        [{ text: "‹ Katalogga qaytish", callback_data: "katalog" }],
      ],
    };
    const res = await rasm(chat_id, `${BASE}/${m.fayl}`, yozuv, tugmalar);
    // Rasm yuborilmasa ham mijoz narxni ko'rsin — matn bilan qaytaramiz.
    if (!res || !res.ok) await send(chat_id, yozuv, tugmalar);
  };

  // Katalogdan tanlangan mahsulot bilan buyurtma: tur allaqachon ma'lum,
  // shuning uchun 1-savolni o'tkazib, to'g'ridan-to'g'ri 2-qadamga o'tamiz.
  const katalogdanBuyurtma = async (chat_id, m, from) => {
    const { havola } = kimdan(from);
    await send(OWNER, BOSHLANDI(m.nom, havola, from.id));
    await soraw(chat_id, QADAM2(m.nom));
  };

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
    const tugma = cq.data || "";
    if (tugma === "menyu") await send(chat, SALOM, MENU);
    else if (tugma === "katalog") await send(chat, KATALOG_SALOM, KATALOG_TUGMALAR);
    else if (tugma.startsWith("k_")) {
      // Katalogdan mahsulot tanlandi — rasm, o'lcham va narx.
      const m = mahsulotTop(tugma.slice(2));
      if (m) await kartochkaYubor(chat, m);
      else await send(chat, KATALOG_SALOM, KATALOG_TUGMALAR);
    } else if (tugma.startsWith("b_")) {
      // «Shuni buyurtma qilaman» — tur ma'lum, oqim 2-qadamdan boshlanadi.
      const m = mahsulotTop(tugma.slice(2));
      if (m) await katalogdanBuyurtma(chat, m, cq.from || {});
      else await buyurtmaBoshla(chat);
    } else if (tugma === "buyurtma") await buyurtmaBoshla(chat);
    else if (JAVOB[tugma]) await send(chat, JAVOB[tugma], ORQAGA);
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

  const from = msg.from || {};
  const { ismXom, havola } = kimdan(from);

  // Xabar botning o'z savoliga javobmi? Buni ega shoxobchasidan oldin
  // bilishimiz kerak — ega ham botdan foydalana olsin.
  const javob = msg.reply_to_message;
  const javobMatn = javob ? javob.text || "" : "";
  const qadamMos = javob ? /Buyurtma \((\d)\/4\)/.exec(javobMatn) : null;
  // Ega uchun aniqroq tekshiruv: egaga keladigan bildirishnomada ham
  // "Buyurtma (4/4)" so'zi bor, lekin u "📞" bilan boshlanadi. Botning o'z
  // savoli esa doim "📝 Buyurtma (N/4)" bilan boshlanadi.
  const botSavoli = /^📝 Buyurtma \(\d\/4\)/.test(javobMatn);

  // ── EGA mijozga javob yozganda: mijozga yetkazamiz ──
  // Faqat haqiqiy javob (reply) va botning o'z savoliga emas — aks holda
  // ega ham oddiy mijoz kabi menyu va buyurtma oqimidan foydalanadi.
  if (egaMi && javob && !botSavoli) {
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
    return ok();
  }

  // ── Buyruqlar (ega uchun ham ishlaydi — o'zi tekshirib ko'rsin) ──
  if (matn === "/start" || matn === "/menu" || matn === "/help") {
    await send(chat, SALOM, MENU);
    return ok();
  }

  if (matn === "/buyurtma") {
    await buyurtmaBoshla(chat);
    return ok();
  }

  // ── Bosqichma-bosqich buyurtma oqimi ──
  //
  // Funksiya holatni saqlamaydi. Shuning uchun mijoz nechanchi qadamda
  // ekani botning o'z savolidagi "Buyurtma (N/4)" belgisidan o'qiladi —
  // mijoz o'sha savolga javob qilib yozadi (force_reply).
  //
  // 4-qadam istisno: u yerda kontakt tugmasi turadi, tugma bosilganda
  // kelgan xabarda javob bog'lanishi bo'lmaydi. Shuning uchun kontakt
  // xabari alohida, oqimdan oldin tekshiriladi.

  // 4-qadam: raqam tugma orqali keldi
  if (msg.contact) {
    const raqam = msg.contact.phone_number || "";
    await send(chat, TUGADI, { remove_keyboard: true });
    await send(chat, "Yana savolingiz bo'lsa — quyidagidan tanlang:", MENU);
    await send(
      OWNER,
      "📞 <b>Buyurtma (4/4) — telefon</b>\n" +
        esc(raqam) +
        "\n\n" +
        havola +
        "\n#id" +
        from.id +
        "\n\n<i>Javob berish uchun shu xabarga reply yozing.</i>"
    );

    // HubSpot CRM — best-effort, mijoz/ega xabarlaridan keyin.
    // Kontakt tugmasidan kelgan xabarda javob bog'lanishi yo'q, shuning
    // uchun muhr turini bu yerdan o'qib bo'lmaydi — u Telegramda,
    // #id belgisi bo'yicha topiladi.
    await buyurtmaHubspotgaYoz({
      tur: null,
      izoh: "Tur va hujjatlar Telegramda — #id" + from.id,
      telefon: raqam,
      ism: ismXom,
    });
    return ok();
  }

  if (qadamMos) {
    const qadam = Number(qadamMos[1]);
    // Muhr turi 1-qadamda aytilgan va shundan keyingi har bir savol matnida
    // ko'chib yuradi — shu yerda qayta o'qiladi.
    const tur = turdan(javob.text);

    if (matn === "/bekor" || matn === "/start" || matn === "/menu") {
      await send(chat, SALOM, MENU);
      return ok();
    }

    // Mijoz surat yoki fayl yubordimi?
    const hujjatBor = Boolean(msg.photo || msg.document);
    const qisqa = matn.slice(0, 300);

    // 1-qadam: qanaqa muhr kerak
    if (qadam === 1) {
      if (!qisqa) {
        await soraw(chat, QADAM1);
        return ok();
      }
      await send(OWNER, BOSHLANDI(qisqa, havola, from.id));
      await soraw(chat, QADAM2(qisqa));
      return ok();
    }

    // 2 va 3-qadam: hujjatlar
    if (qadam === 2 || qadam === 3) {
      const nomi = qadam === 2 ? "Firma guvohnomasi" : "Rahbar passporti / ID kartasi";
      const belgi = `\n\n${havola}\n#id${from.id}`;

      if (hujjatBor) {
        // Suratni egaga nusxalaymiz — izoh bilan, kimdan kelgani ko'rinsin.
        await api("copyMessage", {
          chat_id: OWNER,
          from_chat_id: chat,
          message_id: msg.message_id,
          caption: `📎 <b>${nomi}</b>` + belgi,
          parse_mode: "HTML",
        });
      } else {
        // Hujjat o'rniga matn yozgan bo'lsa ham oqim to'xtamaydi —
        // egaga xabar beramiz, u mijoz bilan gaplashib oladi.
        await send(
          OWNER,
          `⚠️ <b>${nomi}</b> — hujjat o'rniga yozdi:\n` +
            esc(qisqa || "(bo'sh xabar)") +
            belgi
        );
      }

      if (qadam === 2) await soraw(chat, QADAM3(tur));
      else await kontaktSora(chat, tur);
      return ok();
    }

    // 4-qadam: tugma o'rniga qo'lda yozilgan raqam
    if (qadam === 4) {
      await send(chat, TUGADI, { remove_keyboard: true });
      await send(chat, "Yana savolingiz bo'lsa — quyidagidan tanlang:", MENU);
      await send(
        OWNER,
        "📞 <b>Buyurtma (4/4) — telefon</b>\n" +
          esc(qisqa || "(bo'sh)") +
          "\n\n" +
          havola +
          "\n#id" +
          from.id +
          "\n\n<i>Javob berish uchun shu xabarga reply yozing.</i>"
      );

      // HubSpot CRM — best-effort, mijoz/ega xabarlaridan keyin.
      await buyurtmaHubspotgaYoz({
        tur: unEsc(tur) || null,
        izoh: "Hujjatlar Telegramda — #id" + from.id,
        telefon: qisqa,
        ism: ismXom,
      });
      return ok();
    }
  }

  // ── EGA oddiy xabar yozdi ──
  // Bu mijozga javob emas, shuning uchun uni o'ziga forward qilmaymiz —
  // qisqa eslatma beramiz.
  if (egaMi) {
    await send(
      chat,
      "Menyuni ochish uchun /menu bosing.\n\n" +
        "Mijozga javob yozish uchun — <b>#id</b> raqami bor bildirishnoma xabariga " +
        "reply qiling.",
      MENU
    );
    return ok();
  }

  const kalit = matn ? javobTop(matn) : null;

  // Avtomat javob
  if (kalit === "katalog") {
    await send(chat, KATALOG_SALOM, KATALOG_TUGMALAR);
  } else if (kalit) {
    await send(chat, JAVOB[kalit], MENU);
  } else {
    await send(
      chat,
      "Xabaringiz yuborildi ✅\n\nTez orada javob beramiz — o'zimiz bog'lanamiz.",
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

