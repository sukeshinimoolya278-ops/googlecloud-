Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting QR Health Vault (Backend + Frontend)" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both servers launched in separate windows!" -ForegroundColor Green
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend:   http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "Demo OTP:  123456" -ForegroundColor Cyan
