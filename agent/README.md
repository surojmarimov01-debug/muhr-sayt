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
  "model": ""
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
