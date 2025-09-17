if (Test-Path "app/components/UniversalHeader.tsx.bak") { Copy-Item "app/components/UniversalHeader.tsx.bak" "app/components/UniversalHeader.tsx" -Force }
if (Test-Path "app/components/TopBar.tsx.bak") { Copy-Item "app/components/TopBar.tsx.bak" "app/components/TopBar.tsx" -Force }
Write-Host "Header polish reverted." -ForegroundColor Green