---
name: mahsulot-qosh
description: Yangi muhr, shtamp yoki rekvizit modelini rasmi, o'lchami va narxi bilan saytga, Telegram bot katalogiga va MCP serverga qo'shadi; mavjud mahsulot rasmini almashtirishda ham ishlaydi. Egasi "yangi model qo'sh", "katalogga qo'sh", "rasmini almashtir" desa ishlating.
argument-hint: "[mahsulot nomi]"
---

# Yangi mahsulot qo'shish

Egasining so'rovi: $ARGUMENTS

## 1. Ma'lumotni yig'

Yetishmaganini so'ra, o'ylab topma:

- **Tur:** muhr, shtamp yoki rekvizit
- **Mexanizm:** mexanik yoki avtomat
- **Korpus / model:** masalan "Colop Printer R40", "Ideal by Trodat 4924"
- **O'lcham:** masalan "40 mm dumaloq", "30×69 mm"
- **Narx.** Odatda toifa narxi bilan bir xil (`mcp-server/index.js` → `NARXLAR`).
  Boshqacha bo'lsa, ayt: hozir har bir toifada bitta narx bor, alohida narx
  qo'shilsa tekshiruv skriptini ham o'zgartirish kerak bo'ladi.
- **Rasm** — JPG fayl. Rasm bo'lmasa, mahsulotni rasmsiz qo'shma — avval rasm so'ra.

## 2. Rasmni joylashtir

- `public/` papkasiga qo'y. Nomlash mavjud fayllardagidek:
  `<tur>-<model>-aftomat.jpg` (avtomat) yoki `<tur>-mexanik.jpg` (mexanik).
  Kichik harf, probel o'rniga `-`. Tekshiruv skripti tur va mexanizmni fayl
  nomidan aniqlaydi (`muhr`/`shtamp`/`rekvizit`, `aftomat`), shuning uchun shu
  tartibga amal qil.
- Mavjud rasmlar taxminan 1080 px kenglikda. Fayl 400 KB dan katta bo'lsa,
  egasiga sayt sekin ochilishini ayt va kichraytirishni taklif qil.

## 3. To'rt joyga qo'sh

1. **`public/index.html`** — `#narxlar` ichidagi `.grid` ga yangi kartochka.
   Mavjud kartochkadan nusxa ol:
   ```html
   <div class="card">
     <img class="shot" src="FAYL.jpg" alt="…batafsil tavsif…" loading="lazy" width="1080" height="674">
     <span class="tag">Avtomat</span>
     <h3>Avtomatik muhr — Model</h3>
     <p>Korpus, o'lcham. 160 000 so'm.</p>
   </div>
   ```
   `width` va `height` ni o'ylab topma: avval tekshiruvni ishga tushir, u
   rasmning haqiqiy o'lchamini aytadi. `alt` — ko'rmaydigan odam uchun to'liq tavsif.
2. **`netlify/functions/telegram.mjs`**
   - `KATALOG` ga yangi yozuv. `kalit` 2 harfli va **takrorlanmas** bo'lsin
     (tugmalar `k_<kalit>` va `b_<kalit>` bilan ishlaydi).
   - `RASMLAR` ga `["FAYL.jpg", "Qisqa nom"]`. Ro'yxat 10 tadan oshmasin —
     Telegram ko'pini yubormaydi. Oshib ketsa, egasidan qaysi birini olib
     tashlashni so'ra.
3. **`mcp-server/index.js`** — `MAHSULOTLAR` ga `nomi`, `mexanizm`, `olcham`,
   `korpus`, `narx` (raqam, `160000`).
4. **Yangi tur bo'lsa** (masalan, birinchi marta "pechat-brelok"): saytdagi
   "Nima yasaymiz" bo'limi, buyurtma shaklidagi `<select id="tur">`,
   `telegram.mjs` dagi `JAVOB.mahsulot`, `mcp-server` dagi `dokon_malumot` →
   `TURLARI` va `chat.mjs` ko'rsatmasi.

## 4. Tekshir va ayt

```
node .claude/skills/tekshir/scripts/tekshir.mjs
```

`XATOLAR` bo'sh bo'lsin. Rasm haqidagi "ishlatilmagan" ogohlantirishi qolmasin.
So'ng egasiga ayt: qayerlarga qo'shildi, saytga chiqishi uchun `/chiqar` desin.
