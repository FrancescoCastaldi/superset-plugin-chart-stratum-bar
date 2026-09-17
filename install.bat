@echo off
REM StratumBar Chart Plugin Installer Runner
echo Avvio installazione StratumBar Chart Plugin per Apache Superset...
powershell -ExecutionPolicy Bypass -File "%~dp0install-plugin.ps1" %*
pause
