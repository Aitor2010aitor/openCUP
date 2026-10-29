# Arranque + editor + cierre forzado (prueba del Job object).
$exe = (Resolve-Path dist\Cacup\Cacup.exe).Path
Get-Process Cacup -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Start-Process -FilePath $exe
Start-Sleep -Seconds 10
$p = Get-Process Cacup -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
Write-Output ("arranque: " + $(if ($p) { "PID " + $p.Id + " '" + $p.MainWindowTitle + "' " + [math]::Round($p.WorkingSet64/1MB,1) + " MB" } else { "FALLO" }))
try { $r = Invoke-WebRequest -Uri http://127.0.0.1:8787/ -UseBasicParsing -TimeoutSec 6; Write-Output ("http: " + $r.StatusCode) } catch { Write-Output ("http: FALLO " + $_.Exception.Message) }
$nodeAntes = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*dist\Cacup*' })
Write-Output ("node del empaquetado: " + $nodeAntes.Count)

# Cierre forzado: sin StopServer, el Job debe matar al hijo.
& taskkill /F /IM Cacup.exe | Out-Null
Start-Sleep -Seconds 4
$nodeDespues = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*dist\Cacup*' })
Write-Output ("tras taskkill /F: Cacup=" + @(Get-Process Cacup -ErrorAction SilentlyContinue).Count + ", node empaquetado=" + $nodeDespues.Count)
Write-Output ("puerto 8787: " + $(if (netstat -ano | Select-String ':8787.*LISTENING') { "OCUPADO (fuga)" } else { "libre" }))
Write-Output ("puerto 8790: " + $(if (netstat -ano | Select-String ':8790.*LISTENING') { "OCUPADO (fuga)" } else { "libre" }))
Write-Output "---- log ----"
Get-Content "$env:LOCALAPPDATA\Cacup\cacup.log" -Tail 6
