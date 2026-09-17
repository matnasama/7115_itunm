@echo off
cd /d "%~dp0frontend"
if not exist "node_modules\vite\bin\vite.js" (
  echo Faltan las dependencias del frontend. Ejecuta npm install en frontend.
  exit /b 1
)
call npm run dev
