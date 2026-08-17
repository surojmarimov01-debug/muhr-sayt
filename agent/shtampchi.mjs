#!/usr/bin/env node
// Shtampchi agent — kompyuterda o'zbekcha buyruq beriladi, agent bajaradi.
//
// Ishlashi: siz oddiy gap bilan aytasiz ("hisobot papkasidagi fayllarni
// sanab ber"), agent o'zi qaysi asbobni ishlatishni hal qiladi, bajaradi va
// natijani aytadi. Fayl o'zgartirish va terminal buyruqlari uchun sizdan
// ruxsat so'raydi.
//
// Ishga tushirish: boshla.cmd (Windows) yoki `node shtampchi.mjs`

import { query } from "@anthropic-ai/claude-agent-sdk";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BU_PAPKA = dirname(fileURLToPath(import.meta.url));

// ─────────────── Ranglar ───────────────
const rang = {
  ochiq: (s) => `\x1b[2m${s}\x1b[0m`,
  kok: (s) => `\x1b[36m${s}\x1b[0m`,
  yashil: (s) => `\x1b[32m${s}\x1b[0m`,
  sariq: (s) => `\x1b[33m${s}\x1b[0m`,
  qizil: (s) => `\x1b[31m${s}\x1b[0m`,
  qalin: (s) => `\x1b[1m${s}\x1b[0m`,
};

// ─────────────── Sozlama ───────────────
const SOZLAMA_YOLI = resolve(BU_PAPKA, "sozlama.json");

const SUKUT = {
  ishPapkasi: ".",
  qoshimchaPapkalar: [],
  soramasdanBajarsin: [],
  model: "",
};

function sozlamaniOqi() {
  if (!existsSync(SOZLAMA_YOLI)) return { ...SUKUT };
  try {
    return { ...SUKUT, ...JSON.parse(readFileSync(SOZLAMA_YOLI, "utf8")) };
  } catch (e) {
    console.log(rang.qizil(`sozlama.json o'qilmadi (${e.message}) — sukut sozlamalar ishlatiladi.`));
    return { ...SUKUT };
  }
}

const sozlama = sozlamaniOqi();
const ISH_PAPKASI = resolve(BU_PAPKA, sozlama.ishPapkasi);
const QOSHIMCHA = (sozlama.qoshimchaPapkalar || []).map((p) => resolve(BU_PAPKA, p));

if (!existsSync(ISH_PAPKASI)) mkdirSync(ISH_PAPKASI, { recursive: true });

// ─────────────── Asboblar va ruxsat ───────────────

// Faqat o'qiydigan asboblar — ular hech narsani buzmaydi, so'ramaymiz.
const XAVFSIZ = new Set([
  "Read", "Glob", "Grep", "WebSearch", "WebFetch",
  "TodoWrite", "Task", "Skill", "NotebookRead",
]);

// O'zgartiradigan asboblar — har safar so'raymiz. Ular ataylab
// allowedTools ro'yxatiga QO'SHILMAYDI: u ro'yxatdagi asbob so'ramasdan
// bajariladi va canUseTool umuman chaqirilmaydi. Ro'yxatdan tashqarida
// qolgani uchun ular ruxsat so'rash bosqichidan o'tadi.
const OZGARTIRADIGAN = new Set(["Write", "Edit", "NotebookEdit", "Bash", "KillShell"]);

// Faqat o'qiydiganlari avtomatik ruxsat oladi.
const RUXSAT_ETILGAN = [...XAVFSIZ];

// Buyruqni odam o'qiydigan qilib ko'rsatish.
function buyruqniKorsat(nomi, kirish) {
  if (nomi === "Bash") return kirish.command ?? "";
  if (nomi === "Write") return `fayl yozish: ${kirish.file_path ?? ""}`;
  if (nomi === "Edit") return `fayl tahriri: ${kirish.file_path ?? ""}`;
  if (nomi === "NotebookEdit") return `notebook tahriri: ${kirish.notebook_path ?? ""}`;
  const q = JSON.stringify(kirish);
  return q.length > 200 ? q.slice(0, 200) + "…" : q;
}

