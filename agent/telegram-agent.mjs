#!/usr/bin/env node
// Shtampchi Telegram agent — kompyuterdagi agentni Telegram orqali boshqarish.
//
// Ishlashi: telefoningizdan botga oddiy gap bilan yozasiz ("Ish stolidagi
// Excel fayllarni sanab ber"). Bu dastur kompyuterda turib xabarni oladi,
// Claude agentiga beradi, agent kompyuterda bajaradi, javob Telegramga
// qaytadi. Fayl o'zgartirish yoki buyruq bajarishdan oldin Telegramda
// tugmalar bilan ruxsat so'raydi.
//
// Ishga tushirish: boshla-telegram.cmd (Windows) yoki `node telegram-agent.mjs`
// Batafsil: README.md, "Telegram orqali boshqarish" bo'limi.

import { query, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { randomInt, randomBytes } from "node:crypto";
import { kotibYarat } from "./kotib.mjs";

const BU_PAPKA = dirname(fileURLToPath(import.meta.url));

// ─────────────── Ranglar (terminal uchun) ───────────────
const rang = {
  ochiq: (s) => `\x1b[2m${s}\x1b[0m`,
  kok: (s) => `\x1b[36m${s}\x1b[0m`,
  yashil: (s) => `\x1b[32m${s}\x1b[0m`,
  sariq: (s) => `\x1b[33m${s}\x1b[0m`,
  qizil: (s) => `\x1b[31m${s}\x1b[0m`,
  qalin: (s) => `\x1b[1m${s}\x1b[0m`,
};
const vaqt = () => new Date().toLocaleTimeString("uz-UZ", { hour12: false });
const log = (...s) => console.log(rang.ochiq(`[${vaqt()}]`), ...s);

// ─────────────── Sirlar: API kalit va bot tokeni ───────────────

function fayldanOqi(nomi) {
  const yol = resolve(BU_PAPKA, nomi);
  if (!existsSync(yol)) return "";
  return readFileSync(yol, "utf8").replace(/^\uFEFF/, "").trim();
}

const KALIT_FAYLI = resolve(BU_PAPKA, "kalit.txt");
const TOKEN_FAYLI = resolve(BU_PAPKA, "telegram-token.txt");

if (!process.env.ANTHROPIC_API_KEY) {
  const k = fayldanOqi("kalit.txt");
  if (k) process.env.ANTHROPIC_API_KEY = k;
}
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || fayldanOqi("telegram-token.txt");

// ─────────────── Sozlama ───────────────

const SOZLAMA_YOLI = resolve(BU_PAPKA, "telegram-sozlama.json");

const SUKUT = {
  // Agent qaysi papkada ishlaydi. "~" — foydalanuvchi papkasi (C:\Users\Ism).
  ishPapkasi: "~",
  qoshimchaPapkalar: [],
  // Telegramdan yuborilgan fayllar shu yerga tushadi.
  qabulPapkasi: "~/Downloads/Telegram-agent",
  // Botni boshqara oladigan Telegram foydalanuvchi raqamlari (ID).
  // Bo'sh bo'lsa, dastur ishga tushganda juftlash kodi beradi.
  egalar: [],
  // Har safar so'ramasdan bajariladigan asboblar, masalan ["Write", "Edit"].
  soramasdanBajarsin: [],
  model: "",
  // AI kotib: botga egadan boshqa odam yozsa, egasi nomidan javob beradi.
  // Kotib faqat gaplashadi — kompyuterga tegolmaydi. Ko'rsatma: kotib.txt
  kotib: true,
  kotibModel: "claude-opus-5-5",
  kotibKunlikLimit: 30, // bir odamga kuniga nechta AI javob
  kotibKunlikJami: 300, // hammaga birgalikda kuniga nechta AI javob
  toxtatilganlar: [], // AI javob bermaydigan odamlar (ID) — egasi o'zi yozadi
};

function sozlamaniOqi() {
  if (!existsSync(SOZLAMA_YOLI)) return { ...SUKUT };
  try {
    return { ...SUKUT, ...JSON.parse(readFileSync(SOZLAMA_YOLI, "utf8").replace(/^\uFEFF/, "")) };
  } catch (e) {
    console.log(rang.qizil(`telegram-sozlama.json o'qilmadi (${e.message}).`));
    console.log("Faylni tuzating yoki o'chirib yuboring — dastur yangisini yaratadi.");
    process.exit(2);
  }
}

function sozlamaniYoz() {
  writeFileSync(SOZLAMA_YOLI, JSON.stringify(sozlama, null, 2) + "\n", "utf8");
}

const papka = (p) =>
  p === "~" || p.startsWith("~/") || p.startsWith("~\\")
    ? join(homedir(), p.slice(1))
    : resolve(BU_PAPKA, p);

const sozlama = sozlamaniOqi();
if (!existsSync(SOZLAMA_YOLI)) sozlamaniYoz();

const ISH_PAPKASI = papka(sozlama.ishPapkasi);
const QOSHIMCHA = (sozlama.qoshimchaPapkalar || []).map(papka);
const QABUL_PAPKASI = papka(sozlama.qabulPapkasi);
const egalar = new Set((sozlama.egalar || []).map(Number));

// ─────────────── Telegram API ───────────────

// Sinov uchun boshqa manzilga yo'naltirish mumkin; odatda tegmang.
const API_ASOS = process.env.TELEGRAM_API_ASOS || "https://api.telegram.org";

class TelegramXato extends Error {
  constructor(tavsif, kod) {
    super(tavsif);
    this.kod = kod;
  }
}

async function tg(usul, maydonlar = {}) {
  const res = await fetch(`${API_ASOS}/bot${TOKEN}/${usul}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(maydonlar),
  });
  const javob = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  if (!javob.ok) throw new TelegramXato(javob.description || "noma'lum xato", javob.error_code ?? res.status);
  return javob.result;
}

// Telegram bitta xabarda 4096 belgidan ko'p qabul qilmaydi.
function bolaklarga(matn, hajm = 4000) {
  const bolaklar = [];
  let qolgan = String(matn);
  while (qolgan.length > hajm) {
    let kesim = qolgan.lastIndexOf("\n", hajm);
    if (kesim < hajm / 2) kesim = hajm;
    bolaklar.push(qolgan.slice(0, kesim));
    qolgan = qolgan.slice(kesim).replace(/^\n/, "");
  }
  if (qolgan.trim()) bolaklar.push(qolgan);
  return bolaklar.length ? bolaklar : ["(bo'sh javob)"];
}

async function yubor(chatId, matn, qoshimcha = {}) {
  let oxirgi = null;
  for (const bolak of bolaklarga(matn)) {
    oxirgi = await tg("sendMessage", {
      chat_id: chatId,
      text: bolak,
      disable_web_page_preview: true,
      ...qoshimcha,
    });
  }
  return oxirgi;
}

async function tahrirla(chatId, xabarId, matn, qoshimcha = {}) {
  try {
    await tg("editMessageText", {
      chat_id: chatId,
      message_id: xabarId,
      text: bolaklarga(matn)[0],
      disable_web_page_preview: true,
      ...qoshimcha,
    });
  } catch (e) {
    // "message is not modified" — matn o'zgarmagan, bu xato emas.
    if (!/not modified/i.test(e.message)) log(rang.sariq(`Xabarni yangilab bo'lmadi: ${e.message}`));
  }
}

async function faylYubor(chatId, faylYoli, izoh = "") {
  const forma = new FormData();
  forma.append("chat_id", String(chatId));
  if (izoh) forma.append("caption", izoh.slice(0, 1000));
  forma.append("document", new Blob([readFileSync(faylYoli)]), basename(faylYoli));
  const res = await fetch(`${API_ASOS}/bot${TOKEN}/sendDocument`, { method: "POST", body: forma });
  const javob = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }));
  if (!javob.ok) throw new TelegramXato(javob.description || "yuborilmadi", javob.error_code);
}

