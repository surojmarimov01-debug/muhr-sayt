# Shtampchi agent

Kompyuteringizda ishlaydigan yordamchi. Terminalga o'zbekcha oddiy gap bilan
buyruq yozasiz — u o'zi qanday bajarishni hal qiladi, bajaradi va natijani
aytadi.

Nima qila oladi:

- **Fayllar bilan ishlash** — papkalarni ko'rish, fayl o'qish, yozish,
  tahrirlash, qidirish, tartibga solish
- **Sayt va kod ustida ishlash** — `muhr-sayt` loyihasini tahrirlash, xatoni
  topish va tuzatish
- **Hujjat tayyorlash** — Word, Excel, PDF fayllar yaratish
- **Internetdan qidirish** — narx, ma'lumot, hujjat topish

Ikki xil ishlatish mumkin:

| Qanday | Qaysi fayl | Qachon qulay |
|---|---|---|
| **Terminalda** — kompyuter oldida yozasiz | `boshla.cmd` | Kompyuter yoningizda bo'lsa |
| **Telegramda** — telefondan yozasiz, javob Telegramga keladi | `boshla-telegram.cmd` | Uydan, yo'ldan, istalgan joydan — [9-bo'lim](#9-telegram-orqali-boshqarish) |

---

## 1. Nima kerak

**Node.js** — dastur shu ustida ishlaydi.
[nodejs.org](https://nodejs.org) ga kiring, katta yashil tugmadagi **LTS**
versiyasini yuklab oling va o'rnating. O'rnatishda hech narsani
o'zgartirmang, faqat "Next" bosaverning.

Tekshirish: **Windows tugmasi** → `cmd` deb yozing → Enter. Ochilgan qora
oynaga yozing:

```
node --version
```

`v20.x.x` kabi raqam chiqsa, tayyor.

**Anthropic API kaliti** — agent Claude bilan gaplashishi uchun.
[console.anthropic.com](https://console.anthropic.com) → **API keys** →
**Create key** → kalitni **nusxa ko'chiring** (`sk-ant-` bilan boshlanadi).

> Bu saytdagi `ANTHROPIC_API_KEY` bilan bir xil kalit — o'shanisini
> ishlatsangiz ham bo'ladi.

---

## 2. O'rnatish

Loyihani kompyuteringizga tushiring (agar hali tushirmagan bo'lsangiz):

```
git clone https://github.com/surojmarimov01-debug/muhr-sayt.git
```

Yoki GitHub sahifasidan **Code → Download ZIP** qilib, ochib qo'ying.

Keyin `agent` papkasini oching va ichida **`kalit.txt`** nomli oddiy matn
fayli yarating. Ichiga faqat API kalitingizni yozing, boshqa hech narsa
yozmang:

```
sk-ant-api03-...
```

Shu xolos. Bu fayl git'ga tushmaydi — `.gitignore` da yozib qo'yilgan.

---

## 3. Ishga tushirish

`agent` papkasidagi **`boshla.cmd`** faylini ikki marta bosing.

Birinchi safar kerakli kutubxonalar o'rnatiladi (bir necha daqiqa ketadi,
bir marta bo'ladi). Keyin oyna ochiladi:

```
  Shtampchi agent
  Ish papkasi: C:\...\muhr-sayt

  Buyruqni oddiy gap bilan yozing.

Siz >
```

Endi yozavering.

---

## 4. Misollar

```
Siz > public papkasidagi rasmlarning hajmini ko'rsat

Siz > saytdagi narxlar bo'limini o'qib, Excel jadval qilib chiqar

Siz > netlify/functions ichida "TELEGRAM" so'zi qayerda ishlatilgan?

Siz > shu oyning buyurtmalari uchun hisobot shabloni tayyorla, Word fayl bo'lsin

Siz > chat.mjs faylini o'qib, nima qilishini oddiy tilda tushuntir
```

Ikkita maxsus buyruq bor:

- `yangi` — suhbatni noldan boshlaydi (agent avvalgi gaplarni unutadi)
- `chiqish` — dasturdan chiqadi

---

## 5. Xavfsizlik — bu qism muhim

Agent kompyuteringizda haqiqiy fayllar bilan ishlaydi. Shuning uchun ikkita
chegara qo'yilgan:

**Birinchisi — papka chegarasi.** Agent faqat `sozlama.json` da ko'rsatilgan
papkada ishlay oladi. Sukut bo'yicha bu `muhr-sayt` loyihasi. Boshqa
papkalarga kira olmaydi.

**Ikkinchisi — ruxsat so'rash.** Fayl o'zgartirish yoki terminal buyrug'i
kerak bo'lsa, agent to'xtaydi va sizdan so'raydi:

```
  ⚠ Agent quyidagini bajarmoqchi (Bash):
    npm install exceljs
  Ruxsat? (ha / yo'q / doim):
```

- `ha` — shu safar ruxsat
- `yo'q` — rad etish, agent boshqa yo'l qidiradi
- `doim` — shu turdagi ishga bu seansda boshqa so'ramaydi

Fayl **o'qish** va **qidirish** uchun so'ramaydi — ular hech narsani buzmaydi.

Bir narsani bilib qo'ying: terminal buyrug'ini rad etsangiz, agent to'xtab
qolmaydi — o'sha natijaga o'qish asboblari orqali erishishga urinadi. Bu
ataylab shunday: rad etish "hech narsa qilma" emas, "buni bu yo'l bilan
qilma" degani. Agar umuman to'xtashini istasangiz, shunchaki ayting.

> **Maslahat:** `doim` ni faqat nima qilayotganini tushunganingizda bosing.
> Ayniqsa `Bash` uchun — u terminal buyrug'i, ya'ni kompyuterda deyarli
> hamma narsani qila oladi.

---

## 6. Sozlash

`sozlama.json` faylini oddiy matn muharririda ochib o'zgartiring:

```json
{
  "ishPapkasi": "..",
  "qoshimchaPapkalar": [],
  "soramasdanBajarsin": [],
  "model": "",
  "kotib": true,
  "kotibModel": "claude-opus-5-5",
  "kotibKunlikLimit": 30,
  "kotibKunlikJami": 300,
  "toxtatilganlar": []
}
```

| Nima | Ma'nosi |
|---|---|
| `ishPapkasi` | Agent qaysi papkada ishlaydi. `".."` — `muhr-sayt` loyihasi. Boshqa papka uchun to'liq yo'l yozing, masalan `"C:\\Users\\Suroj\\Hujjatlar"` |
| `qoshimchaPapkalar` | Qo'shimcha ruxsat berilgan papkalar ro'yxati |
| `soramasdanBajarsin` | Har safar so'ramasdan bajariladigan asboblar, masalan `["Write", "Edit"]`. Bo'sh qoldirish xavfsizroq |
| `model` | Bo'sh qoldiring — sukut model ishlatiladi |

> Windows yo'llarida **ikkita** teskari chiziq yozish kerak: `C:\\Users\\...`
> — bu JSON formatining talabi.

---

## 7. Xarajat

Har bir buyruq sizning Anthropic hisobingizdan pul yeydi. Har javob oxirida
taxminiy narx ko'rsatiladi:

```
  (4 qadam, taxminan $0.0231)
```

Oddiy savollar bir necha sentga tushadi. Katta ishlar (ko'p fayl o'qish,
uzoq tahlil) qimmatroq. Sarfni console.anthropic.com dagi **Usage**
bo'limidan kuzatib boring.

---

## 8. Muammolar

**"ANTHROPIC_API_KEY o'rnatilmagan"**
`kalit.txt` fayli `agent` papkasida yo'q yoki bo'sh. Faylni yarating va
ichiga kalitni yozing. Fayl nomi aynan `kalit.txt` bo'lsin — Windows
kengaytmalarni yashirishi mumkin, shuning uchun `kalit.txt.txt` bo'lib
qolmasin.

**"node" tanilmadi / 'node' is not recognized**
Node.js o'rnatilmagan yoki o'rnatilgandan keyin kompyuter qayta
ishga tushirilmagan. Node.js'ni o'rnating va kompyuterni qayta yoqing.

**O'zbekcha harflar buzuq ko'rinyapti**
`boshla.cmd` orqali ishga tushiring — u kodlashni to'g'rilab qo'yadi.
To'g'ridan-to'g'ri `node shtampchi.mjs` deb ishga tushirsangiz shunday
bo'lishi mumkin.

**Word/Excel fayl yarata olmayapti**
Bunday fayllar uchun ba'zan Python kerak bo'ladi. Agent buni o'zi aytadi va
nima o'rnatish kerakligini tushuntiradi. [python.org](https://python.org) dan
o'rnatib, o'rnatish oynasida **"Add Python to PATH"** katagiga belgi qo'ying.

**Agent papkaga kira olmayapti**
`sozlama.json` dagi `ishPapkasi` ni tekshiring yoki kerakli papkani
`qoshimchaPapkalar` ro'yxatiga qo'shing.

---

## 9. Telegram orqali boshqarish

Kompyuter uyda yoki do'konda yoqilgan turadi, siz esa telefoningizdan
Telegram botga yozasiz. Agent kompyuterda bajaradi va javobni Telegramga
yozadi. Tayyor faylni (Excel, Word, PDF, rasm) ham Telegramga yuboradi.

```
Siz:   Ish stolidagi Excel fayllarni sanab ber
Agent: ⏳ Ishga tushdim…
Agent: ✅ Tayyor
       Ish stolida 3 ta Excel fayl bor: narxlar.xlsx, oktyabr.xlsx, mijozlar.xlsx
```

### 9.1. Yangi bot yarating

Bu agent uchun **alohida yangi bot** kerak. Do'konning mijozlar bilan
gaplashadigan botini ishlatmang — ikkalasi bir tokendan ishlay olmaydi.

1. Telegramda **@BotFather** ni oching va `/newbot` deb yozing.
2. Botga nom bering (masalan, `Mening yordamchim`) va manzil bering — oxiri
   `bot` bilan tugashi kerak (masalan, `suroj_yordamchi_bot`).
3. BotFather uzun token beradi (`123456789:AAH...` ko'rinishida). Uni nusxa oling.
4. `agent` papkasida **`telegram-token.txt`** nomli fayl yarating va ichiga
   faqat shu tokenni yozing.

`kalit.txt` (Anthropic API kaliti) ham kerak — 2-bo'limdagidek.
Ikkala fayl ham git'ga tushmaydi.

### 9.2. Ishga tushiring va ulaning

1. `agent` papkasidagi **`boshla-telegram.cmd`** ni ikki marta bosing.
2. Birinchi safar oynada **6 xonali kod** chiqadi:

   ```
     Bot hali hech kimga ulanmagan.
     Telegramda @suroj_yordamchi_bot ni oching va shu kodni yuboring:

           482913
   ```

3. Telegramda botingizni oching, **Start** bosing va shu kodni yuboring.
4. "✅ Ulandingiz!" degan javob keladi. Tayyor — endi yozavering.

Kod bir martalik. Ulangandan keyin kompyuterni **faqat siz** boshqarasiz.
Boshqa odam yozsa, unga AI kotib javob beradi (9.6) — kotib kompyuterga
tegolmaydi. Sizning Telegram raqamingiz (ID) `telegram-sozlama.json`
fayliga yoziladi.

### 9.3. Ruxsat tugmalari

Fayl o'zgartirish, dastur ishga tushirish yoki saytga murojaat qilishdan
oldin agent Telegramga tugma yuboradi:

```
⚠ Agent ruxsat so'rayapti (Bash):

del C:\Users\Suroj\Desktop\eski-hisobot.xlsx

[ ✅ Ha ]  [ ❌ Yo'q ]
[ ♾ Doim ruxsat (Bash) ]
```

- **Ha** — shu safar bajarsin.
- **Yo'q** — bajarmasin. Agent boshqa yo'l qidiradi yoki nima qilish
  mumkinligini aytadi.
- **Doim** — shu turdagi ishni (masalan, barcha `Bash` buyruqlarini) shu
  suhbatda boshqa so'ramaydi. `/yangi` deb yozsangiz, bu ruxsat o'chadi.

10 daqiqa ichida javob bermasangiz, so'rov rad etilgan hisoblanadi.
Fayl o'qish va qidirish so'ralmaydi — ular hech narsani o'zgartirmaydi.

### 9.4. Buyruqlar

| Buyruq | Nima qiladi |
|---|---|
| `/yangi` | Suhbatni noldan boshlaydi (agent avvalgi gaplarni unutadi) |
| `/toxtat` | Bajarilayotgan ishni to'xtatadi |
| `/holat` | Agent bandmi yoki bo'shmi, qaysi papkada ishlayapti |
| `/yordam` | Qisqa yo'riqnoma |

Bir vaqtda bitta ish bajariladi. Agent band paytida yozsangiz, "oldingi ish
bajarilyapti" deydi.

### 9.5. Fayl yuborish va olish

- **Siz yuborgan fayl yoki rasm** kompyuterdagi
  `Downloads\Telegram-agent` papkasiga saqlanadi. Fayl ostiga nima qilishni
  yozing, masalan: "buni Excel jadval qil". Telegram botlarga 20 MB gacha
  fayl beradi.
- **Agent tayyorlagan fayl** Telegramga hujjat bo'lib keladi (50 MB gacha).
- Ovozli xabarni hozircha tushunmaydi — yozib yuboring.

### 9.6. AI kotib — boshqalarga siz nomingizdan javob beradi

Botga sizdan boshqa odam yozsa, **AI kotib** siz nomingizdan javob beradi.
Kotib faqat gaplashadi: **kompyuteringizga, fayllarga, buyruqlarga yo'li
yo'q**. Kompyuterni faqat siz boshqarasiz.

Har bir suhbat sizga ham keladi:

```
💬 Ali Valiyev (@ali) · ID 123456789
yozdi:

Assalomu alaykum, mexanik muhr qancha turadi?

🤖 Kotib javobi:
Assalomu alaykum! Mexanik muhr 70 000 so'm, 15 daqiqada tayyor bo'ladi.

↩ Javob yozish uchun shu xabarga reply qiling.
[ ⏸ AI javob bermasin ]
```

- **O'zingiz javob berish** — shu xabarni bosib turing → **Reply**
  (Ответить) → yozing. Javobingiz o'sha odamga boradi, agentga emas.
- **⏸ AI javob bermasin** — shu odamga AI endi javob bermaydi, uning
  xabarlari faqat sizga keladi. **▶** bilan qayta yoqiladi.
- Begona yuborgan rasm yoki fayl kompyuterga **yuklanmaydi** — sizga uzatiladi.
- Bot faqat **unga avval yozgan** odamlarga javob bera oladi — Telegram
  qoidasi. Telefon raqam bo'yicha birinchi bo'lib yozolmaydi.

**Kotibga nima deyishni o'rgating.** Telegramda yozing:

```
/kotib_matn Ismim Suroj. Muhr va shtamp tayyorlayman, Urganchda.
Mexanik muhr 70 000 so'm, avtomat 160 000 so'm. 15 daqiqada tayyor.
Uchrashuv va chegirma haqida o'zim javob beraman.
```

Ko'rsatma `agent\kotib.txt` faylida saqlanadi — uni Bloknot bilan ham
tahrirlash mumkin. Ko'rsatmada yo'q narsani (narx, sana, chegirma, va'da)
kotib o'ylab topmaydi — "egamga yetkazaman" deydi. So'rashsa, AI ekanini
yashirmaydi.

| Buyruq | Nima qiladi |
|---|---|
| `/kotib` | Kotib yoqilganmi, ko'rsatmasi qanday |
| `/kotib_matn ...` | Ko'rsatmani almashtiradi |
| `/kotib_ochir` | Kotibni o'chiradi — begonalarga "bu shaxsiy yordamchi" deyiladi |
| `/kotib_yoq` | Kotibni qayta yoqadi |

**Xarajat.** Har bir kotib javobi Anthropic hisobingizdan to'lanadi
(odatda bir sentdan ham kam). Ortiqcha sarf bo'lmasligi uchun bir odamga
kuniga 30 ta, hammaga birgalikda kuniga 300 ta javob chegarasi bor
(`telegram-sozlama.json` da o'zgartiriladi). Chegaradan keyin xabarlar
faqat sizga keladi.

### 9.7. Sozlash — `telegram-sozlama.json`

Dastur birinchi ishga tushganda bu faylni o'zi yaratadi:

```json
{
  "ishPapkasi": "~",
  "qoshimchaPapkalar": [],
  "qabulPapkasi": "~/Downloads/Telegram-agent",
  "egalar": [123456789],
  "soramasdanBajarsin": [],
  "model": "",
  "kotib": true,
  "kotibModel": "claude-opus-5-5",
  "kotibKunlikLimit": 30,
  "kotibKunlikJami": 300,
  "toxtatilganlar": []
}
```

| Nima | Ma'nosi |
|---|---|
| `ishPapkasi` | Agent qaysi papkada ishlaydi. `~` — sizning papkangiz (`C:\Users\Ism`): Ish stoli, Hujjatlar, Yuklanmalar hammasi shu ichida |
| `qoshimchaPapkalar` | Boshqa disklar yoki papkalar, masalan `["D:\\Hisobotlar"]` |
| `qabulPapkasi` | Telegramdan kelgan fayllar shu yerga saqlanadi |
| `egalar` | Botni boshqara oladigan Telegram ID'lar. Bo'shatib qo'ysangiz, keyingi ishga tushishda yangi kod chiqadi |
| `soramasdanBajarsin` | So'ramasdan bajariladigan asboblar, masalan `["Write", "Edit"]`. Bo'sh qoldirish xavfsizroq |
| `model` | Bo'sh qoldiring |
| `kotib` | `true` — begonalarga AI kotib javob beradi, `false` — yo'q |
| `kotibModel` | Kotib qaysi Claude modeli bilan ishlaydi. Arzonroq bo'lishi uchun `claude-haiku-5-5` yozish mumkin |
| `kotibKunlikLimit`, `kotibKunlikJami` | Bir odamga va hammaga birgalikda kuniga nechta AI javob |
| `toxtatilganlar` | ⏸ bosilgan odamlar (ID) — ularga AI javob bermaydi |

O'zgartirgandan keyin oynani yopib, `boshla-telegram.cmd` ni qayta oching.

### 9.8. Kompyuter yonganda o'zi ishga tushsin

1. **Win + R** bosing, `shell:startup` deb yozing, Enter.
2. Ochilgan papkaga `boshla-telegram.cmd` ning **yorlig'ini** (shortcut) qo'ying:
   faylni sichqonchaning o'ng tugmasi bilan shu papkaga sudrab olib boring →
   "Create shortcuts here".

Endi kompyuter yoqilganda agent o'zi ishga tushadi. Oynani yopmang —
yopilsa agent to'xtaydi. Agent xato bilan to'xtab qolsa, `boshla-telegram.cmd`
uni 10 soniyadan keyin o'zi qayta ishga tushiradi.

Kompyuter uyquga ketsa, agent ham uxlaydi. Doim ishlashi kerak bo'lsa:
**Sozlamalar → Tizim → Quvvat → Uyqu → Hech qachon**.

### 9.9. Xavfsizlik

- Telegram akkauntingiz kimning qo'lida bo'lsa, kompyuteringiz ham o'shaning
  qo'lida. Telegramda **ikki bosqichli tekshiruvni** (Sozlamalar → Maxfiylik →
  Ikki bosqichli tekshiruv) albatta yoqing.
- Bot tokenini hech kimga bermang. Tarqalib ketsa, @BotFather da `/revoke`
  qiling va yangisini `telegram-token.txt` ga yozing.
- Agent `kalit.txt` va `telegram-token.txt` ni o'qimaydi va hech kimga
  yubormaydi.
- `Doim` tugmasini, ayniqsa `Bash` uchun, faqat nima bo'layotganini
  tushunganingizda bosing.
- Begonalar bilan faqat AI kotib gaplashadi — u kompyuterga tegolmaydi.
  Kompyuterni faqat 9.2 da ulangan odam (siz) boshqaradi.

### 9.10. Muammolar

**"Bu bot boshqa joyda ham ishlayapti"**
Do'kon botining tokenini qo'ygansiz yoki `boshla-telegram.cmd` ikki marta
ochilgan. Agent uchun alohida bot yarating (9.1) yoki ortiqcha oynani yoping.

**"Telegram bot tokeni topilmadi" / "Token noto'g'ri"**
`telegram-token.txt` fayli `agent` papkasida turganini, nomi aniq shunday
ekanini (`telegram-token.txt.txt` emas) va ichida faqat token borligini
tekshiring.

**Bot javob bermayapti**
Kompyuter yoqilganmi, `boshla-telegram.cmd` oynasi ochiqmi, internet bormi —
shuni tekshiring. Oynada nima yozilganiga qarang.
