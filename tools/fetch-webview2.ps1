# Descarga el SDK nativo de Microsoft.Web.WebView2 desde nuget.org y lo deja
# en build/webview2 (directorio ignorado por git). Solo se ejecuta si falta.
param(
  [string]$Version = '1.0.4314.35'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $root 'build\webview2'
$include = Join-Path $dest 'build\native\include\WebView2.h'

if (Test-Path $include) {
  Write-Output "WebView2 SDK ya presente en build\webview2"
  exit 0
}

$zip = Join-Path $env:TEMP "webview2-sdk-$Version.zip"
$url = "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/$Version/microsoft.web.webview2.$Version.nupkg"

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
Write-Output "Descargando WebView2 SDK $Version..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

$tmp = Join-Path $env:TEMP "webview2-sdk-$Version"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $tmp -Force
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
Move-Item $tmp $dest
Remove-Item $zip -Force

if (!(Test-Path $include)) { throw 'La descarga no contiene build\native\include\WebView2.h' }
Write-Output "WebView2 SDK listo en build\webview2"
