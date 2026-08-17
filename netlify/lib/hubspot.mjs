// HubSpot CRM integratsiyasi — har bir buyurtma uchun kontakt + bitim (deal) yaratadi.
// HUBSPOT_TOKEN — Netlify'ning Environment variables bo'limida saqlanadi,
// shuning uchun token kodda hech qachon ko'rinmaydi.
//
// Muhim: bu yordamchi HECH QACHON chaqiruvchiga xato tashlamaydi. HubSpot
// ishlamay qolsa yoki token o'rnatilmagan bo'lsa ham buyurtma oqimi buzilmaydi.

// Step 1'da tekshirilgan qiymatlar (default "Sales Pipeline" va uning birinchi bosqichi).
const PIPELINE = "default";
const DEALSTAGE = "appointmentscheduled";

export async function buyurtmaHubspotgaYoz({ ism, telefon, tur, izoh }) {
  // Tokenni o'qiymiz (Netlify yoki oddiy Node muhitida).
  const token =
    typeof Netlify !== "undefined" && Netlify.env
      ? Netlify.env.get("HUBSPOT_TOKEN")
      : process.env.HUBSPOT_TOKEN;

  // Token yo'q bo'lsa — hech narsa qilmaymiz, oqim buzilmasin.
  if (!token) return { skipped: true };

  // HubSpot API'ga so'rov yuboruvchi kichik yordamchi.
  // Xato bo'lsa loglaydi, lekin tashqariga xato tashlamaydi.
  const hsFetch = async (path, body, method = "POST") => {
    const res = await fetch(`https://api.hubapi.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      console.error(`[hubspot] ${path} xato`, res.status, data);
    }
    return { ok: res.ok, data };
  };

  try {
    let contactId = null;

    // 1) Telefon bo'yicha kontaktni topamiz yoki yaratamiz.
    if (telefon) {
      const qidir = await hsFetch("/crm/v3/objects/contacts/search", {
        filterGroups: [
          {
            filters: [
              { propertyName: "phone", operator: "EQ", value: telefon },
            ],
          },
        ],
        properties: ["phone"],
        limit: 1,
      });

      const topilgan = qidir.ok && qidir.data?.results?.[0];
      if (topilgan) {
        // Mavjud kontaktni qayta ishlatamiz.
        contactId = topilgan.id;
        // Yaxshiroq ism bo'lsa — yangilaymiz.
        if (ism) {
          await hsFetch(
            `/crm/v3/objects/contacts/${contactId}`,
            { properties: { firstname: ism } },
            "PATCH"
          );
        }
      } else {
        // Yangi kontakt yaratamiz.
        const yangi = await hsFetch("/crm/v3/objects/contacts", {
          properties: { firstname: ism || "Mijoz", phone: telefon },
        });
        if (yangi.ok && yangi.data?.id) contactId = yangi.data.id;
      }
    }

    // 2) Bitim (deal) yaratamiz.
    const tavsif = [
      `Tur: ${tur || "—"}`,
      `Matn/izoh: ${izoh || "—"}`,
      `Telefon: ${telefon || "—"}`,
      `Manba: muhr-sayt buyurtma`,
    ].join("\n");

    const bitim = await hsFetch("/crm/v3/objects/deals", {
      properties: {
        dealname: "Muhr/shtamp buyurtma — " + (tur || "buyurtma"),
        description: tavsif,
        pipeline: PIPELINE,
        dealstage: DEALSTAGE,
      },
    });

    const dealId = bitim.ok && bitim.data?.id ? bitim.data.id : null;

    // 3) Bitimni kontaktga bog'laymiz (ikkalasi ham bo'lsa).
    if (dealId && contactId) {
      const bog = await hsFetch(
        `/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`,
        null,
        "PUT"
      );
      if (bog.ok) {
        console.log(
          `[hubspot] deal ${dealId} kontakt ${contactId}ga bog'landi`
        );
      } else {
        console.error(
          `[hubspot] deal ${dealId} kontakt ${contactId}ga bog'lanmadi`
        );
      }
    }

    return { ok: true, contactId, dealId };
  } catch (e) {
    console.error("[hubspot] kutilmagan xato", e);
    return { ok: false };
  }
}
