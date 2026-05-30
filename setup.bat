@echo off
echo ============================================
echo   GeoNarrative AI — Quick Setup Script
echo ============================================
echo.

echo [1/4] Installing Frontend Dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo [2/4] Setting up Frontend Environment...
if not exist ".env.local" (
    copy ".env.example" ".env.local"
    echo Created .env.local — Add your Mapbox token and Gemini key!
) else (
    echo .env.local already exists
)
echo.

echo [3/4] Setting up Backend...
cd /d "%~dp0backend"
python -m venv venv 2>nul
call venv\Scripts\activate.bat 2>nul
pip install -r requirements.txt
if errorlevel 1 (
    echo WARNING: Backend setup had issues. Trying without venv...
    pip install -r requirements.txt
)
echo Backend dependencies installed!
echo.

echo [4/4] Setup Complete!
echo.
echo ============================================
echo   TO START THE APPLICATION:
echo ============================================
echo.
echo   Frontend (Terminal 1):
echo     cd frontend
echo     npm run dev
echo.
echo   Backend (Terminal 2):
echo     cd backend
echo     python main.py
echo.
echo   Then open: http://localhost:3000
echo ============================================
echo.
echo   IMPORTANT: Add your API keys in:
echo   frontend\.env.local
echo ============================================
pause
