<#
.SYNOPSIS
  Rebuilds frontend + backend and restarts them fresh - guarantees no stale code.

.EXAMPLE
  .\rebuild.ps1              # full rebuild, serve packaged app on :8080
  .\rebuild.ps1 -Dev         # same, plus vite dev server on :5173 (hot reload)
  .\rebuild.ps1 -SkipBuild   # no rebuild, just restart servers from last build
#>
param(
    [switch]$Dev,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root
$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-Step([string]$msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# ---------------------------------------------------------------- 1. stop everything old
Write-Step 'Stopping stale processes'

$backendProcs = Get-CimInstance Win32_Process -Filter "Name='java.exe'" |
    Where-Object { $_.CommandLine -match 'shoppingdotcom|spring-boot' }
foreach ($p in $backendProcs) {
    Write-Host "  stopping backend pid $($p.ProcessId)"
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}

$viteProcs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'vite' }
foreach ($p in $viteProcs) {
    Write-Host "  stopping vite pid $($p.ProcessId)"
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}

foreach ($port in 8080, 5173) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object {
            Write-Host "  freeing port $port (pid $_)"
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
}
Start-Sleep -Seconds 2

# ---------------------------------------------------------------- 2. environment
Write-Step 'Loading .env'
Get-Content (Join-Path $root '.env') | ForEach-Object {
    if ($_ -match '^\s*[A-Za-z_]') {
        $idx = $_.IndexOf('=')
        if ($idx -gt 0) {
            [System.Environment]::SetEnvironmentVariable(
                $_.Substring(0, $idx).Trim(),
                $_.Substring($idx + 1).Trim(),
                'Process')
        }
    }
}
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'

# ---------------------------------------------------------------- 3. build
$npmCmd = Join-Path $env:ProgramFiles 'nodejs\npm.cmd'
if (-not (Test-Path $npmCmd)) { $npmCmd = 'npm' }

if (-not $SkipBuild) {
    Write-Step 'Building frontend'
    Push-Location (Join-Path $root 'frontend')
    try {
        if (-not (Test-Path node_modules)) { & $npmCmd install }
        & $npmCmd run build
        if ($LASTEXITCODE -ne 0) { throw 'frontend build failed' }
    } finally { Pop-Location }

    Write-Step 'Packaging backend (uses the dist we just built)'
    & (Join-Path $root 'mvnw.cmd') clean package -DskipTests '-Dskip.frontend=true'
    if ($LASTEXITCODE -ne 0) { throw 'backend package failed' }
}

# sanity: the jar must reference exactly what dist produced
$distAsset  = Get-ChildItem (Join-Path $root 'frontend\dist\assets') -Filter 'index-*.js' |
              Select-Object -First 1 -ExpandProperty Name
Write-Host "  latest frontend bundle: $distAsset"

# ---------------------------------------------------------------- 4. start backend (:8080)
Write-Step 'Starting backend on :8080'
Start-Process -FilePath 'cmd.exe' -ArgumentList "/c java -jar target\shoppingdotcom-0.0.1-SNAPSHOT.jar > logs\backend.log 2>&1" `
    -WorkingDirectory $root -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds(120)
do {
    Start-Sleep -Seconds 3
    try {
        $null = Invoke-WebRequest 'http://localhost:8080/api/categories' -UseBasicParsing -TimeoutSec 3
        $up = $true
    } catch { $up = $false }
} while (-not $up -and (Get-Date) -lt $deadline)

if (-not $up) {
    Write-Host '  BACKEND FAILED TO START - last log lines:' -ForegroundColor Red
    Get-Content (Join-Path $logDir 'backend.log') -Tail 20
    exit 1
}
Write-Host '  backend ready -> http://localhost:8080/home' -ForegroundColor Green

# ---------------------------------------------------------------- 5. optionally vite dev (:5173)
if ($Dev) {
    Write-Step 'Starting vite dev server on :5173'
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd frontend && npm run dev > ..\logs\vite.log 2>&1' `
        -WorkingDirectory $root -WindowStyle Hidden
    $deadline = (Get-Date).AddSeconds(60)
    do {
        Start-Sleep -Seconds 3
        try { $null = Invoke-WebRequest 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 3; $viteUp = $true }
        catch { $viteUp = $false }
    } while (-not $viteUp -and (Get-Date) -lt $deadline)
    if ($viteUp) { Write-Host '  vite ready -> http://localhost:5173' -ForegroundColor Green }
    else { Write-Host '  vite did not come up - check logs\vite.log' -ForegroundColor Red }
}

Write-Host "`nDone. Open http://localhost:8080/home $(if ($Dev) { 'or http://localhost:5173' }) and Ctrl+Shift+R once.`n" -ForegroundColor Yellow
