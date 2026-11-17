#requires -Version 5.1
<#
  Build APK debug Ngoffe ID dari source.

  Otomatis memakai JDK 21 dan Android SDK yang terpasang di mesin ini bila
  JAVA_HOME / ANDROID_HOME belum diset di terminal (mis. saat dibuka dari IDE).

  Jalankan dari root proyek:
    npm run android:apk
  atau:
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-apk.ps1
#>

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$localJdk = Join-Path $env:LOCALAPPDATA 'Android\jdk-21'
$localSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'

if (-not $env:JAVA_HOME -and (Test-Path $localJdk)) {
  $env:JAVA_HOME = $localJdk
}
if (-not $env:ANDROID_HOME -and (Test-Path $localSdk)) {
  $env:ANDROID_HOME = $localSdk
}
if (-not $env:ANDROID_SDK_ROOT -and $env:ANDROID_HOME) {
  $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
}

if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
  throw 'JDK 21 belum ditemukan. Pasang JDK 21 lalu set JAVA_HOME ke folder instalasinya.'
}
if (-not $env:ANDROID_HOME -or -not (Test-Path (Join-Path $env:ANDROID_HOME 'platforms\android-36'))) {
  throw 'Android SDK 36 belum ditemukan. Pasang lewat Android Studio -> SDK Manager lalu set ANDROID_HOME.'
}
if (-not (Test-Path (Join-Path $root 'android\local.properties'))) {
  throw 'android/local.properties tidak ada. Isi dengan sdk.dir=<path Android SDK>.'
}

Push-Location $root
try {
  Write-Host '==> npm run build'
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'npm run build gagal.' }

  Write-Host '==> npx cap sync android'
  npx cap sync android
  if ($LASTEXITCODE -ne 0) { throw 'cap sync android gagal.' }

  Push-Location (Join-Path $root 'android')
  try {
    Write-Host '==> gradlew assembleDebug'
    .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) { throw 'gradlew assembleDebug gagal.' }
  }
  finally {
    Pop-Location
  }

  $built = Join-Path $root 'android\app\build\outputs\apk\debug\app-debug.apk'
  $output = Join-Path $root 'ngoffe-id-debug.apk'
  Copy-Item $built $output -Force

  $hash = (Get-FileHash $output -Algorithm SHA256).Hash.ToLowerInvariant()
  $size = [Math]::Round((Get-Item $output).Length / 1MB, 2)
  Write-Host ''
  Write-Host "APK siap: $output ($size MB)"
  Write-Host "SHA-256: $hash"
}
finally {
  Pop-Location
}
