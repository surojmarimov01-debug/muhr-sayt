---
name: chiqar
description: Qilingan o'zgarishlarni tekshirib, GitHub'ga yuboradi va Pull Request ochadi, toki sayt, Telegram bot va chat yangilansin. Egasi "/chiqar", "saytga chiqar", "joyla" desa ishlating.
disable-model-invocation: true
---

# Saytga chiqarish

Bu ish GitHub'ga yozadi, shuning uchun faqat egasi `/chiqar` deganda bajariladi.

## 1. Tekshir

```
node .claude/skills/tekshir/scripts/tekshir.mjs
```

`XATOLAR` bo'lsa — to'xta, nimani tuzatish kerakligini ayt. Xato bilan chiqarma.

## 2. Nima o'zgarganini ko'rsat

`git status` va `git diff --stat` ni ishga tushir. Natijani egasiga oddiy
tilda ayt ("Saytda avtomat muhr narxi 160 000 dan 180 000 ga o'zgardi, botda
ham"). Ro'yxatda kutilmagan fayl bo'lsa (`.env`, `kalit.txt`, `node_modules`,
kalitga o'xshash matn) — commit qilma, egasiga ayt.

Tasdiq ol: "Shularni chiqaraymi?"

## 3. Commit va push

- `main` da bo'lsang, yangi tarmoq och: `git checkout -b ozgarish/<qisqa-nom>`.
  `main` ga to'g'ridan-to'g'ri push qilma.
- Faqat kerakli fayllarni qo'sh (`git add <fayl>`). `git add -A` ishlatma.
- Commit xabari o'zbekcha, nima o'zgarganini aytadi:
  `Avtomat muhr narxi 180 000 so'm qilindi`.
- `git push -u origin <tarmoq>`.

## 4. Pull Request

PR och (`gh pr create` yoki GitHub vositasi orqali). Sarlavha — commit xabari.
Tavsifda: nima o'zgardi va tekshiruv natijasi.

## 5. Egasiga keyingi qadamni ayt

- "GitHub'da PR ni oching va **Merge** bosing. Netlify 1–2 daqiqada saytni,
  Telegram botni va chatni yangilaydi."
- `mcp-server/` o'zgargan bo'lsa: "Kompyuteringizda `git pull` qiling va
  Claude Desktop'ni qayta oching."
- `agent/` o'zgargan bo'lsa: "`git pull` qilib, `boshla.cmd` ni qayta ishga tushiring."
