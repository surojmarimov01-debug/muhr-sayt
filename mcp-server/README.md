# Shtampchi MCP server

## Bu nima?

**MCP (Model Context Protocol)** — sun'iy intellekt dasturlarini (masalan,
Claude Desktop) tashqi ma'lumot va vositalarga ulaydigan umumiy standart.
"MCP server" — shu standart bo'yicha yozilgan kichik dastur: u Claude'ga
bir nechta **asbob (tool)** taqdim etadi, Claude esa kerak bo'lganda o'sha
asboblarni chaqirib, javobni siz bergan haqiqiy ma'lumotdan oladi.

Bu — **Shtampchi** muhr/shtamp do'koni uchun MCP server.

U Claude Desktop dasturiga do'kon ma'lumotlarini ulab beradi. Ulangandan keyin
Claude'dan o'zbek tilida narx so'rasangiz, u to'g'ridan-to'g'ri sizning
narxlaringiz va mahsulotlaringiz asosida javob beradi — o'ylab topmaydi.

Server uchta asbob (tool) beradi:

| Asbob | Nima qiladi |
| --- | --- |
| `narx_hisobla` | Muhr, shtamp yoki rekvizit narxini hisoblaydi |
| `mahsulotlar_royxati` | Barcha mahsulotlar, o'lchamlari, korpuslari va narxlari |
| `dokon_malumot` | Manzil, ish vaqti, aloqa, buyurtma tartibi, muddat |

