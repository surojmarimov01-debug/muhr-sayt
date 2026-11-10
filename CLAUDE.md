# Shtampchi — loyiha qo'llanmasi (Claude uchun)

Bu fayl Claude Code har safar shu papkada ishga tushganda o'qiladi. Unda loyiha
nimaligi, nima qayerda turgani va qanday qoidalarga amal qilish yozilgan.

## Kim bilan ishlaysan

Foydalanuvchi — "Shtampchi" muhr va shtamp do'konining egasi. U dasturchi emas.

- Har doim **o'zbek tilida** (lotin yozuvida), oddiy va qisqa javob ber.
- Texnik atamani ishlatsang, bir gap bilan tushuntir.
- Ish tugagach ayt: nima o'zgardi, qaysi faylda, endi nima qilish kerak.
- Narx, manzil, telefon kabi **biznes ma'lumotini o'zing o'ylab topma va
  o'zing tanlama**. Ikki joyda ikki xil yozilgan bo'lsa, qaysi biri to'g'ri
  ekanini egasidan so'ra.

## Loyiha xaritasi

| Papka / fayl | Nima |
|---|---|
| `public/index.html` | Sayt (bitta sahifa): narxlar, rasmli katalog, buyurtma shakli, AI chat oynasi |
| `public/admin.html` | Admin panel — Google orqali kirib, saytdan kelgan buyurtmalarni ko'rish |
| `public/*.jpg` | Mahsulot rasmlari. Sayt ham, Telegram bot ham shu yerdan oladi |
| `netlify/functions/order.mjs` | Saytdagi buyurtma shakli → Telegram guruhiga xabar + saqlash + HubSpot |
| `netlify/functions/telegram.mjs` | Telegram bot: menyu, katalog, 4 qadamli buyurtma, operator bilan yozishma |
| `netlify/functions/chat.mjs` | Saytdagi AI yordamchi (Claude API). Do'kon ma'lumoti uning ko'rsatmasida yozilgan |
| `netlify/functions/orders.mjs`, `admin-*.mjs`, `lib/admin-auth.mjs` | Admin panel uchun: kirish, sessiya, buyurtmalar ro'yxati |
| `netlify/lib/hubspot.mjs` | Har buyurtmani HubSpot CRM ga yozadi. Xato bo'lsa ham buyurtmani buzmaydi |
| `mcp-server/` | Claude Desktop uchun MCP server: `narx_hisobla`, `mahsulotlar_royxati`, `dokon_malumot` |
| `agent/` | Egasining kompyuterida ishlaydigan "Shtampchi agent" (terminal, o'zbekcha buyruq) |
| `claude-vscode-extension/` | VS Code uchun alohida Claude chat kengaytmasi |
| `netlify.toml` | Netlify sozlamasi: sayt `public/` dan, funksiyalar `netlify/functions/` dan |

Sayt Netlify'da turadi: https://shtampchi-muhr.netlify.app

## Eng muhim narsa: bir ma'lumot bir necha joyda yozilgan

Narxlar, mahsulotlar va aloqa ma'lumotlari **4 ta faylda alohida-alohida**
yozilgan. Bittasini o'zgartirib qolganini unutsang, sayt bir narx, bot boshqa
narx aytadi. Shuning uchun:

| Ma'lumot | Qayerlarda |
|---|---|
| Narxlar | `mcp-server/index.js` (`NARXLAR`, `MAHSULOTLAR`), `public/index.html` (`#narxlar` bo'limi), `telegram.mjs` (`KATALOG`, `JAVOB.narx`, `NARX_QISQA`), `chat.mjs` (`system` ko'rsatmasi) |
| Mahsulot va rasm | `public/*.jpg`, `public/index.html` (kartochka), `telegram.mjs` (`RASMLAR`, `KATALOG`), `mcp-server/index.js` (`MAHSULOTLAR`) |
| Manzil, ish vaqti, telefon, Telegram | `telegram.mjs` (`SHOP`), `mcp-server/index.js` (`DOKON`), `chat.mjs`, `public/index.html` |

Bunday o'zgarishlarni **har doim tegishli ish tartibi (skill) bilan** qil va
oxirida tekshiruvni ishga tushir.

**Asosiy narx ro'yxati** — `mcp-server/index.js` dagi `NARXLAR`. Tekshiruv
skripti boshqa hamma joyni shunga solishtiradi.

## Ish tartiblari (skills)

`.claude/skills/` papkasida turadi. Egasi oddiy gap bilan aytsa ham, `/nomi`
deb yozsa ham ishlaydi.

| Skill | Qachon |
|---|---|
| `/narx-ozgartir` | "Avtomat muhr endi 180 000", "narxlar oshdi" |
| `/mahsulot-qosh` | Yangi model yoki yangi rasm qo'shish |
| `/dokon-malumot` | Manzil, ish vaqti, telefon, Telegram yoki tayyorlash muddati o'zgardi |
| `/tekshir` | Hamma joyda narx va ma'lumot bir xilmi, kodda xato yo'qmi |
| `/chiqar` | O'zgarishlarni GitHub'ga yuborib, saytga chiqarish |

## Tekshirish

Har qanday o'zgarishdan keyin loyiha ildizidan:

```
node .claude/skills/tekshir/scripts/tekshir.mjs
```

U hech narsani o'zgartirmaydi: kod sintaksisini, narxlar mosligini, rasmlarni
va aloqa ma'lumotlarini tekshiradi. `XATOLAR` bo'limi bo'sh bo'lmaguncha ishni
tugadi dema. Sayt, bot va MCP server uchun boshqa test yoki build yo'q.

## Kod qoidalari

- Hamma matn, izoh va o'zgaruvchi nomlari o'zbekcha (`narx`, `mahsulot`,
  `buyurtma`). Apostrof oddiy `'` belgisi: `so'm`, `do'kon`.
- Narx yozilishi: saytda va botda `160 000 so'm` (minglik orasida probel),
  `mcp-server` da raqam `160000`. Narxlar "dan" — ya'ni shu summadan boshlanadi.
- Netlify funksiyalarida maxfiy kalit faqat shunday o'qiladi:
  `typeof Netlify !== "undefined" && Netlify.env ? Netlify.env.get(k) : process.env[k]`.
- `telegram.mjs` da mijozdan kelgan matn HTML ga qo'yilishidan oldin `esc()`
  dan o'tadi. Bot javoblari `parse_mode: "HTML"` bilan ketadi.
- `telegram.mjs` holat saqlamaydi: buyurtmaning nechanchi qadamda ekani
  xabardagi `Buyurtma (N/4)` belgisidan o'qiladi. Shu matnlarni o'zgartirsang,
  ularni o'qiydigan kodni ham tekshir.
- Telegram bir yo'la ko'pi bilan 10 ta rasm yuboradi — `RASMLAR` ro'yxati 10 tadan oshmasin.
- `hubspot.mjs` hech qachon tashqariga xato tashlamaydi — buyurtma HubSpot
  ishlamasa ham o'tishi kerak.
- `mcp-server/index.js` da `console.log` yozma: u stdout orqali Claude Desktop
  bilan gaplashadi. Faqat `console.error`.

## Sirlar

Kalitlar faqat Netlify → Site configuration → Environment variables da turadi,
**kodga, izohga yoki commit'ga hech qachon yozilmaydi**:
`TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`, `ANTHROPIC_API_KEY`, `HUBSPOT_TOKEN`,
`HONCHO_API_KEY`, `HONCHO_WORKSPACE`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAIL`,
`ADMIN_SESSION_SECRET`. Agent uchun kalit `agent/kalit.txt` da (git'ga tushmaydi).

## Biznes qoidalari

- Telegram botda do'kon telefon raqami **mijozga ko'rsatilmaydi** — mijoz
  qo'ng'iroq qilmaydi, do'kon o'zi bog'lanadi. `SHOP.telefon` faqat zaxira
  uchun turibdi. Saytda esa telefon ko'rinadi.
- Maket mijoz tasdiqlamaguncha ishlab chiqarilmaydi. Tayyorlash muddati — 15 daqiqa.
- Sayt AI yordamchisi (`chat.mjs`) faqat do'kon mavzusida, 2-3 gap bilan javob beradi.

## Saytga chiqarish

`main` tarmog'iga to'g'ridan-to'g'ri yozma. Yangi tarmoq → commit → push →
Pull Request. Egasi PR ni `main` ga qo'shgach, Netlify saytni, botni va chatni
o'zi yangilaydi. `mcp-server/` va `agent/` egasining kompyuterida ishlaydi:
ular uchun egasi `git pull` qilib, dasturni qayta ishga tushirishi kerak.
Batafsil — `/chiqar`.
