#!/usr/bin/env node
/**
 * Shtampchi MCP server
 * -------------------------------------------------------------
 * Muhr / shtamp do'koni "Shtampchi" uchun Model Context Protocol server.
 * Claude Desktop'ga STDIO orqali ulanadi.
 *
 * MUHIM: stdout faqat JSON-RPC uchun ishlatiladi.
 * Hech qachon console.log() yozmang — faqat console.error().
 */

import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

/* ---------------------------------------------------------------
 * Do'kon ma'lumotlari
 * --------------------------------------------------------------- */

const DOKON = {
  nomi: 'Shtampchi',
  joylashuv: 'Toshkent, shahar markazi',
  muddat: '15 daqiqa',
  ish_vaqti: 'Dushanba–Shanba, 9:00–18:00 (Yakshanba dam olish)',
  telefon: '+998 99 420 11 51',
  telegram: '@shtampchi_bola',
  telegram_havola: 'https://t.me/shtampchi_bola',
  sayt: 'https://shtampchi-muhr.netlify.app'
};

/** Narxlar "dan" boshlanadi, so'mda. */
const NARXLAR = {
  muhr: { mexanik: 70000, avtomat: 160000 },
  shtamp: { mexanik: 70000, avtomat: 160000 },
  rekvizit: { mexanik: 70000, avtomat: 160000 },
  faksimile: { mexanik: 60000, avtomat: 150000 },
  datali_shtamp: { mexanik: 60000, avtomat: 150000 },
  komplekt: { mexanik: 140000, avtomat: 320000 }
};

const MAHSULOT_NOMI = {
  muhr: 'Muhr',
  shtamp: 'Shtamp',
  rekvizit: 'Rekvizit shtampi',
  faksimile: 'Faksimile',
  datali_shtamp: 'Datali shtamp',
  komplekt: 'Komplekt (muhr + shtamp)'
};

const MEXANIZM_NOMI = {
  mexanik: 'Mexanik',
  avtomat: 'Avtomatik'
};

const MAHSULOTLAR = [
  {
    nomi: 'Mexanik muhr',
    mexanizm: 'mexanik',
    olcham: '41,5 mm dumaloq',
    korpus: 'Printer',
    narx: 70000
  },
  {
    nomi: 'Mexanik shtamp',
    mexanizm: 'mexanik',
    olcham: '40×50 mm',
    korpus: 'Printer',
    narx: 70000
  },
  {
    nomi: 'Mexanik rekvizit',
    mexanizm: 'mexanik',
    olcham: '32×65 mm',
    korpus: 'Printer',
    narx: 70000
  },
  {
    nomi: 'Avtomatik muhr — Mouse R40',
    mexanizm: 'avtomat',
    olcham: '41,5 mm dumaloq',
    korpus: 'Colop Mouse R40',
    narx: 160000
  },
  {
    nomi: 'Avtomatik muhr — Colop R40',
    mexanizm: 'avtomat',
    olcham: '40 mm dumaloq',
    korpus: 'Colop Printer R40',
    narx: 160000
  },
  {
    nomi: 'Avtomatik rekvizit — Colop C50',
    mexanizm: 'avtomat',
    olcham: '30×69 mm',
    korpus: 'Colop Printer C50',
    narx: 160000
  },
  {
    nomi: 'Avtomatik shtamp — Trodat 4924',
    mexanizm: 'avtomat',
    olcham: '40×40 mm',
    korpus: 'Ideal by Trodat 4924',
    narx: 160000
  }
];

/* ---------------------------------------------------------------
 * Yordamchi funksiyalar
 * --------------------------------------------------------------- */

/**
 * Raqamni mingliklar bo'yicha probel bilan ajratadi: 160000 -> "160 000".
 * Locale'ga bog'liq bo'lmasligi uchun qo'lda yozilgan.
 * @param {number} son
 * @returns {string}
 */
