@echo off
chcp 65001 >nul
title Villa Vick's - abrir no celular
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Node.js nao encontrado. Instale em https://nodejs.org e tente de novo.
  pause
  exit /b 1
)
echo Mostrando o QR code no navegador. Deixe esta janela aberta enquanto apresenta o site.
echo.
node scripts\serve-dist.mjs --celular
pause
