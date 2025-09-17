param()
$ErrorActionPreference = "Stop"

Write-Host "? Preflight: $(Get-Location)" -ForegroundColor Cyan

# Required files
$required = @(
  "app/_layout.tsx",
  "app/components/Screen.tsx",
  "app/components/UniversalHeader.tsx",
  "services/config.ts",
  "theme/index.ts"
)
$missing = @()
foreach ($p in $required) { if (-not (Test-Path $p)) { $missing += $p } }
if ($missing.Count -gt 0) {
  Write-Host "! Missing files:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "   - $_" }
  exit 1
}

# Wrong import path (../components/Screen from app/*.tsx)
$bad = Select-String -Path "app/**/*.tsx" -Pattern "\.\./components/Screen" -ErrorAction SilentlyContinue
if ($bad) {
  Write-Host "! Found incorrect imports of Screen (use ./components/Screen from app/*):" -ForegroundColor Red
  $bad | ForEach-Object { Write-Host ("   - " + $_.Path + ":" + $_.LineNumber + "  " + $_.Line.Trim()) }
  exit 1
}

# Duplicate/conflicting routes
$dup = @()
if ((Test-Path "app/maintenance-hub.tsx") -and (Test-Path "app/maintenance-hub/index.tsx")) {
  $dup += "maintenance-hub.tsx AND maintenance-hub/index.tsx (pick one)"
}
if (Test-Path "app/scanner.tsx") {
  $dup += "app/scanner.tsx duplicates /scan (rename/move to _legacy)"
}
if ($dup.Count -gt 0) {
  Write-Host "! Route conflicts:" -ForegroundColor Red
  $dup | ForEach-Object { Write-Host "   - $_" }
  exit 1
}

# TypeScript typecheck (no emit)
$null = & npx tsc -p . --noEmit
if ($LASTEXITCODE -ne 0) {
  Write-Host "! TypeScript errors (run: npx tsc -p . --noEmit)" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "✓ Preflight passed." -ForegroundColor Green
exit 0
