Set-Location $PSScriptRoot
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Syncing Videos & Pushing KHEPRIX 2K26 to GitHub" -ForegroundColor Cyan
Write-Host "Repo: https://github.com/upoornalakshminarayana-commits/ieee-cs" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Copy all videos from local folders into public/videos/
$desktopSource = "G:\Mummy\desktop vedios"
$mobileSource = "G:\Mummy\mobile vedios"
$desktopTarget = "$PSScriptRoot\public\videos\desktop"
$mobileTarget = "$PSScriptRoot\public\videos\mobile"

if (!(Test-Path $desktopTarget)) { New-Item -ItemType Directory -Force -Path $desktopTarget | Out-Null }
if (!(Test-Path $mobileTarget)) { New-Item -ItemType Directory -Force -Path $mobileTarget | Out-Null }

if (Test-Path $desktopSource) {
    Write-Host "Copying desktop videos into public/videos/desktop/..." -ForegroundColor Yellow
    Copy-Item -Path "$desktopSource\*" -Destination $desktopTarget -Force
}
if (Test-Path $mobileSource) {
    Write-Host "Copying mobile videos into public/videos/mobile/..." -ForegroundColor Yellow
    Copy-Item -Path "$mobileSource\*" -Destination $mobileTarget -Force
}

# 2. Configure Git safe directory & author
git config --global --add safe.directory "G:/Mummy/Mummy/kheprix-2k26"
git config --global --add safe.directory "$($PSScriptRoot.Replace('\', '/'))"

$currentName = git config user.name
if (-not $currentName) {
    git config user.name "upoornalakshminarayana-commits"
    git config user.email "upoornalakshminarayana@users.noreply.github.com"
}

# 3. Add all files (including new video assets) and commit
git init
git remote remove origin 2>$null
git remote add origin https://github.com/upoornalakshminarayana-commits/ieee-cs.git
git add -A
git commit -m "Add Transaction ID to registration payment step, receipt, confirmation voucher, and admin portal" 2>$null
git branch -M main

# 4. Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main --force

Write-Host "Verification of tracked videos in git:" -ForegroundColor Green
git ls-files public/videos