// Telegramdan kelgan faylni kompyuterga yuklab oladi.
async function faylYuklab(fileId, nomi) {
  const f = await tg("getFile", { file_id: fileId });
  const res = await fetch(`${API_ASOS}/file/bot${TOKEN}/${f.file_path}`);
  if (!res.ok) throw new Error(`fayl yuklanmadi (HTTP ${res.status})`);
  mkdirSync(QABUL_PAPKASI, { recursive: true });
  const toza = (nomi || basename(f.file_path)).replace(/[\\/:*?"<>|]/g, "_");
  let yol = join(QABUL_PAPKASI, toza);
  if (existsSync(yol)) yol = join(QABUL_PAPKASI, `${Date.now()}-${toza}`);
  writeFileSync(yol, Buffer.from(await res.arrayBuffer()));
  return yol;
}

// ─────────────── Asboblar va ruxsat ───────────────

// Faqat o'qiydigan asboblar — hech narsani buzmaydi, so'ralmaydi.
// fayl_yubor ham shu yerda: u faylni faqat egasining o'ziga yuboradi.
// WebFetch bu ro'yxatda YO'Q: u kompyuterdagi ma'lumotni manzil ichiga
// qo'shib begona saytga jo'natishi mumkin, shuning uchun har safar so'raladi.
// ToolSearch — boshqa asboblarning tavsifini yuklaydi, o'zi hech narsa qilmaydi.
const XAVFSIZ = new Set([
  "Read", "Glob", "Grep", "WebSearch", "ToolSearch",
  "TodoWrite", "Task", "NotebookRead",
  "mcp__telegram__fayl_yubor",
]);
const RUXSAT_ETILGAN = [...XAVFSIZ];

// Agentning o'z sirlari: agent ularni o'qimaydi va Telegramga yubormaydi.
const MAXFIY_FAYLLAR = new Set([KALIT_FAYLI, TOKEN_FAYLI].map((p) => resolve(p).toLowerCase()));
// Fayl nomi alohida so'z bo'lib kelsa ushlanadi ("hisob-kalit.txt" ushlanmaydi).
const MAXFIY_NOMLAR = [KALIT_FAYLI, TOKEN_FAYLI].map(
  (p) => new RegExp(`(^|[\\\\/"'\\s=:])${basename(p).toLowerCase().replace(/[.-]/g, "\\$&")}($|["'\\s;|&>)])`)
);

function buyruqniKorsat(nomi, kirish) {
  if (nomi === "Bash") return kirish.command ?? "";
  if (nomi === "PowerShell") return kirish.command ?? "";
  if (nomi === "Write") return `fayl yozish: ${kirish.file_path ?? ""}`;
  if (nomi === "Edit" || nomi === "MultiEdit") return `fayl tahriri: ${kirish.file_path ?? ""}`;
  if (nomi === "NotebookEdit") return `notebook tahriri: ${kirish.notebook_path ?? ""}`;
  const q = JSON.stringify(kirish);
  return q.length > 300 ? q.slice(0, 300) + "…" : q;
}

const QOIDALAR = `
Sen "Shtampchi" do'koni egasining shaxsiy kompyuter yordamchisisan. Egasi
senga Telegram orqali, ko'pincha telefonidan yozadi va kompyuter ekranini
ko'rmaydi. Sen esa uning kompyuterida ishlaysan.

TIL: Har doim o'zbek tilida javob ber. Texnik atamalarni oddiy tushuntir —
egasi dasturchi emas.

USLUB: Javobing Telegram xabari bo'lib boradi, shuning uchun:
- Qisqa yoz. Nima qilganingni bir-ikki gapda ayt, keyin natijani ber.
- Oddiy matn yoz. Markdown jadval, sarlavha (#) va ** belgilarini ishlatma —
  Telegramda ular belgicha ko'rinadi. Ro'yxat kerak bo'lsa "- " bilan yoz.

FAYLLAR:
- Natija fayl bo'lsa (hujjat, jadval, rasm), uni mcp__telegram__fayl_yubor
  asbobi bilan egasiga yubor — u kompyuterdagi faylni ocha olmaydi.
- Egasi fayl yuborsa, u kompyuterga saqlanadi va yo'li xabarda yoziladi.
- kalit.txt, telegram-token.txt, parollar va boshqa maxfiy fayllarning
  ichidagini hech qachon Telegramga yozma va yuborma.

ISHLASH TARTIBI:
- Avval o'qib ko'r, keyin o'zgartir.
- O'chirish yoki almashtirishdan oldin nima yo'qolishini ayt.
- Fayl o'zgartirish va buyruqlar uchun egasidan Telegramda ruxsat so'raladi.
  Rad etilsa, boshqa yo'l qidir yoki nima qilish mumkinligini ayt.
- Xato chiqsa yashirma — nima bo'lganini va nima qilish kerakligini ayt.
- Ish tugaganda natijani aniq ayt: nima o'zgardi, qayerda turibdi.

CHEGARA: Faqat ruxsat berilgan papkalarda ishla. Tashqariga chiqish kerak
bo'lsa, so'ra.
`.trim();

// ─────────────── Har bir suhbat holati ───────────────

const holatlar = new Map();
function holat(chatId) {
  if (!holatlar.has(chatId)) {
    holatlar.set(chatId, {
      sessiyaId: null,
      band: false,
      abort: null,
      doimiy: new Set(sozlama.soramasdanBajarsin || []),
    });
  }
  return holatlar.get(chatId);
}

// Javob kutilayotgan ruxsat so'rovlari: kalit → { chatId, xabarId, hal }.
const kutilayotgan = new Map();
const RUXSAT_MUDDATI_MS = 10 * 60 * 1000;

// Telegramga tugmali so'rov yuboradi va javobni kutadi.
// Natija: "ha", "doim", "yoq" yoki "vaqt" (10 daqiqada javob bo'lmadi).
function ruxsatSora(chatId, h, nomi, kirish, signal) {
  return new Promise((hal) => {
    const kalit = randomBytes(6).toString("hex");
    const matn = `⚠ Agent ruxsat so'rayapti (${nomi}):\n\n` + buyruqniKorsat(nomi, kirish).slice(0, 3000);
    const sorov = { chatId, xabarId: null, matn, yakunla: null };
    let tugadi = false;
    let izohi = "";

    // Har qanday yo'l bilan (tugma, muddat, /toxtat) faqat bir marta tugaydi.
    const yakunla = (javob, izoh) => {
      if (tugadi) return;
      tugadi = true;
      izohi = izoh;
      clearTimeout(taymer);
      kutilayotgan.delete(kalit);
      if (sorov.xabarId) tahrirla(chatId, sorov.xabarId, `${matn}\n\n${izoh}`);
      hal(javob);
    };
    sorov.yakunla = yakunla;
    kutilayotgan.set(kalit, sorov);

    const taymer = setTimeout(() => yakunla("vaqt", "⌛ 10 daqiqa javob bo'lmadi — rad etildi."), RUXSAT_MUDDATI_MS);
    const toxtatildi = () => yakunla("yoq", "⏹ Ish to'xtatildi — rad etildi.");
    signal?.addEventListener("abort", toxtatildi, { once: true });
    h.abort?.signal.addEventListener("abort", toxtatildi, { once: true });

    yubor(chatId, matn, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Ha", callback_data: `r:${kalit}:ha` },
            { text: "❌ Yo'q", callback_data: `r:${kalit}:yoq` },
          ],
          [{ text: `♾ Doim ruxsat (${nomi})`, callback_data: `r:${kalit}:doim` }],
        ],
      },
    })
      .then((xabar) => {
        sorov.xabarId = xabar.message_id;
        // Xabar yetib borguncha so'rov tugab qolgan bo'lsa, tugmalarni olib tashlaymiz.
        if (tugadi) tahrirla(chatId, xabar.message_id, `${matn}\n\n${izohi}`);
      })
      .catch((e) => {
        log(rang.qizil(`Ruxsat so'rovini yuborib bo'lmadi: ${e.message}`));
        yakunla("yoq", "❌ Rad etildi.");
      });
  });
}

