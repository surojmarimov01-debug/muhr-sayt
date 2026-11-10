---
name: narx-ozgartir
description: Muhr, shtamp, rekvizit, faksimile, datali shtamp yoki komplekt narxini sayt, Telegram bot, sayt chat-yordamchisi va MCP serverda birdaniga o'zgartiradi. Egasi "narxni o'zgartir", "narxlar oshdi", "avtomat muhr endi 180 000", "mexanikni arzonlashtir" desa ishlating.
argument-hint: "[mahsulot] [yangi narx]"
---

# Narxni o'zgartirish

Egasining so'rovi: $ARGUMENTS

## 1. Nimani o'zgartirishni aniqla

Narxlar toifalarga bo'lingan (`mcp-server/index.js` → `NARXLAR`):

| Toifa | Mexanik | Avtomat |
|---|---|---|
| `muhr`, `shtamp`, `rekvizit` | bitta narx | bitta narx |
| `faksimile`, `datali_shtamp` | bitta narx | bitta narx |
| `komplekt` (muhr + shtamp) | bitta narx | bitta narx |

Avval `NARXLAR` ni o'qib, hozirgi narxlarni jadval qilib ko'rsat. So'rov noaniq
bo'lsa, **so'ra** — taxmin qilma. Masalan:
- "muhr narxi" — mexanikmi, avtomatmi?
- muhr narxi o'zgarsa, shtamp va rekvizit ham o'zgaradimi? (Hozir uchalasi bir narxda.)
- komplekt narxi ham o'zgaradimi?

Keyin "eski → yangi" ro'yxatini ko'rsatib, egasidan **tasdiq ol**.

## 2. Hamma joyda o'zgartir

Eski summani ikkala ko'rinishda qidir — `70 000` va `70000`:

```
grep -rn "70 000\|70000" public/index.html netlify/functions mcp-server/index.js
```

Diqqat: bitta summa bir necha mahsulotniki bo'lishi mumkin (masalan, 70 000 —
mexanik muhr, shtamp va rekvizit). Faqat o'zgarayotgan mahsulotning qatorlarini
o'zgartir.

| Fayl | Joy | Ko'rinishi |
|---|---|---|
| `mcp-server/index.js` | `NARXLAR` va `MAHSULOTLAR[].narx` | `160000` |
| `public/index.html` | `#narxlar`: `.price-amount`, `.price-note`, rasmli kartochkalardagi `<p>… so'm.</p>` | `160 000` |
| `netlify/functions/telegram.mjs` | `KATALOG[].narx`, `KATALOG[].tugma`, `JAVOB.narx`, `NARX_QISQA` | `160 000` |
| `netlify/functions/chat.mjs` | `system` ko'rsatmasidagi "DO'KON MA'LUMOTLARI" | `160 000` |

Telegram tugma yozuvi qisqa bo'lsin (`"Avtomat muhr R40 · 160 000"`), aks holda
tugma ikki qatorga bo'linib ketadi.

## 3. Tekshir

```
node .claude/skills/tekshir/scripts/tekshir.mjs
```

`XATOLAR` bo'sh bo'lmaguncha tuzatishda davom et. Eski summani yana bir bor
`grep` qilib, qolib ketgan joy yo'qligiga ishonch hosil qil.

## 4. Natijani ayt

Qisqa jadval: mahsulot — eski narx — yangi narx — qaysi joylarda o'zgardi.
Keyin ayt: "Saytga chiqishi uchun `/chiqar` deng." O'zgarish `main` ga
qo'shilmaguncha mijozlar eski narxni ko'radi.
