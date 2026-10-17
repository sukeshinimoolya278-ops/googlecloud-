@echo off
echo ===================================================
echo Starting QR Health Vault (Backend + Frontend)
echo ===================================================

echo Starting FastAPI Backend on http://localhost:8000 ...
start "QR Health Vault - Backend" cmd /k "cd backend && python main.py"

echo Starting Next.js Frontend on http://localhost:3000 ...
start "QR Health Vault - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000/docs
echo Demo OTP: 123456
echo ===================================================
