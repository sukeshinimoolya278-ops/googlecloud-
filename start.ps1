# PowerShell launcher for QR Health Vault
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting QR Health Vault Services (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# Launch backend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; & '$root\backend\venv\Scripts\python.exe' -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

# Launch frontend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "Backend API:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend App: http://localhost:3000" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
