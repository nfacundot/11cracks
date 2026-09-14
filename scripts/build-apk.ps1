param(
  [string]$ServerUrl = "https://11cracks.vercel.app"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdk\platform-tools\adb.exe"
$gradle = Join-Path $root "android\gradlew.bat"

Write-Host "== Compilando APK -> $ServerUrl ==" -ForegroundColor Green

$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:CAPACITOR_SERVER_URL = $ServerUrl

Set-Location $root
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "cap sync fallo" }

Push-Location (Join-Path $root "android")
try {
  & $gradle assembleDebug
  if ($LASTEXITCODE -ne 0) { throw "Gradle fallo" }
} finally {
  Pop-Location
}

$apk = Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk"
Write-Host ""
Write-Host "APK listo: $apk" -ForegroundColor Green
if (Test-Path $adb) {
  $devices = & $adb devices 2>$null
  if ($devices -match "`tdevice") {
    & $adb install -r $apk
    Write-Host "Instalado en el telefono." -ForegroundColor Green
  } else {
    Write-Host "Telefono no conectado/autorizado. Copia el APK manualmente." -ForegroundColor Yellow
  }
} else {
  Write-Host "adb no encontrado. Copia el APK al telefono manualmente." -ForegroundColor Yellow
}
