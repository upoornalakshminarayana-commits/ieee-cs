@echo off
cd /d "%~dp0"
echo ==============================================
echo Syncing Videos and Pushing KHEPRIX 2K26 to GitHub
echo Repo: https://github.com/upoornalakshminarayana-commits/ieee-cs
echo ==============================================

set "DEST_DESKTOP=%~dp0public\videos\desktop"
set "DEST_MOBILE=%~dp0public\videos\mobile"

if not exist "%DEST_DESKTOP%" mkdir "%DEST_DESKTOP%"
if not exist "%DEST_MOBILE%" mkdir "%DEST_MOBILE%"

if exist "G:\Mummy\desktop vedios\" (
    echo Copying desktop videos...
    xcopy /Y /I "G:\Mummy\desktop vedios\*" "%DEST_DESKTOP%\"
)

if exist "G:\Mummy\mobile vedios\" (
    echo Copying mobile videos...
    xcopy /Y /I "G:\Mummy\mobile vedios\*" "%DEST_MOBILE%\"
)

git config --global --add safe.directory "G:/Mummy/Mummy/kheprix-2k26"
git config --global --add safe.directory *

git config user.name >nul 2>&1 || git config user.name "upoornalakshminarayana-commits"
git config user.email >nul 2>&1 || git config user.email "upoornalakshminarayana@users.noreply.github.com"

git init
git remote remove origin 2>nul
git remote add origin https://github.com/upoornalakshminarayana-commits/ieee-cs.git
git add -A
git commit -m "Include all MP4 video assets in public/videos for Vercel deployment" 2>nul
git branch -M main
git push -u origin main --force

echo Verification of tracked videos in git:
git ls-files public/videos

pause