To'liq tavsifi — [5-bo'limda](#5-asboblar-tools).

---

## 1. Talablar

### Node.js 20 yoki undan yangi

Kompyuteringizda Node.js bor-yo'qligini tekshiring. Buyruq qatorini oching
(Windows'da: **Win + R** → `cmd` → Enter) va yozing:

```
node --version
```

Agar `v20.0.0` yoki undan katta raqam chiqsa — hammasi joyida.

Agar "node is not recognized" degan xato chiqsa, Node.js o'rnatilmagan.
https://nodejs.org saytiga kiring va **LTS** versiyasini yuklab oling,
o'rnatib bo'lgach buyruq qatorini **yopib, qaytadan oching** va yana tekshiring.

### Claude Desktop

Eng yangi versiyasi kerak: https://claude.ai/download

---

## 2. O'rnatish

1. Loyihani yuklab oling (yoki `git clone` qiling):

   ```
   git clone https://github.com/surojmarimov01-debug/muhr-sayt.git
   ```

   Yoki GitHub'dan ZIP qilib yuklab, bir papkaga chiqaring.

2. Buyruq qatorida `mcp-server` papkasiga kiring:

   ```
   cd muhr-sayt\mcp-server
   ```

   (macOS/Linux'da: `cd muhr-sayt/mcp-server`)

3. Kutubxonalarni o'rnating:

   ```
   npm install
   ```

   Bir necha soniya kutasiz. Xato chiqmasa — tayyor.

4. Papkaning **to'liq yo'lini** (absolute path) yozib oling, keyingi qadamda
   kerak bo'ladi. Buyruq qatorida shuni yozsangiz ko'rsatadi:

   - Windows: `cd`
   - macOS/Linux: `pwd`

   Masalan: `C:\Users\Ali\muhr-sayt\mcp-server`

---

## 3. Claude Desktop'ni sozlash

### Sozlama fayli qayerda?

| Tizim | Fayl manzili |
| --- | --- |
| **Windows** | `%AppData%\Claude\claude_desktop_config.json` |
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

Windows'da eng oson yo'li: **Win + R** bosing, quyidagini yozing va Enter:

```
%AppData%\Claude
```

Ochilgan papkada `claude_desktop_config.json` faylini toping.
Agar bunday fayl bo'lmasa — o'zingiz yarating (bo'sh matn fayli, nomi aynan shunday).

Faylni **Notepad** (Bloknot) bilan oching.

### Nima yozish kerak?

Fayl bo'sh bo'lsa, quyidagini to'liq nusxalab qo'ying:

```json
{
  "mcpServers": {
    "shtampchi": {
      "command": "node",
      "args": ["C:\\Users\\FOYDALANUVCHI\\muhr-sayt\\mcp-server\\index.js"]
    }
  }
}
```

**`C:\\Users\\FOYDALANUVCHI\\muhr-sayt\\mcp-server\\index.js`** — bu joyni
o'zingizning haqiqiy yo'lingizga almashtiring (2-bo'limning 4-qadamida yozib
olgan yo'l + `\index.js`).

Agar faylda allaqachon boshqa serverlar bo'lsa, `"shtampchi"` qatorini
mavjud `"mcpServers"` ichiga qo'shing:

```json
{
  "mcpServers": {
    "boshqa-server": { "command": "..." },
    "shtampchi": {
      "command": "node",
      "args": ["C:\\Users\\FOYDALANUVCHI\\muhr-sayt\\mcp-server\\index.js"]
    }
  }
}
```

### ⚠️ Muhim qoidalar

1. **To'liq yo'l (absolute path) yozing.** `./index.js` yoki `index.js` kabi
   qisqa yo'l **ishlamaydi**. Yo'l `C:\` dan boshlanishi kerak.

2. **Windows'da JSON ichida ikkita teskari chiziq `\\` yozing**, bittasi emas:

   - ✅ To'g'ri: `"C:\\Users\\Ali\\muhr-sayt\\mcp-server\\index.js"`
   - ✅ To'g'ri (bu ham ishlaydi): `"C:/Users/Ali/muhr-sayt/mcp-server/index.js"`
   - ❌ Xato: `"C:\Users\Ali\muhr-sayt\mcp-server\index.js"`

3. **Vergul va qavslarga e'tibor bering.** JSON juda talabchan: ortiqcha yoki
   yetishmayotgan vergul butun faylni buzadi. Nusxalab qo'ygan ma'qul.

4. Faylni **saqlashni unutmang** (Ctrl + S).

### macOS/Linux uchun misol

```json
{
  "mcpServers": {
    "shtampchi": {
      "command": "node",
      "args": ["/Users/ali/muhr-sayt/mcp-server/index.js"]
    }
  }
}
```

---

## 4. Claude Desktop'ni to'liq qayta ishga tushiring

Bu qadam **majburiy**. Oynani X tugmasi bilan yopish yetarli emas —
dastur fonda ishlab turaveradi va yangi sozlamani ko'rmaydi.

**Windows:**

1. Ekranning o'ng pastki burchagidagi **^** (yashirin belgilar) tugmasini bosing.
2. Claude belgisini toping, **o'ng tugma** bilan bosing.
3. **Quit** (Chiqish) ni tanlang.
4. Endi Claude Desktop'ni qaytadan oching.

**macOS:** yuqoridagi menyudan `Claude` → `Quit Claude` (yoki **Cmd + Q**),
so'ng qaytadan oching.

Ochilgandan keyin suhbat oynasidagi asboblar (tools / 🔨) belgisini bossangiz,
`shtampchi` serverining uchta asbobi ro'yxatda ko'rinishi kerak.

---

## 5. Asboblar (tools)

Serverda uchta asbob bor. Claude ularni **o'zi tanlaydi** — sizga asbob nomini
yozish shart emas, oddiy savol bersangiz kifoya. Quyidagi jadval faqat
ma'lumot uchun: qaysi asbob nima qilishini va unga qanday ma'lumot
kerakligini ko'rsatadi.

| Asbob | Nima qiladi | Parametrlari |
| --- | --- | --- |
| `narx_hisobla` | Muhr, shtamp yoki rekvizit narxini hisoblaydi (1 dona narxi + jami) | `mahsulot` (majburiy), `mexanizm` (majburiy), `soni` (ixtiyoriy) |
| `mahsulotlar_royxati` | Do'kondagi mahsulotlarni o'lchami, korpusi va narxi bilan ro'yxat qilib beradi | `mexanizm` (ixtiyoriy) |
| `dokon_malumot` | Do'kon manzili, ish vaqti, aloqa, buyurtma tartibi va tayyorlash muddatini beradi | yo'q (parametrsiz) |

### `narx_hisobla` — parametrlari batafsil

| Parametr | Majburiymi | Mumkin bo'lgan qiymatlar | Izoh |
| --- | --- | --- | --- |
| `mahsulot` | ha | `muhr`, `shtamp`, `rekvizit`, `faksimile`, `datali_shtamp`, `komplekt` | `komplekt` = muhr + shtamp birgalikda |
| `mexanizm` | ha | `mexanik`, `avtomat` | Mexanizm turi |
| `soni` | yo'q | 1 dan katta butun son | Nechta dona kerak. Kiritilmasa **1** deb olinadi |

Javobda: mahsulot nomi, mexanizm, soni, 1 dona narxi, jami summa,
aloqa ma'lumotlari va tayyorlash muddati chiqadi.

### `mahsulotlar_royxati` — parametrlari batafsil

| Parametr | Majburiymi | Mumkin bo'lgan qiymatlar | Izoh |
| --- | --- | --- | --- |
| `mexanizm` | yo'q | `mexanik`, `avtomat`, `hammasi` | Filtr. Kiritilmasa **`hammasi`** — barcha mahsulot ko'rsatiladi |

Javobda har bir mahsulot uchun: nomi, mexanizmi, o'lchami, korpusi va narxi.
Oxirida mexanik/avtomat farqi ham qisqacha yoziladi.

### `dokon_malumot` — parametrlari batafsil

Parametr talab qilmaydi. Javobda: do'kon nomi, joylashuvi, tayyorlash muddati,
ish vaqti, telefon, Telegram, sayt, buyurtmaning 3 qadami va mahsulot turlari.

> **Eslatma:** narxlar `index.js` faylida yozilgan va "dan" boshlanadi.
> Narx o'zgarsa, faylni tahrirlab, Claude Desktop'ni qayta ishga tushiring
> (4-bo'limga qarang).

---

## 6. Sinab ko'rish — Claude'ga nima deb aytish mumkin

Claude'ga oddiy o'zbek tilida savol bering. U kerakli asbobni o'zi tanlaydi.

**Narx haqida** (`narx_hisobla` ishlaydi)**:**

- "Avtomatik muhr va shtamp komplekti qancha turadi?"
- "5 ta mexanik muhr necha pul bo'ladi?"
- "Faksimile narxi qancha?"
- "Avtomatik rekvizit shtampi qancha?"

**Mahsulotlar haqida** (`mahsulotlar_royxati` ishlaydi)**:**

- "Qanday mahsulotlaringiz bor?"
- "Avtomatik muhrlarning o'lchamlari qanday?"
- "Mexanik va avtomat o'rtasida qanday farq bor?"

**Do'kon haqida** (`dokon_malumot` ishlaydi)**:**

- "Ish vaqtingiz qanday?"
- "Muhr necha vaqtda tayyor bo'ladi?"
- "Buyurtma qanday beriladi?"
- "Telefon raqamingiz qanday?"

---

## 7. Muammolarni hal qilish

### Asboblar Claude'da ko'rinmayapti

Tartib bilan tekshiring:

1. **`npm install` qilganmisiz?** `mcp-server` papkasi ichida `node_modules`
   degan papka bo'lishi kerak. Bo'lmasa — `npm install` ni qayta bajaring.

2. **Yo'l to'g'rimi?** Buyruq qatorida serverni qo'lda ishga tushirib ko'ring
   (sozlamadagi yo'lni aynan nusxalab):

   ```
   node C:\Users\FOYDALANUVCHI\muhr-sayt\mcp-server\index.js
   ```

   Agar `Shtampchi MCP server ishga tushdi (stdio).` deb yozsa — server soz.
   To'xtatish uchun **Ctrl + C** bosing.

   Agar `Cannot find module` chiqsa — yo'l xato yoki `npm install` qilinmagan.

3. **JSON buzilmaganmi?** `claude_desktop_config.json` faylini
   https://jsonlint.com saytiga nusxalab tekshirib ko'ring.

4. **Claude'ni to'liq yopganmisiz?** 4-bo'limga qarang (tray → Quit).

### "node is not recognized" xatosi

Node.js o'rnatilmagan yoki PATH'ga tushmagan. Node.js'ni qaytadan o'rnating
va kompyuterni qayta yuklang.

Agar shundan keyin ham `command: "node"` ishlamasa, `node.exe` ning to'liq
yo'lini yozing:

```json
{
  "mcpServers": {
    "shtampchi": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\Users\\FOYDALANUVCHI\\muhr-sayt\\mcp-server\\index.js"]
    }
  }
}
```

### Loglarni qayerdan ko'raman?

Claude Desktop MCP loglarini shu yerga yozadi:

| Tizim | Loglar papkasi |
| --- | --- |
| **Windows** | `%AppData%\Claude\logs\` |
| **macOS** | `~/Library/Logs/Claude/` |
| **Linux** | `~/.config/Claude/logs/` |

Bizga kerakli fayl: **`mcp-server-shtampchi.log`**
(umumiy xatolar esa `mcp.log` faylida).

Windows'da: **Win + R** → `%AppData%\Claude\logs` → Enter.

Faylni Notepad bilan oching va oxirgi qatorlarni o'qing — xato sababi
odatda o'sha yerda yoziladi.

### Ko'p uchraydigan xatolar

| Xato | Sabab | Yechim |
| --- | --- | --- |
| `Cannot find module '@modelcontextprotocol/server'` | `npm install` qilinmagan | `mcp-server` papkasida `npm install` |
| `Cannot find module '...index.js'` | Yo'l xato | To'liq yo'lni qayta tekshiring |
| `node is not recognized` | Node.js yo'q | Node.js o'rnating |
| Claude umuman javob bermaydi | JSON buzilgan | Vergul/qavslarni tekshiring |
| Sozlash ta'sir qilmadi | Claude to'liq yopilmagan | Tray → Quit |

---

## 8. Texnik ma'lumot

- **Server nomi:** `shtampchi`, versiya `1.0.0`
- **Transport:** STDIO (stdout faqat JSON-RPC uchun; loglar stderr'ga yoziladi)
- **MCP protokol versiyasi:** `2025-06-18`
- **Node.js:** 20 yoki undan yangi (`engines` shartida yozilgan)
- **Til:** oddiy JavaScript (ESM) — hech qanday build/kompilyatsiya kerak emas
- **Kutubxonalar:** `@modelcontextprotocol/server`, `zod`
- **Ishga tushirish buyrug'i:** `node index.js`

Narxlar va mahsulotlar ro'yxati `index.js` faylining yuqori qismida —
`NARXLAR` va `MAHSULOTLAR` o'zgaruvchilarida. Narx o'zgarsa, o'sha yerni
tahrirlang va Claude Desktop'ni qayta ishga tushiring.

---

## Aloqa

- Telegram: [@shtampchi_bola](https://t.me/shtampchi_bola)
- Telefon: +998 99 420 11 51
- Sayt: https://shtampchi-muhr.netlify.app
