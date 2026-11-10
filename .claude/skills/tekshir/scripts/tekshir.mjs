#!/usr/bin/env node
// Shtampchi loyihasini tekshiradi. Hech narsani o'zgartirmaydi, faqat o'qiydi.
//
// Nima tekshiriladi:
//   1. Kod sintaksisi — har bir .mjs/.js fayl `node --check` dan o'tadimi.
//   2. Narxlar — sayt, Telegram bot, sayt chat-yordamchisi va MCP serverdagi
//      narxlar bir-biriga mosmi. Asos: mcp-server/index.js dagi NARXLAR.
//   3. Rasmlar — sayt va bot ko'rsatadigan har bir rasm public/ da bormi,
//      saytdagi width/height rasmning haqiqiy o'lchamiga mosmi.
//   4. Aloqa — telefon, Telegram manzili, ish vaqti va do'kon manzili hamma
//      joyda bir xilmi.
//
// Ishga tushirish (loyiha ildizidan):  node .claude/skills/tekshir/scripts/tekshir.mjs
// Natija: XATO bo'lsa chiqish kodi 1, faqat OGOHLANTIRISH bo'lsa 0.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ILDIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const yol = (p) => join(ILDIZ, p);
const oqi = (p) => readFileSync(yol(p), "utf8");

const FAYL = {
  sayt: "public/index.html",
  bot: "netlify/functions/telegram.mjs",
  chat: "netlify/functions/chat.mjs",
  mcp: "mcp-server/index.js",
};

const xatolar = [];
const ogohlar = [];
const xato = (s) => xatolar.push(s);
const ogoh = (s) => ogohlar.push(s);

const som = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
const qatorRaqami = (matn, indeks) => matn.slice(0, indeks).split("\n").length;

// ───────────────────────── 1. Sintaksis ─────────────────────────

