/**
 * Shtampchi CRM — Google Sheets qabul qiluvchisi.
 *
 * Bot (Netlify funksiyasi) har bir yangi mijozni shu skriptga POST qiladi,
 * skript esa "Mijozlar" varag'iga yangi qator qo'shadi.
 *
 * O'rnatish (bir marta):
 *   1. Google Sheets'da jadvalni oching → Kengaytmalar → Apps Script.
 *   2. Shu faylni to'liq nusxalab qo'ying va saqlang.
 *   3. Loyiha sozlamalari (⚙️) → Script properties → "SECRET" nomli xususiyat
 *      qo'shing, qiymati — o'zingiz o'ylab topgan uzun parol.
 *      Netlify'dagi SHEETS_SECRET ham aynan shu qiymat bo'lishi kerak.
 *   4. Yuqoridagi ro'yxatdan "sozla" funksiyasini tanlab ▶ Run bosing —
 *      sarlavhalar, ranglar va "Holat" ro'yxati paydo bo'ladi.
 *   5. Deploy → New deployment → turi "Web app":
 *        Execute as: Me
 *        Who has access: Anyone
 *      Chiqqan URL'ni Netlify'ga SHEETS_WEBHOOK_URL qilib qo'ying.
 */

const VARAQ = "Mijozlar";

const USTUNLAR = [
  "Sana",
  "Ism",
  "Telefon",
  "Muhr turi",
  "Xabar / izoh",
  "Manba",
  "Telegram",
  "Holat",
  "Menejer izohi",
];

const HOLATLAR = ["Yangi", "Bog'lanildi", "Maket yuborildi", "Tayyorlanmoqda", "Topshirildi", "Bekor"];

function varaqOl_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(VARAQ) || ss.insertSheet(VARAQ);
}

/** Bir marta qo'lda ishga tushiriladi: jadval ko'rinishini yasaydi. */
function sozla() {
  const sh = varaqOl_();
  const n = USTUNLAR.length;

  sh.getRange(1, 1, 1, n)
    .setValues([USTUNLAR])
    .setFontWeight("bold")
    .setFontColor("#ffffff")
    .setBackground("#4c1d95")
    .setVerticalAlignment("middle");
  sh.setRowHeight(1, 32);
  sh.setFrozenRows(1);

  const kenglik = [140, 160, 140, 180, 320, 120, 170, 140, 220];
  kenglik.forEach((px, i) => sh.setColumnWidth(i + 1, px));

  // Telefon matn bo'lib tursin — "+998..." formula yoki son bo'lib ketmasin.
  sh.getRange("C2:C").setNumberFormat("@");
  sh.getRange("A2:A").setNumberFormat("dd.mm.yyyy hh:mm");
  sh.getRange("E2:E").setWrap(true);

  const holat = SpreadsheetApp.newDataValidation()
    .requireValueInList(HOLATLAR, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange("H2:H").setDataValidation(holat);

  // Holatga qarab qator rangi.
  const r = sh.getRange("A2:I");
  const rang = (matn, fon) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H2="' + matn + '"')
      .setBackground(fon)
      .setRanges([r])
      .build();
  sh.setConditionalFormatRules([
    rang("Yangi", "#fef3c7"),
    rang("Bog'lanildi", "#dbeafe"),
    rang("Maket yuborildi", "#e0e7ff"),
    rang("Tayyorlanmoqda", "#ede9fe"),
    rang("Topshirildi", "#dcfce7"),
    rang("Bekor", "#f3f4f6"),
  ]);

  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), n).createFilter();

  // Bo'sh qolgan standart "Sheet1"/"Лист1" ni olib tashlaymiz.
  const ss = sh.getParent();
  ss.getSheets().forEach((s) => {
    if (s.getName() !== VARAQ && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });
}

function javob_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

const kes_ = (s, n) => String(s == null ? "" : s).trim().slice(0, n);

// "=", "+", "-", "@" bilan boshlangan matn Sheets'da formula bo'lib ishlab
// ketmasligi uchun (formula injection). Telefon ustuni matn formatida.
const xavfsiz_ = (s) => (/^[=+\-@]/.test(s) ? "'" + s : s);

function doPost(e) {
  let d;
  try {
    d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return javob_({ ok: false, error: "format" });
  }

  const sir = PropertiesService.getScriptProperties().getProperty("SECRET");
  if (!sir || d.secret !== sir) return javob_({ ok: false, error: "ruxsat yo'q" });

  const telefon = kes_(d.telefon, 40);
  const ism = kes_(d.ism, 80);
  if (!telefon && !ism) return javob_({ ok: false, error: "bo'sh" });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = varaqOl_();
    if (sh.getLastRow() === 0) sozla();
    sh.appendRow([
      new Date(),
      xavfsiz_(ism),
      telefon,
      xavfsiz_(kes_(d.tur, 120)),
      xavfsiz_(kes_(d.izoh, 1000)),
      xavfsiz_(kes_(d.manba, 40)),
      xavfsiz_(kes_(d.telegram, 80)),
      "Yangi",
      "",
    ]);
  } finally {
    lock.releaseLock();
  }
  return javob_({ ok: true });
}

/** Brauzerda URL ochilganda ishlayotganini ko'rsatadi. */
function doGet() {
  return javob_({ ok: true, xizmat: "Shtampchi CRM" });
}
