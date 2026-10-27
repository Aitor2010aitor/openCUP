param(
  [string]$OutDir = "C:\Users\aitor\Desktop\cacup\dist\Cacup",
  [switch]$NoShortcut
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$webview = Join-Path $root 'build\webview2'
$core = Join-Path $webview 'lib\net462\Microsoft.Web.WebView2.Core.dll'
$win = Join-Path $webview 'lib\net462\Microsoft.Web.WebView2.WinForms.dll'
$loader = Join-Path $webview 'runtimes\win-x64\native\WebView2Loader.dll'
$icon = Join-Path $root 'build\cacup.ico'

if (!(Test-Path $csc)) { throw "No se encontró csc.exe" }
if (!(Test-Path $core)) { throw "Falta el SDK de WebView2. Ejecuta la descarga de NuGet primero." }

& (Join-Path $PSScriptRoot 'make-icon.ps1') -Out $icon

& $csc /nologo /target:winexe /platform:x64 /out:"$root\build\Cacup.exe" /win32icon:"$icon" `
  /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll `
  /reference:System.Windows.Forms.dll /reference:System.Net.Http.dll `
  /reference:"$core" /reference:"$win" "$root\launcher\Program.cs"
if ($LASTEXITCODE -ne 0) { throw "Falló la compilación de Cacup.exe" }

if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Copy-Item "$root\build\Cacup.exe" $OutDir
Copy-Item $core $OutDir
Copy-Item $win $OutDir
Copy-Item $loader $OutDir
Copy-Item "$root\server.mjs" $OutDir
Copy-Item "$root\index.html" $OutDir
Copy-Item "$root\package.json" $OutDir
Copy-Item "$root\README.md" $OutDir
Copy-Item "$root\src" $OutDir -Recurse
Copy-Item "$root\server" $OutDir -Recurse

$node = 'C:\Program Files\nodejs\node.exe'
if (Test-Path $node) {
  Copy-Item $node $OutDir
} else {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCommand) { Copy-Item $nodeCommand.Source $OutDir }
}

$readme = @"
Cacup - aplicación de escritorio
================================

Inicio rápido:
  Doble clic en Cacup.exe. La app arranca su servidor local y abre la
  interfaz con WebView2. Al cerrar la ventana también se detiene el servidor.

Requisitos:
  Windows 10/11 x64 y Microsoft Edge WebView2 Runtime (ya incluido en la
  mayoría de equipos actualizados). La carpeta incluye Node.js para no
  depender de una instalación del sistema.

Datos:
  Proyectos y preferencias se guardan en el navegador embebido (IndexedDB).
  La carpeta de datos de WebView2 está en %LOCALAPPDATA%\Cacup.
  El registro de arranque está en %LOCALAPPDATA%\Cacup\cacup.log.

El puente de IA escucha en 127.0.0.1:8790 y requiere el token que aparece
en Cacup > Menú > Puente IA.
"@
$readme | Out-File -FilePath (Join-Path $OutDir 'LEEME.txt') -Encoding utf8

if (!$NoShortcut) {
  $desktop = [Environment]::GetFolderPath('Desktop')
  $shortcutPath = Join-Path $desktop 'Cacup.lnk'
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = Join-Path $OutDir 'Cacup.exe'
  $shortcut.WorkingDirectory = $OutDir
  $shortcut.IconLocation = (Join-Path $OutDir 'Cacup.exe') + ',0'
  $shortcut.Description = 'Cacup - editor de vídeo local'
  $shortcut.Save()
  Write-Output "acceso directo -> $shortcutPath"
}

$size = (Get-ChildItem $OutDir -Recurse -File | Measure-Object Length -Sum).Sum
Write-Output "dist -> $OutDir ($([math]::Round($size / 1MB, 1)) MB)"
