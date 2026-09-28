# npm kurulum betiği Electron'u açamazsa (ör. yeni Node sürümlerinde extract-zip sorunu),
# indirilmiş zip'i önbellekten Windows'un kendi aracıyla açar.
$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'node_modules\electron\dist'
$zip = Get-ChildItem -Recurse "$env:LOCALAPPDATA\electron\Cache" -Filter 'electron-v*-win32-x64.zip' -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $zip) {
  Write-Host 'Önbellekte Electron zip dosyası bulunamadı.'
  exit 1
}
Write-Host "Açılıyor: $($zip.Name)"
if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
Expand-Archive -Path $zip.FullName -DestinationPath $dist -Force
Set-Content -Path (Join-Path $root 'node_modules\electron\path.txt') -Value 'electron.exe' -NoNewline -Encoding ascii
