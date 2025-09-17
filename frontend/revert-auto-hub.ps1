# Restore previous TopBar and theme, and config if backed up
if (Test-Path "app/components/TopBar.tsx.bak") { Copy-Item "app/components/TopBar.tsx.bak" "app/components/TopBar.tsx" -Force }
if (Test-Path "theme/index.ts.bak") { Copy-Item "theme/index.ts.bak" "theme/index.ts" -Force }
if (Test-Path "services/config.ts.bak") { Copy-Item "services/config.ts.bak" "services/config.ts" -Force }
Write-Host "Reverted auto-hub step." -ForegroundColor Green