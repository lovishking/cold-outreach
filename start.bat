@echo off
echo ==============================================
echo        Starting Nexa Outreach System...
echo ==============================================

echo Starting the Backend...
start "Nexa Backend" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn main:app --reload --no-access-log"

echo Starting the Frontend...
start "Nexa Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting up in new windows!
echo.
echo - Frontend will be at: http://localhost:3000
echo - Backend API will be at: http://localhost:8000
echo - API Docs will be at: http://localhost:8000/docs
echo.
pause
