// Google Sheets CRM — mijoz raqam qoldirganda jadvalga yangi qator qo'shadi.
//
// Jadval tomonida google-sheets/Code.gs (Apps Script Web App) turadi.
// Netlify Environment variables:
//   SHEETS_WEBHOOK_URL — Apps Script "Web app" deploy manzili
//   SHEETS_SECRET      — Apps Script'dagi SECRET bilan bir xil parol
//
// Muhim: bu yordamchi HECH QACHON xato tashlamaydi va 5 soniyadan ko'p
// kutmaydi — jadval ishlamay qolsa ham bot va sayt oqimi buzilmaydi.

const env = (k) =>
  typeof Netlify !== "undefined" && Netlify.env ? Netlify.env.get(k) : process.env[k];

export async function mijozniJadvalgaYoz({ ism, telefon, tur, izoh, manba, telegram }) {
  const url = env("SHEETS_WEBHOOK_URL");
  const secret = env("SHEETS_SECRET");
  if (!url || !secret) return { skipped: true };

  const ctrl = new AbortController();
  const soat = setTimeout(() => ctrl.abort(), 5000);
  try {
    // Apps Script POST'ni bajarib, natijani 302 orqali beradi —
    // fetch redirect'ni o'zi kuzatadi.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, ism, telefon, tur, izoh, manba, telegram }),
      redirect: "follow",
      signal: ctrl.signal,
    });
    let out = null;
    try {
      out = await res.json();
    } catch {
      out = null;
    }
    if (!res.ok || !out || !out.ok) {
      console.error("[sheets] yozilmadi", res.status, out);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[sheets] so'rov muvaffaqiyatsiz", e);
    return { ok: false };
  } finally {
    clearTimeout(soat);
  }
}

// Erkin matndan O'zbekiston telefon raqamini topadi.
// "+998 90 123 45 67", "998901234567", "90-123-45-67", "(90) 1234567" va h.k.
// Topilsa "+998XXXXXXXXX" ko'rinishida qaytaradi, bo'lmasa null.
export function raqamTop(matn) {
  const m = /(?:\+?\s*998[\s\-().]*)?\(?\d{2}\)?[\s\-.]*\d{3}[\s\-.]*\d{2}[\s\-.]*\d{2}/.exec(
    String(matn || "")
  );
  if (!m) return null;
  const r = m[0].replace(/\D/g, "");
  if (r.length === 9) return "+998" + r;
  if (r.length === 12 && r.startsWith("998")) return "+" + r;
  return null;
}
