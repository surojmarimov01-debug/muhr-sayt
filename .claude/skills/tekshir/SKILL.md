---
name: tekshir
description: Shtampchi loyihasini tekshiradi — narxlar sayt, Telegram bot, sayt chat-yordamchisi va MCP serverda bir xilmi, rasmlar joyidami, telefon/manzil/ish vaqti mosmi, kodda sintaksis xatosi yo'qmi. Egasi "tekshir", "hammasi joyidami", "narxlar to'g'rimi" desa yoki narx, mahsulot, aloqa ma'lumoti o'zgartirilgandan keyin ishlating.
allowed-tools: Bash(node .claude/skills/tekshir/scripts/tekshir.mjs)
---

# Loyihani tekshirish

1. Loyiha ildizidan ishga tushir:

   ```
   node .claude/skills/tekshir/scripts/tekshir.mjs
   ```

   Skript hech narsani o'zgartirmaydi. Asosiy narx ro'yxati —
   `mcp-server/index.js` dagi `NARXLAR`. Qolgan hamma joy shunga solishtiriladi.

2. Natijani egasiga oddiy tilda ayt:
   - **XATOLAR** — tuzatish kerak. Har birini bir gap bilan tushuntir: qayerda,
     nima noto'g'ri, mijoz nima ko'radi. Masalan: "Telegram bot rekvizitni
     60 000 deb aytyapti, saytda esa 70 000."
   - **OGOHLANTIRISHLAR** — ko'rib chiqish kerak, lekin sayt buzilmaydi.
   - Hech narsa topilmasa — "Hammasi joyida" de, cho'zma.

3. Tuzatish:
   - **Kod xatosi** (sintaksis, yo'q rasm, noto'g'ri width/height) — o'zing tuzat,
     keyin skriptni qayta ishga tushir.
   - **Biznes ma'lumoti** (narx, manzil, telefon) ikki joyda ikki xil bo'lsa —
     **o'zing tanlama**. Ikkala variantni ko'rsatib, qaysi biri to'g'ri ekanini
     so'ra. Javobga qarab `/narx-ozgartir` yoki `/dokon-malumot` bo'yicha tuzat.

4. Skript `XATOLAR` siz tugamaguncha ishni tugadi dema.

## Skript nimani ko'rmaydi

- Erkin matndagi narxni faqat qisman tekshiradi: masalan, avtomat muhr narxi
  o'zgarsa-yu, botdagi "Avtomat — 160 000" qolib ketsa, 160 000 boshqa
  mahsulotning narxi bo'lgani uchun ushlanmasligi mumkin. Narx o'zgartirilganda
  eski summani `grep` bilan ham qidir (`/narx-ozgartir` shuni qiladi).
- Sayt ko'rinishini (dizayn, mobil ekran) tekshirmaydi.
