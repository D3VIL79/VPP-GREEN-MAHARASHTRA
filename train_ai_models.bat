@echo off
echo ==========================================================
echo    VPP Green - PyTorch AI Model Training Pipeline
echo ==========================================================
echo WARNING: This process requires at least 4 GB of free space 
echo on your C: drive to install PyTorch and download datasets!
echo.

cd vpp-green\ai-backend || exit

echo [1/2] Setting up Python Virtual Environment...
if not exist venv (
    python -m venv venv
)
venv\Scripts\pip install -r requirements.txt

echo.
echo [2/2] Running Complete AI Model Training Pipeline...
venv\Scripts\python vpp_green_pipeline.py

echo.
echo ==========================================================
echo  Training Complete! The models/ folder has been updated.
echo ==========================================================