// ─────────────── Asosiy ───────────────

const QOIDALAR = `
Sen "Shtampchi" do'koni egasining shaxsiy kompyuter yordamchisisan.

TIL: Har doim o'zbek tilida javob ber. Texnik atamalarni oddiy tushuntir —
foydalanuvchi dasturchi emas.

USLUB: Qisqa yoz. Nima qilganingni bir-ikki gapda ayt, keyin natijani ber.
Uzun ro'yxat va sarlavhalar shart emas — oddiy gap bilan tushuntir.

ISHLASH TARTIBI:
- Avval o'qib ko'r, keyin o'zgartir. Fayl tahrirlashdan oldin uni o'qi.
- Bir narsani o'chirish yoki almashtirishdan oldin nima yo'qolishini ayt.
- Xato chiqsa yashirma — nima bo'lganini va nima qilish kerakligini ayt.
- Ish tugaganda natijani aniq ayt: qaysi fayl o'zgardi, qayerda turibdi.

CHEGARA: Faqat senga ruxsat berilgan papkalarda ishla. Papkadan tashqariga
chiqish kerak bo'lsa, so'ra — o'zboshimchalik bilan qilma.
`.trim();

function salomlash() {
  console.log();
  console.log(rang.qalin(rang.kok("  Shtampchi agent")));
  console.log(rang.ochiq(`  Ish papkasi: ${ISH_PAPKASI}`));
  if (QOSHIMCHA.length) {
    console.log(rang.ochiq(`  Qo'shimcha:   ${QOSHIMCHA.join(", ")}`));
  }
  console.log();
  console.log(rang.ochiq("  Buyruqni oddiy gap bilan yozing. Masalan:"));
  console.log(rang.ochiq('    "public papkasidagi fayllarni sanab ber"'));
  console.log(rang.ochiq('    "narxlar ro\'yxatini Excel fayl qilib chiqar"'));
  console.log();
  console.log(rang.ochiq("  yangi   — suhbatni noldan boshlash"));
  console.log(rang.ochiq("  chiqish — dasturdan chiqish"));
  console.log();
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(rang.qizil("\n  ANTHROPIC_API_KEY o'rnatilmagan.\n"));
    console.log("  Windows'da PowerShell'da quyidagini yozing:\n");
    console.log(rang.sariq('    $env:ANTHROPIC_API_KEY = "sk-ant-..."\n'));
    console.log("  Kalitni console.anthropic.com dan olasiz.");
    console.log("  Batafsil: README.md faylini o'qing.\n");
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  salomlash();

  // Suhbat davomiyligi: har javobdan keyin sessiya raqamini saqlaymiz va
  // keyingi savolda o'sha sessiyani davom ettiramiz.
  let sessiyaId = null;

  // Foydalanuvchi "har doim ruxsat" degan asboblar (shu ish seansi uchun).
  const doimiyRuxsat = new Set(sozlama.soramasdanBajarsin || []);

  // Foydalanuvchidan ruxsat so'rash. true — ruxsat, false — rad.
  const ruxsatSora = async (nomi, kirish) => {
    if (XAVFSIZ.has(nomi) || doimiyRuxsat.has(nomi)) return true;

    console.log();
    console.log(rang.sariq(`  ⚠ Agent quyidagini bajarmoqchi (${nomi}):`));
    console.log(`    ${buyruqniKorsat(nomi, kirish)}`);
    const javob = (await rl.question(rang.sariq("  Ruxsat? (ha / yo'q / doim): "))).trim().toLowerCase();

    if (javob === "doim" || javob === "d") {
      doimiyRuxsat.add(nomi);
      console.log(rang.ochiq(`  → ${nomi} bu seansda boshqa so'ralmaydi.`));
      return true;
    }
    if (javob === "ha" || javob === "h" || javob === "y") return true;

    console.log(rang.ochiq("  → rad etildi."));
    return false;
  };

  // Ruxsat darvozasi PreToolUse hook orqali qo'yiladi. canUseTool emas:
  // uni ham allowedTools ro'yxati, ham kompyuterdagi sozlama fayllaridagi
  // ruxsat qoidalari chetlab o'tishi mumkin. Hook esa har bir asbob
  // chaqiruvida, istisnosiz ishlaydi.
  const ruxsatDarvozasi = async (kirish) => {
    const nomi = kirish.tool_name;
    const parametrlar = (kirish.tool_input ?? {});

    if (XAVFSIZ.has(nomi) || doimiyRuxsat.has(nomi)) return { continue: true };

    const ruxsat = await ruxsatSora(nomi, parametrlar);
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: ruxsat ? "allow" : "deny",
        permissionDecisionReason: ruxsat
          ? "Foydalanuvchi ruxsat berdi."
          : "Foydalanuvchi ruxsat bermadi.",
      },
    };
  };

  while (true) {
    let savol;
    try {
      savol = (await rl.question(rang.kok("\nSiz > "))).trim();
    } catch {
      break; // Ctrl+C / Ctrl+D
    }

    if (!savol) continue;
    if (["chiqish", "exit", "quit", "q"].includes(savol.toLowerCase())) break;
    if (["yangi", "new"].includes(savol.toLowerCase())) {
      sessiyaId = null;
      console.log(rang.ochiq("  Yangi suhbat boshlandi — agent avvalgilarini eslamaydi."));
      continue;
    }

    const sozlamalar = {
      cwd: ISH_PAPKASI,
      additionalDirectories: QOSHIMCHA,
      systemPrompt: { type: "preset", preset: "claude_code", append: QOIDALAR },
      allowedTools: RUXSAT_ETILGAN,
      permissionMode: "default",
      hooks: { PreToolUse: [{ hooks: [ruxsatDarvozasi] }] },
      // Kompyuterdagi ~/.claude sozlamalari ta'sir qilmasin: aks holda
      // ulardagi "ruxsat berilgan" qoidalar darvozani ochib yuborishi mumkin.
      settingSources: [],
      skills: "all",
      includePartialMessages: false,
    };
    if (sozlama.model) sozlamalar.model = sozlama.model;
    if (sessiyaId) sozlamalar.resume = sessiyaId;

    console.log();
    try {
      for await (const xabar of query({ prompt: savol, options: sozlamalar })) {
        if (xabar.session_id) sessiyaId = xabar.session_id;

        if (xabar.type === "assistant" && xabar.message?.content) {
          for (const blok of xabar.message.content) {
            if (blok.type === "text" && blok.text.trim()) {
              console.log(blok.text);
            } else if (blok.type === "tool_use") {
              console.log(rang.ochiq(`  · ${blok.name}: ${buyruqniKorsat(blok.name, blok.input ?? {})}`));
            }
          }
        } else if (xabar.type === "result") {
          if (xabar.subtype !== "success") {
            console.log(rang.qizil(`\n  Ish tugallanmadi: ${xabar.subtype}`));
          }
          if (typeof xabar.total_cost_usd === "number") {
            console.log(rang.ochiq(`\n  (${xabar.num_turns} qadam, taxminan $${xabar.total_cost_usd.toFixed(4)})`));
          }
        }
      }
    } catch (e) {
      console.log(rang.qizil(`\n  Xato: ${e?.message ?? e}`));
      console.log(rang.ochiq("  Qayta urinib ko'ring. Muammo takrorlansa README.md dagi bo'limga qarang."));
    }
  }

  rl.close();
  console.log(rang.ochiq("\n  Xayr.\n"));
}

main().catch((e) => {
  console.error(rang.qizil(`Kutilmagan xato: ${e?.stack ?? e}`));
  process.exit(1);
});
