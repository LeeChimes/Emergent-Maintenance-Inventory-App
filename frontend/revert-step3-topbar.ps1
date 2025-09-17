if (Test-Path "app/_layout.tsx.bak") {
  Copy-Item "app/_layout.tsx.bak" "app/_layout.tsx" -Force
}
if (Test-Path "app/components/TopBar.tsx") {
  Remove-Item "app/components/TopBar.tsx" -Force
}
Write-Host "Reverted global top bar changes." -ForegroundColor Green