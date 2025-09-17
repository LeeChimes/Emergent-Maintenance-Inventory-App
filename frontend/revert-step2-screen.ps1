# Revert Screen + remove theme (optional) then reinstall
if (Test-Path "app/components/Screen.tsx.bak") { Copy-Item "app/components/Screen.tsx.bak" "app/components/Screen.tsx" -Force }
# Uncomment to fully remove theme folder if you want a deep revert:
# Remove-Item -Recurse -Force "theme" -ErrorAction SilentlyContinue
Write-Host "Reverted Screen.tsx (and optionally theme/) to backups." -ForegroundColor Green