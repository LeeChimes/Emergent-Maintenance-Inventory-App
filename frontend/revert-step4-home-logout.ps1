# Restore TopBar and remove the two new routes
if (Test-Path "app/components/TopBar.tsx.bak") { Copy-Item "app/components/TopBar.tsx.bak" "app/components/TopBar.tsx" -Force }
if (Test-Path "app/home.tsx") { Remove-Item "app/home.tsx" -Force }
if (Test-Path "app/logout.tsx") { Remove-Item "app/logout.tsx" -Force }
Write-Host "Reverted Home/Logout step." -ForegroundColor Green