function kodFayllari() {
  const natija = [];
  const yur = (papka) => {
    if (!existsSync(yol(papka))) return;
    for (const e of readdirSync(yol(papka), { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = `${papka}/${e.name}`;
      if (e.isDirectory()) yur(p);
      else if (/\.(mjs|js)$/.test(e.name)) natija.push(p);
    }
  };
  yur("netlify");
  yur("mcp-server");
  yur("agent");
  return natija;
}

function sintaksisTekshir() {
  const fayllar = kodFayllari();
  for (const f of fayllar) {
    const r = spawnSync(process.execPath, ["--check", yol(f)], { encoding: "utf8" });
    if (r.status !== 0) {
      const sabab = (r.stderr || "").split("\n").filter(Boolean).slice(0, 4).join("\n      ");
      xato(`${f}: kodda sintaksis xatosi bor.\n      ${sabab}`);
    }
  }
  return fayllar.length;
}

// ───────────────────────── 2. Narxlar ─────────────────────────

// mcp-server/index.js dagi NARXLAR — narxlarning asosiy ro'yxati.
function narxlarniOl(mcp) {
  const blok = mcp.match(/const NARXLAR = \{([\s\S]*?)\n\};/);
  if (!blok) {
    xato(`${FAYL.mcp}: NARXLAR topilmadi — tekshiruv narxlarni solishtira olmaydi.`);
    return null;
  }
  const narxlar = {};
  for (const m of blok[1].matchAll(/(\w+):\s*\{\s*mexanik:\s*(\d+),\s*avtomat:\s*(\d+)\s*\}/g)) {
    narxlar[m[1]] = { mexanik: Number(m[2]), avtomat: Number(m[3]) };
  }
  return narxlar;
}

// Fayl nomi yoki mahsulot nomidan turni aniqlaydi: muhr / shtamp / rekvizit.
function turTop(matn) {
  const t = matn.toLowerCase();
  if (t.includes("rekvizit")) return "rekvizit";
  if (t.includes("shtamp")) return "shtamp";
  if (t.includes("muhr")) return "muhr";
  return null;
}
const mexanizmTop = (matn) => (/aftomat|avtomat/i.test(matn) ? "avtomat" : "mexanik");

// "160 000" ko'rinishidagi summalar (oddiy yoki bo'linmas probel bilan).
// Telefon raqamlari oldindan olib tashlanadi, aks holda "99 420" summa bo'lib qoladi.
function summalar(qator) {
  const toza = qator.replace(/\+?998[\d\s()-]{7,}/g, " ");
  return [...toza.matchAll(/(?<![\d,.])([1-9]\d{1,2})[  ](\d{3})(?!\d)/g)].map((m) =>
    Number(m[1] + m[2])
  );
}

function narxlarniTekshir() {
  const mcp = oqi(FAYL.mcp);
  const N = narxlarniOl(mcp);
  if (!N) return;

  const kerak = (tur, mex) => N[tur]?.[mex];
  const barchaNarxlar = new Set(Object.values(N).flatMap((x) => [x.mexanik, x.avtomat]));

  // MCP: MAHSULOTLAR ro'yxatidagi har bir mahsulot NARXLAR ga mosmi.
  const mahsulotlar = mcp.match(/const MAHSULOTLAR = \[([\s\S]*?)\n\];/);
  if (mahsulotlar) {
    for (const m of mahsulotlar[1].matchAll(/nomi:\s*'([^']+)',\s*mexanizm:\s*'(\w+)'[\s\S]*?narx:\s*(\d+)/g)) {
      const [, nomi, mex, narx] = m;
      const tur = turTop(nomi);
      const k = kerak(tur, mex);
      if (k && Number(narx) !== k) {
        xato(`${FAYL.mcp}: "${nomi}" narxi ${som(narx)}, NARXLAR bo'yicha ${som(k)} bo'lishi kerak.`);
      }
    }
  }

  // Sayt: #narxlar bo'limidagi rasmli mahsulot kartochkalari.
  const sayt = oqi(FAYL.sayt);
  const kartalar = [...sayt.matchAll(/<div class="card">\s*<img class="shot" src="([^"]+)"[\s\S]*?<p>([^<]*)<\/p>/g)];
  for (const m of kartalar) {
    const [, fayl, matn] = m;
    const tur = turTop(fayl);
    const mex = mexanizmTop(fayl);
    const k = kerak(tur, mex);
    const topilgan = summalar(matn);
    const q = qatorRaqami(sayt, m.index);
    if (!topilgan.length) ogoh(`${FAYL.sayt}:${q}: "${fayl}" kartochkasida narx yozilmagan.`);
    else if (k && topilgan.some((s) => s !== k)) {
      xato(`${FAYL.sayt}:${q}: "${fayl}" kartochkasida ${som(topilgan[0])}, ${tur} ${mex} narxi ${som(k)}.`);
    }
  }

  // Sayt: uchta katta narx kartochkasi (Mexanik / Avtomat / Faksimile).
  const narxKartalar = [...sayt.matchAll(/<div class="card pricecard[^"]*">([\s\S]*?)<\/ul>/g)];
  for (const m of narxKartalar) {
    const blok = m[1];
    const sarlavha = (blok.match(/<h3>([^<]+)<\/h3>/) || [])[1] || "";
    const asosiy = Number(((blok.match(/price-amount">([^<]+)</) || [])[1] || "").replace(/\D/g, ""));
    const izoh = summalar((blok.match(/price-note">([^<]+)</) || [])[1] || "")[0];
    const q = qatorRaqami(sayt, m.index);
    let kutilgan = null;
    if (/^Mexanik/i.test(sarlavha)) kutilgan = [N.muhr?.mexanik, N.komplekt?.mexanik, "komplekt"];
    else if (/^Avtomat/i.test(sarlavha)) kutilgan = [N.muhr?.avtomat, N.komplekt?.avtomat, "komplekt"];
    else if (/Faksimile/i.test(sarlavha)) kutilgan = [N.faksimile?.mexanik, N.faksimile?.avtomat, "avtomat varianti"];
    if (!kutilgan) continue;
    if (asosiy !== kutilgan[0]) {
      xato(`${FAYL.sayt}:${q}: "${sarlavha}" narx kartochkasida ${som(asosiy)}, ${som(kutilgan[0])} bo'lishi kerak.`);
    }
    if (izoh !== undefined && izoh !== kutilgan[1]) {
      xato(`${FAYL.sayt}:${q}: "${sarlavha}" kartochkasidagi ${kutilgan[2]} ${som(izoh)}, ${som(kutilgan[1])} bo'lishi kerak.`);
    }
  }

  // Telegram bot: KATALOG dagi har bir mahsulot (narx va tugma yozuvi).
  const bot = oqi(FAYL.bot);
  for (const m of bot.matchAll(/fayl:\s*"([^"]+)",\s*nom:\s*"([^"]+)",\s*narx:\s*"([^"]+)"[\s\S]*?tugma:\s*"([^"]+)"/g)) {
    const [, fayl, nom, narx, tugma] = m;
    const k = kerak(turTop(fayl), mexanizmTop(fayl));
    const q = qatorRaqami(bot, m.index);
    for (const [joy, matn] of [["narx", narx], ["tugma", tugma]]) {
      const s = summalar(matn)[0];
      if (k && s !== k) xato(`${FAYL.bot}:${q}: katalogdagi "${nom}" (${joy}) ${som(s)}, ${som(k)} bo'lishi kerak.`);
    }
  }

  // Erkin matndagi narxlar (bot javoblari, chat-yordamchi ko'rsatmasi, sayt).
  // Qoida 1: har bir summa NARXLAR da bo'lishi kerak — eski narx qolib ketsa ushlanadi.
  // Qoida 2: qatorda faqat bitta toifa (rekvizit/faksimile/datali/komplekt) tilga olinsa,
  //          toifa nomidan KEYIN kelgan summalar shu toifaning narxi bo'lishi kerak.
  const TOIFA = { rekvizit: "rekvizit", faksimile: "faksimile", datali: "datali_shtamp", komplekt: "komplekt" };
  for (const f of [FAYL.sayt, FAYL.bot, FAYL.chat]) {
    const qatorlar = oqi(f).split("\n");
    qatorlar.forEach((qator, i) => {
      if (/width=|height=|tel:|\bfayl:/.test(qator)) return;
      const s = summalar(qator);
      if (!s.length) return;
      for (const summa of s) {
        if (!barchaNarxlar.has(summa)) {
          xato(`${f}:${i + 1}: ${som(summa)} — bunday narx NARXLAR da yo'q (eski narx qolib ketganmi?).\n      ${qator.trim().slice(0, 110)}`);
        }
      }
      const kichik = qator.toLowerCase();
      const toifalar = Object.keys(TOIFA).filter((t) => kichik.includes(t));
      if (toifalar.length === 1) {
        const n = N[TOIFA[toifalar[0]]];
        if (!n) return;
        const ruxsat = [n.mexanik, n.avtomat];
        const keyingi = summalar(qator.slice(kichik.indexOf(toifalar[0])));
        const notogri = keyingi.filter((x) => barchaNarxlar.has(x) && !ruxsat.includes(x));
        if (notogri.length) {
          xato(
            `${f}:${i + 1}: "${toifalar[0]}" uchun ${notogri.map(som).join(", ")} yozilgan, ` +
              `NARXLAR bo'yicha ${som(n.mexanik)} / ${som(n.avtomat)}.\n      ${qator.trim().slice(0, 110)}`
          );
        }
      }
    });
  }
}

// ───────────────────────── 3. Rasmlar ─────────────────────────

// JPEG/PNG faylning haqiqiy kengligi va balandligi.
function rasmOlchami(fayl) {
  const b = readFileSync(fayl);
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    const uzunlik = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + uzunlik;
  }
  return null;
}

function rasmlarniTekshir() {
  const sayt = oqi(FAYL.sayt);
  const bot = oqi(FAYL.bot);
  const publicRasmlar = readdirSync(yol("public")).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

  const saytdagi = new Set();
  for (const m of sayt.matchAll(/<img[^>]*\ssrc="([^"]+)"[^>]*>/g)) {
    const teg = m[0];
    const fayl = m[1];
    if (/^(https?:|data:)/.test(fayl)) continue;
    saytdagi.add(fayl);
    const q = qatorRaqami(sayt, m.index);
    if (!existsSync(yol(`public/${fayl}`))) {
      xato(`${FAYL.sayt}:${q}: "${fayl}" rasmi public/ papkasida yo'q.`);
      continue;
    }
    const w = Number((teg.match(/width="(\d+)"/) || [])[1]);
    const h = Number((teg.match(/height="(\d+)"/) || [])[1]);
    const asl = rasmOlchami(yol(`public/${fayl}`));
    if (asl && w && h && (asl.w !== w || asl.h !== h)) {
      ogoh(`${FAYL.sayt}:${q}: "${fayl}" uchun width="${w}" height="${h}" yozilgan, rasm aslida ${asl.w}×${asl.h}.`);
    }
  }

  const rasmlarBlok = (bot.match(/const RASMLAR = \[([\s\S]*?)\];/) || [])[1] || "";
  const botRasmlar = [...rasmlarBlok.matchAll(/\["([^"]+)"/g)].map((m) => m[1]);
  const katalogRasmlar = [...bot.matchAll(/fayl:\s*"([^"]+)"/g)].map((m) => m[1]);

  for (const f of new Set([...botRasmlar, ...katalogRasmlar])) {
    if (!existsSync(yol(`public/${f}`))) xato(`${FAYL.bot}: "${f}" rasmi public/ papkasida yo'q.`);
  }
  if (botRasmlar.length > 10) {
    xato(`${FAYL.bot}: RASMLAR da ${botRasmlar.length} ta rasm — Telegram bir yo'la ko'pi bilan 10 ta yuboradi.`);
  }

  for (const f of publicRasmlar) {
    const joylar = [];
    if (!saytdagi.has(f)) joylar.push("saytda");
    if (!katalogRasmlar.includes(f)) joylar.push("bot katalogida");
    if (!botRasmlar.includes(f)) joylar.push("bot RASMLAR ro'yxatida");
    if (joylar.length) ogoh(`public/${f}: bu rasm ${joylar.join(", ")} ishlatilmagan.`);
  }
  return publicRasmlar.length;
}

// ───────────────────────── 4. Aloqa ma'lumotlari ─────────────────────────

function aloqaniTekshir() {
  const fayllar = [FAYL.sayt, FAYL.bot, FAYL.chat, FAYL.mcp];
  const matnlar = Object.fromEntries(fayllar.map((f) => [f, oqi(f)]));

  const yigish = (regex, normal) => {
    const topildi = new Map();
    for (const f of fayllar) {
      for (const m of matnlar[f].matchAll(regex)) {
        const qiymat = normal(m);
        if (!topildi.has(qiymat)) topildi.set(qiymat, new Set());
        topildi.get(qiymat).add(relative(ILDIZ, yol(f)));
      }
    }
    return topildi;
  };
  const bittaBolsin = (nomi, topildi) => {
    if (topildi.size > 1) {
      const tafsilot = [...topildi].map(([q, f]) => `"${q}" — ${[...f].join(", ")}`).join("\n      ");
      xato(`${nomi} har xil joyda har xil yozilgan:\n      ${tafsilot}`);
    }
  };

  bittaBolsin("Telefon raqami", yigish(/\+998[\d\s()-]{9,}\d/g, (m) => m[0].replace(/\D/g, "")));
  bittaBolsin("Telegram manzili", yigish(/t\.me\/(\w+)/g, (m) => m[1].toLowerCase()));
  bittaBolsin(
    "Ish vaqti",
    yigish(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/g, (m) => `${m[1]}–${m[2]}`)
  );

  // Do'kon manzili: har bir fayldagi manzil qaysi shahar/tumandan boshlanadi.
  const manzillar = {
    [FAYL.bot]: (matnlar[FAYL.bot].match(/manzil:\s*"([^"]+)"/) || [])[1],
    [FAYL.mcp]: (matnlar[FAYL.mcp].match(/joylashuv:\s*'([^']+)'/) || [])[1],
    [FAYL.chat]: (matnlar[FAYL.chat].match(/"Shtampchi" — (\S+)/) || [])[1],
  };
  const joylar = Object.entries(manzillar).filter(([, v]) => v);
  const birinchiSoz = (s) => s.toLowerCase().replace(/[^a-z'ʻ]/g, " ").trim().split(/\s+/)[0].slice(0, 6);
  if (new Set(joylar.map(([, v]) => birinchiSoz(v))).size > 1) {
    ogoh(
      "Do'kon manzili har xil joyda har xil:\n      " +
        joylar.map(([f, v]) => `${f}: "${v}"`).join("\n      ")
    );
  }
}

// ───────────────────────── Natija ─────────────────────────

const kodSoni = sintaksisTekshir();
narxlarniTekshir();
const rasmSoni = rasmlarniTekshir();
aloqaniTekshir();

console.log("Shtampchi — loyiha tekshiruvi");
console.log(`  ${kodSoni} ta kod fayli, ${rasmSoni} ta rasm, narxlar va aloqa ma'lumotlari ko'rildi.\n`);

if (xatolar.length) {
  console.log(`XATOLAR (${xatolar.length}) — tuzatish kerak:`);
  xatolar.forEach((x, i) => console.log(`  ${i + 1}. ${x}`));
  console.log();
}
if (ogohlar.length) {
  console.log(`OGOHLANTIRISHLAR (${ogohlar.length}) — ko'rib chiqing:`);
  ogohlar.forEach((x, i) => console.log(`  ${i + 1}. ${x}`));
  console.log();
}
if (!xatolar.length && !ogohlar.length) console.log("Hammasi joyida.");

process.exit(xatolar.length ? 1 : 0);
