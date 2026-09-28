@echo off
rem KomikGen'i kaynak koddan baslatir. Ilk calistirmada gerekli dosyalari indirir.
cd /d "%~dp0"
set ELECTRON=node_modules\electron\dist\electron.exe

if exist "%ELECTRON%" goto run

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Lutfen https://nodejs.org adresinden kurun
  echo ya da GitHub "Releases" sayfasindaki hazir KomikGen.exe dosyasini kullanin.
  pause
  exit /b 1
)

echo Ilk calistirma: gerekli dosyalar indiriliyor, bu birkac dakika surebilir...
call npm install --no-audit --no-fund
if not exist "%ELECTRON%" call node node_modules\electron\install.js
if not exist "%ELECTRON%" powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\electron-onar.ps1"

if not exist "%ELECTRON%" (
  echo Electron kurulamadi. README.md dosyasindaki adimlara bakin.
  pause
  exit /b 1
)

:run
start "" "%ELECTRON%" .
