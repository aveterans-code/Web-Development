@echo off
title SD Card Development Environment
echo ================================================
echo  SD Card Development Environment Starting...
echo ================================================

REM Set Python path
set PYTHONPATH=D:\DevTools\Python;D:\DevTools\Lib\site-packages
set PATH=D:\DevTools\Python;D:\DevTools\Scripts;%PATH%

REM Navigate to projects
cd /d D:\Projects

echo Environment ready!
echo Python location: D:\DevTools\Python
echo Current directory: %CD%
echo.
echo Commands:
echo   python --version          (Check Python)
echo   cd ship_dashboard         (Go to project)
echo   python python/data_sim.py (Start Flask server)
echo.
cmd /k