@echo off
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
  echo Falta backend\.venv. Segui las instrucciones de instalacion del README.
  exit /b 1
)
".venv\Scripts\python.exe" -m uvicorn main:app --reload
