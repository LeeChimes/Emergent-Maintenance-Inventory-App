# Restore TopBar and (optionally) resurrect /home if it existed
if (Test-Path "app/components/TopBar.tsx.bak") { Copy-Item "app/components/TopBar.tsx.bak" "app/components/TopBar.tsx" -Force }
Write-Host "Reverted Home-to-hub step." -ForegroundColor Green