// PreToolUse hook — har bir asbob chaqiruvidan oldin ishlaydi.
// canUseTool emas: uni allowedTools va sozlama fayllaridagi qoidalar chetlab
// o'tishi mumkin. Hook esa har safar, istisnosiz chaqiriladi.
const darvoza = (chatId, h) => async (kirish, _id, { signal } = {}) => {
  const nomi = kirish.tool_name;
  const parametrlar = kirish.tool_input ?? {};
  const qaror = (ruxsat, sabab) => ({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: ruxsat ? "allow" : "deny",
      permissionDecisionReason: sabab,
    },
  });

  // API kalit va bot tokeni fayllariga hech qaysi asbob tegmaydi — o'qish ham.
  const kirishMatni = JSON.stringify(parametrlar).toLowerCase();
  if (MAXFIY_NOMLAR.some((n) => n.test(kirishMatni))) {
    log(rang.qizil(`  ✗ ${nomi}: maxfiy faylga murojaat — rad etildi.`));
    return qaror(false, "Bu agentning maxfiy fayli (API kalit yoki bot tokeni). Unga tegish mumkin emas.");
  }

  if (XAVFSIZ.has(nomi)) return { continue: true };
  if (h.doimiy.has(nomi)) {
    log(rang.ochiq(`  ↳ ${nomi} (doimiy ruxsat): ${buyruqniKorsat(nomi, parametrlar)}`));
    return qaror(true, "Egasi bu turdagi ishga doimiy ruxsat bergan.");
  }

  log(rang.sariq(`  ? ${nomi}: ${buyruqniKorsat(nomi, parametrlar)}`));
  const javob = await ruxsatSora(chatId, h, nomi, parametrlar, signal);
  if (javob === "doim") {
    h.doimiy.add(nomi);
    return qaror(true, "Egasi ruxsat berdi (doim).");
  }
  if (javob === "ha") return qaror(true, "Egasi ruxsat berdi.");
  if (javob === "vaqt") return qaror(false, "Egasi 10 daqiqa ichida javob bermadi — bajarilmadi.");
  return qaror(false, "Egasi ruxsat bermadi.");
};

