Set-Location $PSScriptRoot
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Pushing KHEPRIX 2K26 to GitHub" -ForegroundColor Cyan
Write-Host "Repo: https://github.com/upoornalakshminarayana-commits/ieee-cs" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Fix dubious ownership on external/secondary drives
git config --global --add safe.directory "G:/Mummy/Mummy/kheprix-2k26"
git config --global --add safe.directory "$($PSScriptRoot.Replace('\', '/'))"

# Set Git user identity if not already set
$currentName = git config user.name
if (-not $currentName) {
    git config user.name "upoornalakshminarayana-commits"
    git config user.email "[EMAIL_ADDRESS]"
}

git init
git remote remove origin 2>$null
git remote add origin https://github.com/upoornalakshminarayana-commits/ieee-cs.git
git add -A
git commit -m "Fix TypeScript compilation errors for Vercel production build" 2>$null
git branch -M main

Write-Host "Syncing with remote..." -ForegroundColor Yellow
git pull origin main --rebase --allow-unrelated-histories 2>$null

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main --force



