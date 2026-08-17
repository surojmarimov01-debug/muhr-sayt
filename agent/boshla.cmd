@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules" (
    echo Birinchi ishga tushirish: kerakli kutubxonalar ornatilmoqda...
    echo Bu bir necha daqiqa olishi mumkin.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo Ornatish muvaffaqiyatsiz tugadi.
        echo Node.js ornatilganini tekshiring: nodejs.org
        pause
        exit /b 1
    )
)

if exist "kalit.txt" (
    set /p ANTHROPIC_API_KEY=<kalit.txt
)

node shtampchi.mjs
pause
