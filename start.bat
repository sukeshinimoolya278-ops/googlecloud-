@echo off
echo ========================================================
echo Starting QR Health Vault Services (Backend + Frontend)
echo ========================================================

:: Seed and Start Backend
start "QR Health Vault - Backend (:8000)" cmd /k "cd /d %~dp0 && backend\venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

:: Start Frontend
start "QR Health Vault - Frontend (:3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend launched at: http://127.0.0.1:8000
echo Frontend launched at: http://localhost:3000
echo ========================================================
