param(
  [string]$Message = "chore(safepoint): snapshot",
  [string]$Tag = ("safepoint-" + (Get-Date -Format "yyyy-MM-dd-HHmm"))
)
git add -A
git commit -m $Message 2>$null
git push 2>$null
git tag -a $Tag -m $Message
git push origin $Tag
Write-Host "✓ Safepoint tagged: $Tag" -ForegroundColor Green
