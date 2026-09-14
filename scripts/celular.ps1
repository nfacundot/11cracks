param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdk\platform-tools\adb.exe"
$gradle = Join-Path $root "android\gradlew.bat"

function Get-LanIp {
  $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.InterfaceAlias -notlike "*Loopback*" } |
    Sort-Object { $_.InterfaceAlias -match "Wi-Fi" } -Descending |
    Select-Object -First 1 -ExpandProperty IPAddress
  if (-not $ip) { throw "No se encontro IP local. Revisa tu conexion WiFi." }
  return $ip
}

$ip = Get-LanIp
Write-Host "== IP del servidor: $ip :3000 ==" -ForegroundColor Green

# 1) Levantar el servidor Next.js accesible desde la red (0.0.0.0)
$env:LAN_IP = $ip
$env:CAPACITOR_MODE = "lan"
$serverProc = Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", "cd '$root'; `$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot'; npm run dev -- -H 0.0.0.0" -WindowStyle Hidden -PassThru
Write-Host "Servidor iniciado (PID $($serverProc.Id)). Esperando a que arranque..." -ForegroundColor Cyan

$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  try {
    $resp = Invoke-WebRequest -Uri "http://$ip`:3000/login" -UseBasicParsing -TimeoutSec 2
    if ($resp.StatusCode -eq 200) { $ready = $true; break }
  } catch { }
}
if (-not $ready) { Write-Host "No se pudo conectar al servidor. Revisa el firewall (permite node en redes privadas)." -ForegroundColor Red }
else { Write-Host "Servidor listo." -ForegroundColor Green }

if ($SkipInstall) {
  Write-Host "APK sin instalar. Ejecuta: npm run android:apk" -ForegroundColor Yellow
  return
}

# 2) Verificar dispositivo
$deviceOutput = & $adb devices 2>$null | Out-String
$hasDevice = $deviceOutput -match "device\s*$" -and $deviceOutput -notmatch "unauthorized"
if (-not $hasDevice) {
  Write-Host "No hay dispositivo autorizado. Conecta el telefono por USB y acepta 'Depurar por USB'." -ForegroundColor Red
  Write-Host "Dispositivos detectados:" -ForegroundColor Yellow
  Write-Host $deviceOutput
  exit 1
}

# 3) Sincronizar Capacitor y compilar el APK
Set-Location $root
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "cap sync fallo" }

$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
Push-Location (Join-Path $root "android")
try {
  & $gradle assembleDebug
  if ($LASTEXITCODE -ne 0) { throw "Gradle fallo" }
} finally {
  Pop-Location
}

# 4) Instalar y abrir
$apk = Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk"
& $adb install -r $apk
if ($LASTEXITCODE -ne 0) { throw "adb install fallo" }

Write-Host "APK instalado. Abriendo la app..." -ForegroundColor Green
& $adb shell am start -n com.elevencracks.mobile/.MainActivity

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " App abierta en el telefono apuntando a http://$ip`:3000" -ForegroundColor Green
Write-Host " Deja la PC encendida y conectada a la misma red WiFi." -ForegroundColor Yellow
Write-Host " Para detener el servidor: cierra la ventana de Node." -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan
