# Claude Chat — VS Code kengaytmasi

Anthropic Claude API'ni to'g'ridan-to'g'ri VS Code ichiga ulaydi: yon panelda chat, kodni tushuntirish, jonli (streaming) javob.

## Talablar
- VS Code 1.85+
- Node.js 18+
- Anthropic API kaliti — https://console.anthropic.com (pullik, ishlatilganicha)

## O'rnatish (dev rejimi)
```
cd claude-vscode-extension
npm install
npm run compile
```
So'ng papkani VS Code'da ochib F5 bosing — "Extension Development Host" oynasi ochiladi.

## API kalitni kiritish
Command Palette (Ctrl+Shift+P) -> "Claude: Set API Key" -> kalitni joylashtiring.

## Foydalanish
- Chap paneldagi Claude Chat belgisi -> savol yozing (Ctrl+Enter yuboradi).
- "Claude: Explain Selection" — tanlangan kodni tushuntiradi.
- "Claude: New Chat" — suhbatni tozalaydi.

## Modelni o'zgartirish
Settings -> claude.model. Modellar: https://docs.anthropic.com/en/docs/about-claude/models

## VSIX qilib o'rnatish
```
npm i -g @vscode/vsce
vsce package
```
So'ng Extensions -> "..." -> Install from VSIX.
