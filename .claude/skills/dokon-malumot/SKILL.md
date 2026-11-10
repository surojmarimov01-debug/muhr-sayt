---
name: dokon-malumot
description: Do'kon manzili, ish vaqti, telefon raqami, Telegram manzili yoki tayyorlash muddatini sayt, Telegram bot, sayt chat-yordamchisi va MCP serverda birdaniga o'zgartiradi. Egasi "manzil o'zgardi", "ko'chdik", "ish vaqti endi…", "yangi raqam", "telegram akkaunt almashdi" desa ishlating.
argument-hint: "[nima o'zgardi]"
---

# Do'kon ma'lumotini o'zgartirish

Egasining so'rovi: $ARGUMENTS

## 1. Hozirgi holatni ko'rsat

Tekshiruvni ishga tushir — u har bir fayldagi manzil, telefon va ish vaqtini
solishtiradi:

```
node .claude/skills/tekshir/scripts/tekshir.mjs
```

Yangi qiymat aniq bo'lmasa, so'ra (masalan, ish vaqti: shanba ham shundaymi?).
"Eski → yangi" ro'yxatini ko'rsatib, tasdiq ol.

## 2. Qayerda nima turadi

| Ma'lumot | `telegram.mjs` | `mcp-server/index.js` | `chat.mjs` | `public/index.html` |
|---|---|---|---|---|
| Manzil | `SHOP.manzil` | `DOKON.joylashuv` | `system` ning 1-qatori | — |
| Ish vaqti | `SHOP.ishVaqti` | `DOKON.ish_vaqti` | `system` | futer (`Dushanba–Shanba`) |
| Telefon | `SHOP.telefon` (mijozga ko'rsatilmaydi) | `DOKON.telefon` | `system` | `tel:` havolalar va xato xabarlari |
| Telegram | `SHOP.operator` (`@` siz) | `DOKON.telegram`, `telegram_havola` | `system` | `t.me/` havolalar, JS dagi `var TG=` |
| Muddat | `SHOP.muddat` | `DOKON.muddat` | `system` | matnlar ichida ("15 daqiqada") |

Qidirish uchun eski qiymatni `grep` qil. Telefon uchun ikkala ko'rinishni
qidir: `+998 99 420 11 51` va `+998994201151`.

## 3. Qoidalar

- Telegram botda telefon raqami **mijozga ko'rsatilmaydi**. `SHOP.telefon` ni
  yangila, lekin uni bot javoblariga qo'shma.
- Telefon formati: ko'rinadigan matnda `+998 99 420 11 51`, `tel:` havolada
  `+998994201151`.

## 4. Tekshir va ayt

Tekshiruvni qayta ishga tushir. Telefon, Telegram va ish vaqti uchun `XATOLAR`
qolmasin, manzil uchun ogohlantirish yo'qolsin. Keyin egasiga nima o'zgarganini
ayt va saytga chiqarish uchun `/chiqar` deyishini eslat. `mcp-server`
o'zgargan bo'lsa, Claude Desktop'ni qayta ishga tushirish kerakligini ham ayt.
