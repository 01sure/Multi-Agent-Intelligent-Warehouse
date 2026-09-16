@echo off
chcp 65001 >nul
title MAIW Launcher
cd /d D:\code\a1\Multi-Agent-Intelligent-Warehouse-main

echo ============================================
echo   MAIW Multi-Agent Intelligent Warehouse
echo   Backend : http://localhost:8001
echo   Frontend: http://localhost:3001
echo ============================================
echo.
echo [1/3] Starting backend (port 8001)...
start "MAIW Backend 8001" cmd /k "cd /d D:\code\a1\Multi-Agent-Intelligent-Warehouse-main && set MAIW_DEMO_MODE=true && set POSTGRES_PASSWORD=demo-local-pw-2026 && set JWT_SECRET_KEY=local-dev-secret-key-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef && env\Scripts\python.exe -m uvicorn maiw_api.app:app --host 0.0.0.0 --port 8001"

echo [2/3] Starting frontend (port 3001)...
start "MAIW Frontend 3001" cmd /k "cd /d D:\code\a1\Multi-Agent-Intelligent-Warehouse-main\src\ui\web && if not exist node_modules\fast-equals\dist\esm\index.mjs copy /Y node_modules\fast-equals\dist\es\index.mjs node_modules\fast-equals\dist\esm\index.mjs >nul && set PORT=3001 && set HOST=0.0.0.0 && npx craco start"

echo [3/3] Waiting for services, then opening browser...
timeout /t 8 /nobreak >nul
start http://localhost:3001
echo.
echo Done. Keep both console windows open to run the project.
echo If a port is already in use, close the duplicate window.
timeout /t 3 /nobreak >nul
exit
