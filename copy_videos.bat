@echo off
set "DEST_DESKTOP=%~dp0public\videos\desktop"
set "DEST_MOBILE=%~dp0public\videos\mobile"

if not exist "%DEST_DESKTOP%" mkdir "%DEST_DESKTOP%"
if not exist "%DEST_MOBILE%" mkdir "%DEST_MOBILE%"

echo Copying desktop videos...
xcopy /Y /I "G:\Mummy\desktop vedios\*" "%DEST_DESKTOP%\"

echo Copying mobile videos...
xcopy /Y /I "G:\Mummy\mobile vedios\*" "%DEST_MOBILE%\"

echo Done!
