#!/usr/bin/env bash
# Honcho MCP serverini Claude Code'ga ulash skripti.
#
# Ishlatish:
#   HONCHO_API_KEY=hch-xxxx ./scripts/honcho-mcp-setup.sh
# yoki .env faylga kalitni yozib:
#   ./scripts/honcho-mcp-setup.sh

set -euo pipefail

MCP_URL="https://mcp.honcho.dev"
SERVER_NAME="honcho"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1) .env fayldan kalitni o'qish (agar muhitda bo'lmasa)
if [[ -z "${HONCHO_API_KEY:-}" && -f "$REPO_ROOT/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$REPO_ROOT/.env"; set +a
fi

# 2) Kalit bormi?
if [[ -z "${HONCHO_API_KEY:-}" ]]; then
  echo "XATO: HONCHO_API_KEY topilmadi." >&2
  echo "  1. https://app.honcho.dev saytidan kalit oling (hch- bilan boshlanadi)." >&2
  echo "  2. cp .env.example .env  va kalitni .env ichiga yozing." >&2
  echo "  3. Shu skriptni qayta ishga tushiring." >&2
  exit 1
fi

# 3) Kalit formatini tekshirish
if [[ "$HONCHO_API_KEY" != hch-* ]]; then
  echo "XATO: kalit 'hch-' bilan boshlanishi kerak. Hozirgi qiymat noto'g'ri ko'rinadi." >&2
  exit 1
fi

# 4) claude CLI bormi?
if ! command -v claude >/dev/null 2>&1; then
  echo "XATO: 'claude' buyrug'i topilmadi. Avval Claude Code CLI o'rnating:" >&2
  echo "  npm install -g @anthropic-ai/claude-code" >&2
  exit 1
fi

# 5) Server allaqachon ulanganmi? Ulangan bo'lsa — o'chirib, qaytadan qo'shamiz.
if claude mcp list 2>/dev/null | grep -q "^${SERVER_NAME}\b"; then
  echo "'${SERVER_NAME}' allaqachon mavjud — yangilanmoqda..."
  claude mcp remove "$SERVER_NAME" >/dev/null 2>&1 || true
fi

# 6) Ulash
claude mcp add "$SERVER_NAME" \
  --transport http \
  --url "$MCP_URL" \
  --header "Authorization: Bearer ${HONCHO_API_KEY}"

echo
echo "TAYYOR. Honcho MCP ulandi."
echo "Tekshirish uchun Claude Code'ni qayta ishga tushiring va so'rang:"
echo "  \"What do you know about me?\""
