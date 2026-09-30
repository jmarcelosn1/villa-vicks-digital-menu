@echo off
title Villa Vick's - site
cd /d "%~dp0"
node scripts\serve-dist.mjs --open
pause
