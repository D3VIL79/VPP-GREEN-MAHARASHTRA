@echo off
echo ==========================================================
echo     VPP Green Maharashtra - Unified Startup Script
echo ==========================================================

echo Cleaning up any processes occupying ports 8000, 8001, or 3000...
powershell -Command "foreach ($port in @(8000, 8001, 3000)) { $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if ($conn) { echo 'Stopping process on port '$port; Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue } }"
echo Ports cleaned up!
echo.

echo ==========================================================
echo  Verifying Supabase Database Connectivity...
echo ==========================================================
cd vpp-green
call npx tsx scratch/check_supabase.ts
if %ERRORLEVEL% neq 0 (
  echo.
  echo [ERROR] Supabase database connectivity check failed!
  echo Please check your internet connection or .env.local configuration.
  echo.
  cd ..
  pause
  exit /b 1
)
cd ..
echo.

echo Installing/Verifying concurrently...
call npm install -g concurrently

echo.
echo ==========================================================
echo  Starting all services simultaneously...
echo  Frontend: http://localhost:3000
echo  AI Service: http://localhost:8000/docs
echo  AI Backend: http://localhost:8001/docs
echo ==========================================================
echo.

npx concurrently --kill-others --names "AI-HEURISTICS,AI-PYTORCH,NEXTJS-FRONTEND" --prefix-colors "blue,magenta,green" ^
  "cd ai-service && if not exist venv (python -m venv venv && venv\Scripts\pip install -r requirements.txt) else (venv\Scripts\pip install -r requirements.txt) && venv\Scripts\python -m uvicorn main:app --reload --port 8000" ^
  "cd vpp-green\ai-backend && if not exist venv (python -m venv venv && venv\Scripts\pip install -r requirements.txt) else (venv\Scripts\pip install -r requirements.txt) && venv\Scripts\python -m uvicorn main:app --reload --port 8001" ^
  "cd vpp-green && npm run dev"
