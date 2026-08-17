# Loyiha va foydalanuvchi haqida

Bu fayl Claude har safar avtomatik o'qiydi. Bu yerga yozilgan narsalarni
qayta-qayta tushuntirish shart emas.

## Muloqot tili va uslubi

- **O'zbek tilida yoz.** Foydalanuvchi o'zbekcha yozadi va o'zbekcha javob kutadi.
- **Sodda qilib tushuntir.** Texnik jargonsiz. "Deploy", "environment variable",
  "endpoint" kabi so'zlarni ishlatsang, qavs ichida oddiy tilda izohla.
- **Qadam-baqadam yoz.** Uzun matn emas — raqamlangan qadamlar, qisqa gaplar.
- **Buyruqlarni tayyor holda ber.** Foydalanuvchi buyruqni o'zi yig'ishi kerak
  bo'lmasin — nusxalab qo'yadigan qilib yoz.
- Muammo bo'lsa, avval **sababini** ayt, keyin yechimni. Faqat yechim berish kam.

## Foydalanuvchining texnik sharoiti

- **Operatsion tizim: Windows.** Terminal — PowerShell yoki CMD.
  Bash skriptlar (`.sh`) uning kompyuterida ishlamaydi — PowerShell (`.ps1`)
  yoki tayyor bitta qatorli buyruq ber.
- Terminal bilan ishlash tajribasi kam — "papkaga o'ting", "PATH ga qo'shing"
  kabi narsalarni tushuntirib ket.
- Claude bilan asosan **brauzer orqali** (claude.ai) ishlaydi.
- Node.js o'rnatilgan (`C:\Program Files\nodejs`), Claude Code CLI o'rnatilmoqda.
- PowerShell'da **skript ishga tushirish o'chirilgan** (`UnauthorizedAccess` xatosi).
  Shuning uchun `npm` o'rniga `npm.cmd` ishlatish kerak, yoki avval:
  `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

## Loyiha: muhr-sayt

Muhr, shtamp va rekvizit sotadigan sayt.

- `public/index.html` — asosiy sayt (bitta fayl), mahsulot rasmlari shu yerda
- `netlify/functions/` — server tomoni funksiyalari:
  - `order.mjs` — buyurtma qabul qilish
  - `telegram.mjs` — Telegram'ga xabar yuborish
  - `chat.mjs` — saytdagi Claude yordamchisi
- `netlify.toml` — Netlify sozlamalari, `public` papkasi chop etiladi
- `claude-vscode-extension/` — Claude API'ga ulanadigan VS Code kengaytmasi

## Ish yuritish qoidalari

- O'zim bajara oladigan ishni **so'ramasdan bajaraman** — fayl yaratish,
  tekshirish, commit, push.
- Foydalanuvchidan faqat men qila olmaydigan narsani so'rayman
  (parol, API kalit, to'lov, brauzerdagi tugma).
- Ish tugagach **tekshiraman** va natijani ochiq aytaman — ishlamasa,
  ishlamadi deb aytaman.
- Maxfiy ma'lumot (API kalit, parol) hech qachon git'ga tushmasin.
  `.env` fayli `.gitignore` ichida.

## Integratsiyalar holati

- **Honcho MCP** (xotira xizmati) — config fayllar tayyor (`.mcp.json`,
  `.vscode/mcp.json`, `.cursor/mcp.json`, `docs/honcho-mcp.md`), lekin
  **hali ulanmagan**: Honcho hisobi to'lov usuli biriktirilmagani uchun
  ishga tushmagan. Batafsil: `docs/honcho-mcp.md`.
