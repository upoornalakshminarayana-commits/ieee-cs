@echo off
cd /d "%~dp0"
echo ==============================================
echo Pushing KHEPRIX 2K26 to GitHub
echo Repo: https://github.com/upoornalakshminarayana-commits/ieee-cs
echo ==============================================

git config --global --add safe.directory "G:/Mummy/Mummy/kheprix-2k26"
git config --global --add safe.directory *

git config user.name >nul 2>&1 || git config user.name "upoornalakshminarayana-commits"
git config user.email >nul 2>&1 || git config user.email "upoornalakshminarayana@users.noreply.github.com"

git init
git remote remove origin 2>nul
git remote add origin https://github.com/upoornalakshminarayana-commits/ieee-cs.git
git add -A
git commit -m "KHEPRIX 2K26 official website and registration system" 2>nul
git branch -M main
git push -u origin main --force



pause

