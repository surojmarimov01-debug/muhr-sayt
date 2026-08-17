# Honcho MCP serverini Claude Code'ga ulash skripti (Windows / PowerShell).
#
# Ishlatish:
#   .\scripts\honcho-mcp-setup.ps1 -ApiKey hch-sizning-kalitingiz
#
# Yoki kalitni .env fayliga yozib, parametrsiz:
#   .\scripts\honcho-mcp-setup.ps1
#
# Agar "running scripts is disabled" xatosi chiqsa, avval shuni bajaring:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

param(
    [string]$ApiKey = $env:HONCHO_API_KEY
)

$ErrorActionPreference = 'Stop'

$McpUrl     = 'https://mcp.honcho.dev'
$ServerName = 'honcho'
$RepoRoot   = Split-Path -Parent $PSScriptRoot
$EnvFile    = Join-Path $RepoRoot '.env'

# 1) .env fayldan kalitni o'qish (agar parametr ham, muhit o'zgaruvchisi ham bo'sh bo'lsa)
if (-not $ApiKey -and (Test-Path $EnvFile)) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*HONCHO_API_KEY\s*=\s*(.+?)\s*$') {
            $ApiKey = $Matches[1].Trim("'", '"')
        }
    }
}

# 2) Kalit bormi?
if (-not $ApiKey) {
    Write-Host "XATO: HONCHO_API_KEY topilmadi." -ForegroundColor Red
    Write-Host "  1. https://app.honcho.dev saytidan kalit oling (hch- bilan boshlanadi)."
    Write-Host "  2. Skriptni kalit bilan ishga tushiring:"
    Write-Host "     .\scripts\honcho-mcp-setup.ps1 -ApiKey hch-sizning-kalitingiz"
    Write-Host "  Yoki .env fayliga yozing:  HONCHO_API_KEY=hch-..."
    exit 1
}

# 3) Kalit formatini tekshirish
if (-not $ApiKey.StartsWith('hch-')) {
    Write-Host "XATO: kalit 'hch-' bilan boshlanishi kerak. Hozirgi qiymat noto'g'ri ko'rinadi." -ForegroundColor Red
    exit 1
}

# 4) claude CLI bormi?
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "XATO: 'claude' buyrug'i topilmadi. Avval Claude Code CLI o'rnating:" -ForegroundColor Red
    Write-Host "  npm install -g @anthropic-ai/claude-code"
    exit 1
}

# 5) Server allaqachon ulanganmi? Ulangan bo'lsa - o'chirib, qaytadan qo'shamiz.
$existing = & claude mcp list 2>$null
if ($LASTEXITCODE -eq 0 -and $existing -match "(?m)^$ServerName\b") {
    Write-Host "'$ServerName' allaqachon mavjud - yangilanmoqda..."
    & claude mcp remove $ServerName --scope user 2>$null | Out-Null
}

# 6) Ulash
& claude mcp add $ServerName `
    --scope user `
    --transport http `
    --url $McpUrl `
    --header "Authorization: Bearer $ApiKey"

if ($LASTEXITCODE -ne 0) {
    Write-Host "XATO: ulanmadi. Yuqoridagi xabarni tekshiring." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "TAYYOR. Honcho MCP ulandi." -ForegroundColor Green
Write-Host "Tekshirish uchun Claude Code'ni qayta ishga tushiring va so'rang:"
Write-Host '  "What do you know about me?"'
