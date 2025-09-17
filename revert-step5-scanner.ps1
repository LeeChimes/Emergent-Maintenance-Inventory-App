# Restore layout & topbar; remove new files
if (Test-Path "app/_layout.tsx.bak") { Copy-Item "app/_layout.tsx.bak" "app/_layout.tsx" -Force }
if (Test-Path "app/components/TopBar.tsx.bak") { Copy-Item "app/components/TopBar.tsx.bak" "app/components/TopBar.tsx" -Force }
if (Test-Path "app/components/ScannerGate.tsx") { Remove-Item "app/components/ScannerGate.tsx" -Force }
if (Test-Path "app/manual-entry.tsx") { Remove-Item "app/manual-entry.tsx" -Force }
Write-Host "Scanner step reverted." -ForegroundColor Green