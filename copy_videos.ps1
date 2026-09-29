$desktopSource = "G:\Mummy\desktop vedios"
$mobileSource = "G:\Mummy\mobile vedios"

$desktopTarget = "$PSScriptRoot\public\videos\desktop"
$mobileTarget = "$PSScriptRoot\public\videos\mobile"

if (!(Test-Path $desktopTarget)) { New-Item -ItemType Directory -Force -Path $desktopTarget | Out-Null }
if (!(Test-Path $mobileTarget)) { New-Item -ItemType Directory -Force -Path $mobileTarget | Out-Null }

Write-Host "Copying desktop videos from $desktopSource..." -ForegroundColor Cyan
Copy-Item -Path "$desktopSource\*" -Destination $desktopTarget -Force

Write-Host "Copying mobile videos from $mobileSource..." -ForegroundColor Cyan
Copy-Item -Path "$mobileSource\*" -Destination $mobileTarget -Force

Write-Host "Copied desktop files:" -ForegroundColor Green
Get-ChildItem $desktopTarget | Select-Object Name, Length

Write-Host "Copied mobile files:" -ForegroundColor Green
Get-ChildItem $mobileTarget | Select-Object Name, Length