// Agent egasiga fayl yubora oladigan asbob.
const telegramAsboblari = (chatId) =>
  createSdkMcpServer({
    name: "telegram",
    version: "1.0.0",
    tools: [
      tool(
        "fayl_yubor",
        "Kompyuterdagi faylni egasiga Telegram orqali yuboradi. Tayyorlangan hujjat, jadval, rasm yoki egasi so'ragan faylni yuborish uchun ishlating. Fayl 50 MB dan kichik bo'lsin.",
        {
          yol: z.string().describe("Faylning to'liq yo'li yoki ish papkasiga nisbatan yo'li"),
          izoh: z.string().optional().describe("Fayl ostidagi qisqa izoh"),
        },
        async ({ yol, izoh }) => {
          const toliq = resolve(ISH_PAPKASI, yol);
          const javob = (text) => ({ content: [{ type: "text", text }] });
          if (MAXFIY_FAYLLAR.has(toliq.toLowerCase())) return javob("Bu maxfiy fayl — yuborilmaydi.");
          if (!existsSync(toliq) || !statSync(toliq).isFile()) return javob(`Fayl topilmadi: ${toliq}`);
          if (statSync(toliq).size > 50 * 1024 * 1024) return javob("Fayl 50 MB dan katta — Telegram qabul qilmaydi.");
          try {
            await faylYubor(chatId, toliq, izoh);
            log(rang.ochiq(`  ↳ fayl yuborildi: ${toliq}`));
            return javob(`Yuborildi: ${basename(toliq)}`);
          } catch (e) {
            return javob(`Yuborib bo'lmadi: ${e.message}`);
          }
        },
        // Agent bu asbobni qidirib o'tirmasin — boshidan bilib tursin.
        { alwaysLoad: true }
      ),
    ],
  });

