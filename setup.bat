@echo off
REM JanSetu AI - 1-Click Automated Setup for Windows
echo ========================================================
echo    JanSetu AI (जनसेतु) - 1-Click Automated Setup
echo ========================================================
node scripts\setup.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Setup failed with error code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Press any key to exit this installer...
pause >nul
