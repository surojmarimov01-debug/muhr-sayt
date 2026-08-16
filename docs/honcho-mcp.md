# Honcho MCP — ulanish qo'llanmasi

Honcho — AI assistentga **doimiy xotira** beradigan MCP server. Bir marta ulasangiz,
assistent sizning odatlaringiz va afzalliklaringizni suhbatdan suhbatga eslab qoladi.

Server manzili hamma dasturlarda bitta: `https://mcp.honcho.dev`

---

## 1-qadam — API kalit olish (buni siz qilasiz)

1. https://app.honcho.dev saytiga kiring va ro'yxatdan o'ting.
2. **API Keys** bo'limidan yangi kalit yarating.
3. Kalitni nusxa oling — `hch-` bilan boshlanadi.

> Kalitni hech qachon git'ga commit qilmang. Shu repoda `.env` fayli `.gitignore` ichida.

## 2-qadam — Kalitni `.env` fayliga yozish

```bash
cp .env.example .env
```

So'ng `.env` faylni oching va kalitni qo'ying:

```
HONCHO_API_KEY=hch-sizning-haqiqiy-kalitingiz
```

## 3-qadam — Ulash

### Claude Code (tavsiya etiladi)

```bash
./scripts/honcho-mcp-setup.sh
```

Skript kalitni `.env` dan oladi, tekshiradi va serverni ulaydi.

Qo'lda qilmoqchi bo'lsangiz:

```bash
claude mcp add honcho \
  --transport http \
  --url "https://mcp.honcho.dev" \
  --header "Authorization: Bearer hch-sizning-kalitingiz"
```

### VS Code (Copilot Chat)

Hech narsa yozish shart emas — repoda `.vscode/mcp.json` tayyor.
VS Code birinchi ishga tushirganda kalitni **o'zi so'raydi** va xavfsiz saqlaydi.

### Cursor

Repoda `.cursor/mcp.json` tayyor. `HONCHO_API_KEY` muhit o'zgaruvchisi
o'rnatilgan bo'lishi kerak:

```bash
export HONCHO_API_KEY=hch-sizning-kalitingiz
```

### Claude Desktop

Config faylni qo'lda tahrirlash kerak:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "honcho": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.honcho.dev",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer hch-sizning-kalitingiz"
      }
    }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "honcho": {
      "serverUrl": "https://mcp.honcho.dev",
      "headers": { "Authorization": "Bearer hch-sizning-kalitingiz" }
    }
  }
}
```

### Zed

`~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "honcho": {
      "url": "https://mcp.honcho.dev",
      "headers": { "Authorization": "Bearer hch-sizning-kalitingiz" }
    }
  }
}
```

### Goose

`goose configure` buyrug'i yoki `~/.config/goose/config.yaml`:

```yaml
extensions:
  honcho:
    enabled: true
    type: streamable_http
    name: honcho
    description: Honcho persistent memory & personalization
    uri: https://mcp.honcho.dev
    headers:
      Authorization: "Bearer hch-sizning-kalitingiz"
    timeout: 60
```

## 4-qadam — Dasturni to'liq qayta ishga tushiring

Oynani yopish yetarli emas. Dasturni **butunlay yopib, qaytadan oching** —
aks holda yangi asboblar ro'yxatga tushmaydi.

## 5-qadam — Tekshirish

Assistentdan so'rang:

> What do you know about me?

Birinchi marta "ma'lumot yo'q" desa — bu normal. Bir necha suhbatdan keyin
Honcho sizning uslubingizni o'rgana boshlaydi.

---

## Workspace (ixtiyoriy)

- Mavjudlarini ko'rish: `list_workspaces`
- Yangi yaratish: `create_workspace`
- Ulanishda `X-Honcho-Workspace-ID` sarlavhasini berish yoki har bir asbobga
  `workspace_id` parametrini uzatish mumkin.

## Xatolar va yechimlar

| Muammo | Yechim |
| --- | --- |
| Asboblar ko'rinmayapti | Dasturni to'liq yopib, qaytadan oching |
| Authorization xatosi | Kalit `hch-` bilan boshlanishini va `Bearer ` so'zi borligini tekshiring |
| `npx not found` | Node.js o'rnating — https://nodejs.org |
| "No insights found" | Normal — Honcho hali sizni o'rganmagan, ko'proq suhbatlashing |
| Timeout | Internet yoki firewall `mcp.honcho.dev` ni to'sayotgan bo'lishi mumkin |

Yordam: [Discord](https://discord.gg/honcho) · [GitHub](https://github.com/plastic-labs/honcho/tree/main/mcp)

Rasmiy hujjat: https://honcho.dev/docs/v3/guides/integrations/mcp