function raqam(son) {
  const butun = Math.round(Number(son) || 0);
  const manfiy = butun < 0 ? '-' : '';
  return manfiy + String(Math.abs(butun)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Narxni "160 000 so'm" ko'rinishida qaytaradi. */
function som(son) {
  return `${raqam(son)} so'm`;
}

/** Matnli javobni MCP formatiga o'raydi. */
function matn(text) {
  return { content: [{ type: 'text', text }] };
}

const ALOQA_ESLATMA =
  `Aniq narx uchun bog'laning:\n` +
  `  Telegram: ${DOKON.telegram} (${DOKON.telegram_havola})\n` +
  `  Telefon: ${DOKON.telefon}`;

/* ---------------------------------------------------------------
 * Server
 * --------------------------------------------------------------- */

const server = new McpServer(
  { name: 'shtampchi', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

/* --- 1-asbob: narx_hisobla --------------------------------------- */

server.registerTool(
  'narx_hisobla',
  {
    title: 'Narx hisoblash',
    description:
      "Muhr, shtamp yoki rekvizit narxini hisoblaydi. Mijoz narx so'raganda ishlating.",
    inputSchema: z.object({
      mahsulot: z
        .enum(['muhr', 'shtamp', 'rekvizit', 'faksimile', 'datali_shtamp', 'komplekt'])
        .describe("Mahsulot turi. komplekt = muhr + shtamp birgalikda."),
      mexanizm: z
        .enum(['mexanik', 'avtomat'])
        .describe('Mexanizm turi: mexanik yoki avtomat.'),
      soni: z
        .number()
        .int()
        .min(1)
        .default(1)
        .describe('Nechta dona kerak. Kiritilmasa 1 deb olinadi.')
    })
  },
  async ({ mahsulot, mexanizm, soni }) => {
    const dona = Number.isInteger(soni) && soni >= 1 ? soni : 1;
    const birlik = NARXLAR[mahsulot]?.[mexanizm];

    if (typeof birlik !== 'number') {
      return matn(
        `Kechirasiz, "${mahsulot}" (${mexanizm}) uchun narx topilmadi.\n\n${ALOQA_ESLATMA}`
      );
    }

    const jami = birlik * dona;

    const qatorlar = [
      'NARX HISOBI — Shtampchi',
      '',
      `Mahsulot: ${MAHSULOT_NOMI[mahsulot]}`,
      `Mexanizm: ${MEXANIZM_NOMI[mexanizm]}`,
      `Soni: ${dona} dona`,
      `1 dona narxi: ${som(birlik)} dan`,
      `Jami: ${som(jami)} dan`,
      '',
      "Diqqat: narxlar shu summadan boshlanadi ('dan'). Aniq narx korpus",
      "(mexanizm modeli) va buyurtma hajmiga qarab o'zgarishi mumkin.",
      '',
      ALOQA_ESLATMA,
      '',
      `Tayyorlash muddati: ${DOKON.muddat}.`
    ];

    return matn(qatorlar.join('\n'));
  }
);

/* --- 2-asbob: mahsulotlar_royxati -------------------------------- */

server.registerTool(
  'mahsulotlar_royxati',
  {
    title: "Mahsulotlar ro'yxati",
    description:
      "Do'kondagi barcha mahsulotlar, o'lchamlari, korpuslari va narxlarini ro'yxat qilib beradi.",
    inputSchema: z.object({
      mexanizm: z
        .enum(['mexanik', 'avtomat', 'hammasi'])
        .default('hammasi')
        .describe(
          "Qaysi mexanizm bo'yicha filtrlash. Kiritilmasa hamma mahsulot ko'rsatiladi."
        )
    })
  },
  async ({ mexanizm }) => {
    const filtr = mexanizm ?? 'hammasi';
    const royxat =
      filtr === 'hammasi'
        ? MAHSULOTLAR
        : MAHSULOTLAR.filter((m) => m.mexanizm === filtr);

    if (royxat.length === 0) {
      return matn(
        `"${filtr}" bo'yicha mahsulot topilmadi.\n\n${ALOQA_ESLATMA}`
      );
    }

    const sarlavha =
      filtr === 'hammasi'
        ? "SHTAMPCHI — MAHSULOTLAR RO'YXATI"
        : `SHTAMPCHI — ${MEXANIZM_NOMI[filtr].toUpperCase()} MAHSULOTLAR`;

    const qatorlar = [sarlavha, ''];

    for (const m of royxat) {
      qatorlar.push(
        `• ${m.nomi}`,
        `    Mexanizm: ${MEXANIZM_NOMI[m.mexanizm]}`,
        `    O'lcham: ${m.olcham}`,
        `    Korpus: ${m.korpus}`,
        `    Narx: ${som(m.narx)} dan`,
        ''
      );
    }

    qatorlar.push(
      'MEXANIZMLAR HAQIDA',
      "  Mexanik — taxminan 3 yil xizmat qiladi, alohida shtempel",
      '  yostiqchasi bilan beriladi.',
      "  Avtomat — taxminan 5 yil xizmat qiladi, ichki bo'yoq",
      '  yostiqchali (kraskasi bor).',
      '',
      "Narxlar shu summadan boshlanadi ('dan').",
      '',
      ALOQA_ESLATMA
    );

    return matn(qatorlar.join('\n'));
  }
);

/* --- 3-asbob: dokon_malumot -------------------------------------- */

server.registerTool(
  'dokon_malumot',
  {
    title: "Do'kon ma'lumoti",
    description:
      "Do'kon haqida ma'lumot: manzil, ish vaqti, aloqa, buyurtma tartibi va tayyorlash muddati.",
    inputSchema: z.object({})
  },
  async () => {
    const qatorlar = [
      `${DOKON.nomi.toUpperCase()} — DO'KON MA'LUMOTI`,
      '',
      `Nomi: ${DOKON.nomi}`,
      `Joylashuv: ${DOKON.joylashuv}`,
      `Tayyorlash muddati: ${DOKON.muddat}`,
      `Ish vaqti: ${DOKON.ish_vaqti}`,
      '',
      'ALOQA',
      `  Telefon: ${DOKON.telefon}`,
      `  Telegram: ${DOKON.telegram} (${DOKON.telegram_havola})`,
      `  Sayt: ${DOKON.sayt}`,
      '',
      'BUYURTMA TARTIBI (3 qadam)',
      '  1) Guvohnoma yoki eski muhr suratini yuborasiz',
      "     (matnni qo'lda yozsangiz ham bo'ladi).",
      "  2) Maketni ko'rasiz — o'zgartirish bepul, siz",
      '     tasdiqlaguningizcha.',
      `  3) ${DOKON.muddat}da tayyor — kelib olasiz yoki`,
      '     yetkazib beramiz.',
      '',
      'TURLARI',
      '  • MCHJ muhri',
      '  • YaTT muhri',
      '  • Avtomatik muhr',
      '  • Rekvizit shtampi',
      '  • Faksimile',
      '  • Datali shtamp'
    ];

    return matn(qatorlar.join('\n'));
  }
);

/* ---------------------------------------------------------------
 * Ishga tushirish
 * --------------------------------------------------------------- */

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout'ga YOZMANG — faqat stderr.
  console.error('Shtampchi MCP server ishga tushdi (stdio).');
}

main().catch((err) => {
  console.error('Shtampchi MCP server xatosi:', err);
  process.exit(1);
});
