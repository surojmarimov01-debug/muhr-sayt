@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Shtampchi Telegram agent

rem ---- 1. Node.js bormi? Yo'q bo'lsa, winget bilan o'rnatishga urinamiz ----
where node >nul 2>nul
if not errorlevel 1 goto node_bor
echo.
echo Node.js topilmadi. Hozir o'rnatishga harakat qilaman...
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
echo.
echo Node.js o'rnatilgan bo'lsa, shu oynani yoping va boshla-telegram.cmd ni qayta oching.
echo O'rnatilmagan bo'lsa: nodejs.org saytidan LTS versiyasini yuklab o'rnating.
pause
exit /b 1
:node_bor

rem ---- 2. Anthropic API kaliti (kalit.txt) ----
if exist "kalit.txt" goto kalit_bor
echo.
echo Anthropic API kaliti kerak (sk-ant- bilan boshlanadi).
echo Uni console.anthropic.com saytida oling: API keys - Create key.
set "KALIT="
set /p "KALIT=Kalitni shu yerga joylang (Ctrl+V) va Enter bosing: "
if not defined KALIT goto kalit_bor
>kalit.txt echo %KALIT%
echo Saqlandi: kalit.txt
:kalit_bor

rem ---- 3. Telegram bot tokeni (telegram-token.txt) ----
if exist "telegram-token.txt" goto token_bor
echo.
echo Telegram bot tokeni kerak. Uni @BotFather beradi, 123456789:AA... ko'rinishida.
set "TOKEN="
set /p "TOKEN=Tokenni shu yerga joylang (Ctrl+V) va Enter bosing: "
if not defined TOKEN goto token_bor
>telegram-token.txt echo %TOKEN%
echo Saqlandi: telegram-token.txt
:token_bor

rem ---- 4. Kutubxonalar va ishga tushirish ----
echo.
echo Kerakli kutubxonalar tekshirilmoqda...
call npm install --no-fund --no-audit --loglevel=error
if errorlevel 1 (
    echo.
    echo Ornatish muvaffaqiyatsiz tugadi.
    echo Node.js ornatilganini va internet borligini tekshiring.
    pause
    exit /b 1
)

:qayta
node telegram-agent.mjs
if errorlevel 2 (
    echo.
    echo Sozlamani tuzating, keyin shu faylni qayta oching.
    pause
    exit /b 1
)
echo.
echo Agent to'xtadi. 10 soniyadan keyin qayta ishga tushadi (yopish uchun oynani yoping).
timeout /t 10 >nul
goto qayta
