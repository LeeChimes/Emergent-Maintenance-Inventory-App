param([switch]$Web)
Remove-Item -Recurse -Force .expo, .expo-shared -ErrorAction SilentlyContinue
if ($Web) { npm run start -- --web -c } else { npm run start -- -c }
