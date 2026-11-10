@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Shtampchi Telegram agent

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