// ─────────────── Agentni ishga tushirish ───────────────

async function bajar(chatId, savol) {
  const h = holat(chatId);
  if (h.band) {
    await yubor(chatId, "⏳ Hozir oldingi ish bajarilyapti. Tugashini kuting yoki /toxtat deb yozing.");
    return;
  }
  h.band = true;
  h.abort = new AbortController();
  log(rang.kok(`→ ${savol.replace(/\s+/g, " ").slice(0, 200)}`));

  const holatXabar = await yubor(chatId, "⏳ Ishga tushdim…").catch(() => null);
  const yozyapti = setInterval(
    () => tg("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {}),
    4500
  );
  let oxirgiYangilanish = 0;
  const qadamniKorsat = (matn) => {
    const hozir = Date.now();
    if (!holatXabar || hozir - oxirgiYangilanish < 3000) return;
    oxirgiYangilanish = hozir;
    tahrirla(chatId, holatXabar.message_id, `⏳ ${matn}`);
  };

  const sozlamalar = {
    cwd: ISH_PAPKASI,
    additionalDirectories: [...QOSHIMCHA, QABUL_PAPKASI],
    systemPrompt: { type: "preset", preset: "claude_code", append: QOIDALAR },
    allowedTools: RUXSAT_ETILGAN,
    permissionMode: "default",
    mcpServers: { telegram: telegramAsboblari(chatId) },
    // timeout — egasi telefonda javob berguncha hook kutadi (o'zimizning
    // muddatimiz 10 daqiqa). onFailure: "block" — hook xato bersa, buyruq
    // har holda to'xtatiladi.
    hooks: { PreToolUse: [{ hooks: [darvoza(chatId, h)], timeout: 3600, onFailure: "block" }] },
    // Kompyuterdagi ~/.claude sozlamalari ta'sir qilmasin.
    settingSources: [],
    // Ikkinchi qulf: o'qish asboblari (Read, Grep, Glob) sirlarga tegmaydi.
    settings: { permissions: { deny: ["Read(**/kalit.txt)", "Read(**/telegram-token.txt)"] } },
    abortController: h.abort,
  };
  if (sozlama.model) sozlamalar.model = sozlama.model;
  if (h.sessiyaId) sozlamalar.resume = h.sessiyaId;

  let natija = null;
  const matnlar = [];
  try {
    for await (const xabar of query({ prompt: savol, options: sozlamalar })) {
      if (xabar.session_id) h.sessiyaId = xabar.session_id;
      if (xabar.type === "assistant" && xabar.message?.content) {
        for (const blok of xabar.message.content) {
          if (blok.type === "text" && blok.text.trim()) matnlar.push(blok.text.trim());
          else if (blok.type === "tool_use") {
            const qisqa = buyruqniKorsat(blok.name, blok.input ?? {}).slice(0, 150);
            log(rang.ochiq(`  · ${blok.name}: ${qisqa}`));
            qadamniKorsat(`${blok.name}: ${qisqa}`);
          }
        }
      } else if (xabar.type === "result") {
        natija = xabar;
      }
    }
  } catch (e) {
    if (h.abort.signal.aborted) {
      natija = { toxtatildi: true };
    } else {
      log(rang.qizil(`Xato: ${e?.message ?? e}`));
      natija = { xato: e?.message ?? String(e) };
    }
  } finally {
    clearInterval(yozyapti);
    h.band = false;
    h.abort = null;
  }

  let javob;
  let sarlavha;
  if (natija?.toxtatildi) {
    sarlavha = "⏹ To'xtatildi.";
    javob = matnlar.length ? matnlar[matnlar.length - 1] : "";
  } else if (natija?.xato) {
    sarlavha = "❌ Xato chiqdi.";
    javob = `${natija.xato}\n\nQayta urinib ko'ring. Takrorlansa, kompyuterdagi oynaga qarang.`;
  } else if (natija?.type === "result") {
    const narx =
      typeof natija.total_cost_usd === "number"
        ? ` (${natija.num_turns} qadam, ~$${natija.total_cost_usd.toFixed(3)})`
        : "";
    sarlavha = natija.subtype === "success" && !natija.is_error ? `✅ Tayyor${narx}` : `⚠ Ish tugallanmadi: ${natija.subtype}${narx}`;
    javob = (typeof natija.result === "string" && natija.result.trim()) || matnlar.join("\n\n");
  } else {
    sarlavha = "⚠ Agent javobsiz to'xtadi.";
    javob = matnlar.join("\n\n");
  }

  if (holatXabar) await tahrirla(chatId, holatXabar.message_id, sarlavha);
  else await yubor(chatId, sarlavha).catch(() => {});
  if (javob && javob.trim()) await yubor(chatId, javob).catch((e) => log(rang.qizil(`Javob yuborilmadi: ${e.message}`)));
  log(rang.yashil(`← ${sarlavha}`));
}

// ─────────────── Xabarlarni qabul qilish ───────────────

const YORDAM = `Men kompyuteringizdagi yordamchiman. Oddiy gap bilan yozing — bajaraman va javobini shu yerga yozaman.

Masalan:
- Ish stolidagi fayllarni sanab ber
- Hujjatlar papkasidagi eng katta 5 ta faylni top
- Shu oyning hisobotini Excel qilib tayyorla va menga yubor

Fayl yoki rasm yuborsangiz, kompyuterga saqlayman va nima qilishni so'rayman.

Buyruqlar:
/yangi — suhbatni noldan boshlash
/toxtat — bajarilayotgan ishni to'xtatish
/holat — hozir nima qilyapman
/kotib — boshqalarga siz nomingizdan javob beradigan AI kotib

Fayl o'zgartirish yoki dastur ishga tushirishdan oldin tugma bilan ruxsat so'rayman.

Botga boshqa odam yozsa, AI kotib siz nomingizdan javob beradi va suhbatni sizga ko'rsatadi. O'sha xabarga reply qilsangiz, javobingiz o'sha odamga boradi.`;

// Begonalar bilan gaplashadigan AI kotib (kompyuterga tegolmaydi).
const kotib = kotibYarat({ BU_PAPKA, tg, yubor, sozlama, sozlamaniYoz, egalar, log, rang });

// Juftlash kodi: egasi hali belgilanmagan bo'lsa, kompyuter ekranida chiqadi.
// Kodni faqat kompyuter oldida turgan odam ko'radi.
let juftlashKodi = egalar.size === 0 ? String(randomInt(100000, 1000000)) : null;
const begonalar = new Map(); // begona ID → nechta xabar yozgani

async function xabarniQabulQil(x) {
  const chatId = x.chat.id;
  const kim = x.from?.id;

  if (x.chat.type !== "private") return; // guruhlarda ishlamaydi

  if (!egalar.has(kim)) {
    // Egasi bor — begonaga AI kotib javob beradi (kompyuterga yo'li yo'q).
    if (!juftlashKodi) {
      await kotib.begonaXabar(x);
      return;
    }

    const matn = (x.text || "").trim();
    const urinish = (begonalar.get(kim) || 0) + 1;
    begonalar.set(kim, urinish);
    // Kodni tanlab topishga urinishning oldini olish: 5 ta xatodan keyin javob bermaymiz.
    if (urinish > 5) return;

    if (matn === juftlashKodi) {
      egalar.add(kim);
      sozlama.egalar = [...egalar];
      sozlamaniYoz();
      juftlashKodi = null;
      begonalar.delete(kim);
      log(rang.yashil(`Egasi qo'shildi: ${x.from.first_name || ""} (ID ${kim}). Juftlash kodi endi ishlamaydi.`));
      await yubor(chatId, `✅ Ulandingiz! Endi bu bot faqat sizga bo'ysunadi.\n\n${YORDAM}`);
      return;
    }
    log(rang.sariq(`Ulanish kodi kutilyapti, begona yozdi: ${x.from?.first_name || ""} @${x.from?.username || "-"} (ID ${kim}).`));
    await yubor(chatId, /^\d{6}$/.test(matn) ? "Kod noto'g'ri." : "Kompyuter ekranidagi 6 xonali kodni yuboring.");
    return;
  }

  // Ega kotib bildirishnomasiga reply qildi — javob o'sha odamga ketadi.
  if (await kotib.egaReply(x)) return;

  const h = holat(chatId);
  const matn = (x.text || x.caption || "").trim();
  const buyruq = (x.text || "").trim().split(/[\s@]/)[0].toLowerCase();

  if (buyruq.startsWith("/kotib") && (await kotib.buyruq(chatId, buyruq, x.text || ""))) return;
  if (buyruq === "/start" || buyruq === "/yordam" || buyruq === "/help") {
    await yubor(chatId, YORDAM);
    return;
  }
  if (buyruq === "/toxtat" || buyruq === "/stop") {
    if (h.band && h.abort) {
      h.abort.abort();
      await yubor(chatId, "⏹ To'xtatyapman…");
    } else await yubor(chatId, "Hozir hech qanday ish bajarilmayapti.");
    return;
  }
  if (buyruq === "/yangi" || buyruq === "/new") {
    if (h.band) {
      await yubor(chatId, "Avval joriy ishni tugating yoki /toxtat deb yozing.");
      return;
    }
    h.sessiyaId = null;
    h.doimiy = new Set(sozlama.soramasdanBajarsin || []);
    await yubor(chatId, "🆕 Yangi suhbat. Avvalgi gaplar va \"doim\" ruxsatlari unutildi.");
    return;
  }
  if (buyruq === "/holat") {
    await yubor(
      chatId,
      (h.band ? "⏳ Ish bajarilyapti." : "💤 Bo'shman, buyruq kutyapman.") +
        `\nIsh papkasi: ${ISH_PAPKASI}` +
        (h.doimiy.size ? `\nDoimiy ruxsat: ${[...h.doimiy].join(", ")}` : "")
    );
    return;
  }

  if (h.band) {
    await yubor(chatId, "⏳ Hozir oldingi ish bajarilyapti. Tugashini kuting yoki /toxtat deb yozing.");
    return;
  }

  // Fayl yoki rasm kelgan bo'lsa — avval kompyuterga saqlaymiz.
  let savol = matn;
  const fayl =
    x.document ? { id: x.document.file_id, nomi: x.document.file_name, hajm: x.document.file_size } :
    x.photo?.length ? { id: x.photo[x.photo.length - 1].file_id, nomi: `rasm-${x.message_id}.jpg`, hajm: x.photo[x.photo.length - 1].file_size } :
    null;
  if (fayl) {
    if (fayl.hajm && fayl.hajm > 20 * 1024 * 1024) {
      await yubor(chatId, "Bu fayl 20 MB dan katta — Telegram botlarga bunday faylni bermaydi.");
      return;
    }
    try {
      const yol = await faylYuklab(fayl.id, fayl.nomi);
      log(rang.ochiq(`  ↳ fayl saqlandi: ${yol}`));
      savol =
        `Egasi Telegram orqali fayl yubordi, u kompyuterga saqlandi: ${yol}\n` +
        (matn ? `Egasining izohi: ${matn}` : "Izoh yozilmagan — faylni ko'rib, nima qilish kerakligini qisqa so'ra.");
    } catch (e) {
      await yubor(chatId, `Faylni saqlab bo'lmadi: ${e.message}`);
      return;
    }
  } else if (x.voice || x.audio || x.video || x.video_note || x.sticker) {
    await yubor(chatId, "Hozircha faqat matn, fayl va rasmni tushunaman. Iltimos, yozib yuboring.");
    return;
  }

  if (!savol) return;
  await bajar(chatId, savol);
}

async function tugmaniQabulQil(cq) {
  if (await kotib.tugma(cq)) return;
  const [tur, kalit, javob] = String(cq.data || "").split(":");
  const k = kutilayotgan.get(kalit);
  if (tur !== "r" || !k || !egalar.has(cq.from?.id) || cq.message?.chat?.id !== k.chatId) {
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Bu so'rov eskirgan." }).catch(() => {});
    return;
  }
  const qaror = ["ha", "doim"].includes(javob) ? javob : "yoq";
  const yozuv = { ha: "✅ Ruxsat berildi.", doim: "♾ Doimiy ruxsat berildi.", yoq: "❌ Rad etildi." }[qaror];
  log(rang.ochiq(`  ↳ ${yozuv}`));
  await tg("answerCallbackQuery", { callback_query_id: cq.id, text: yozuv }).catch(() => {});
  k.yakunla(qaror, yozuv);
}

// ─────────────── Asosiy sikl ───────────────

const kut = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(rang.qizil("\n  Anthropic API kaliti topilmadi."));
    console.log("  agent papkasida kalit.txt fayli yarating va ichiga kalitni yozing (sk-ant-...).");
    console.log("  Batafsil: README.md\n");
    process.exit(2);
  }
  if (!TOKEN) {
    console.log(rang.qizil("\n  Telegram bot tokeni topilmadi."));
    console.log("  1. Telegramda @BotFather ga /newbot deb yozing va yangi bot yarating.");
    console.log("  2. Bergan tokenni agent papkasidagi telegram-token.txt fayliga yozing.");
    console.log("  Batafsil: README.md, \"Telegram orqali boshqarish\" bo'limi.\n");
    process.exit(2);
  }
  mkdirSync(ISH_PAPKASI, { recursive: true });

  let men;
  try {
    men = await tg("getMe");
  } catch (e) {
    console.log(rang.qizil(`\n  Telegramga ulanib bo'lmadi: ${e.message}`));
    if (e.kod === 401 || e.kod === 404) {
      console.log("  Token noto'g'ri. telegram-token.txt ni tekshiring.");
      process.exit(2);
    }
    console.log("  Internetni tekshiring. Dastur qayta urinadi.");
    process.exit(1);
  }

  console.log();
  console.log(rang.qalin(rang.kok("  Shtampchi Telegram agent")));
  console.log(rang.ochiq(`  Bot:         @${men.username}`));
  console.log(rang.ochiq(`  Ish papkasi: ${ISH_PAPKASI}`));
  console.log(rang.ochiq(`  Fayllar:     ${QABUL_PAPKASI}`));
  console.log();
  if (juftlashKodi) {
    console.log(rang.sariq("  Bot hali hech kimga ulanmagan."));
    console.log(`  Telegramda @${men.username} ni oching va shu kodni yuboring:`);
    console.log();
    console.log(rang.qalin(rang.yashil(`        ${juftlashKodi}`)));
    console.log();
  } else {
    console.log(rang.ochiq(`  Egalar: ${[...egalar].join(", ")}`));
  }
  console.log(rang.ochiq(`  AI kotib:    ${sozlama.kotib ? "yoqilgan — begonalarga siz nomingizdan javob beradi (kotib.txt)" : "o'chirilgan"}`));
  console.log(rang.ochiq("  Oynani yopmang — yopilsa agent to'xtaydi. To'xtatish: Ctrl+C"));
  console.log();

  let offset = 0;
  let ziddiyatAytildi = false;
  while (true) {
    let yangilar;
    try {
      yangilar = await tg("getUpdates", {
        offset,
        timeout: 50,
        allowed_updates: ["message", "callback_query"],
      });
      ziddiyatAytildi = false;
    } catch (e) {
      if (e.kod === 409 && !ziddiyatAytildi) {
        ziddiyatAytildi = true;
        log(rang.qizil("Bu bot boshqa joyda ham ishlayapti (webhook yoki ikkinchi oyna)."));
        log("Agent uchun alohida yangi bot yarating — do'kon botining tokenini ishlatmang.");
        log("Yoki shu dasturning boshqa ochiq oynasini yoping.");
      } else if (e.kod === 401) {
        log(rang.qizil("Token bekor qilingan. telegram-token.txt ni yangilang."));
        process.exit(2);
      } else if (e.kod !== 409) {
        log(rang.sariq(`Telegram bilan aloqa uzildi (${e.message}). Qayta ulanaman…`));
      }
      await kut(5000);
      continue;
    }

    for (const y of yangilar) {
      offset = y.update_id + 1;
      // Kutmaymiz: agent ishlayotganda ham ruxsat tugmalari va /toxtat qabul qilinsin.
      if (y.message) xabarniQabulQil(y.message).catch((e) => log(rang.qizil(`Xabarda xato: ${e.message}`)));
      else if (y.callback_query) tugmaniQabulQil(y.callback_query).catch((e) => log(rang.qizil(`Tugmada xato: ${e.message}`)));
    }
  }
}

main().catch((e) => {
  console.error(rang.qizil(`Kutilmagan xato: ${e?.stack ?? e}`));
  process.exit(1);
});
