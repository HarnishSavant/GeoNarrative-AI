@echo off
echo ============================================
echo  GeoNarrative AI — Starting Backend Server
echo ============================================
echo.

cd /d "%~dp0backend"

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing/checking bcrypt dependency...
pip install bcrypt>=4.0.0 --quiet 2>nul

echo.
echo Starting FastAPI backend on http://localhost:8000 ...
echo Press Ctrl+C to stop the server.
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
