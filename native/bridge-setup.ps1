param([string]$Bundled = '', [switch]$Pause)
# Sets up the SCUF Omega -> DualSense bridge (github.com/pedjaaaaa/Scuf-Omega-PS5-for-PC) from nothing.
# Runs elevated (tools\install-controller-bridge.bat takes care of that). Safe to run again: it repairs / updates.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Join-Path $env:ProgramData 'ConsoleBridge'
New-Item -ItemType Directory -Force -Path $root | Out-Null
try { Start-Transcript -Path (Join-Path $root 'setup.log') -Force | Out-Null } catch {}
$needReboot = $false
$ua = @{ 'User-Agent' = 'my-console' }

function Step($n, $t) { Write-Host ''; Write-Host "[$n/6] $t" -ForegroundColor Cyan }

function Get-LatestAsset($repo, $pattern) {
  $r = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest" -Headers $ua
  $a = $r.assets | Where-Object { $_.name -match $pattern } | Select-Object -First 1
  if (-not $a) { Write-Host "No download matching '$pattern' in $repo $($r.tag_name). Files there:"; $r.assets | ForEach-Object { Write-Host '   ' $_.name }; throw "no matching download in $repo" }
  return $a
}

function Find-Bundled($pat) { if ($Bundled -and (Test-Path (Join-Path $Bundled 'drivers'))) { return Get-ChildItem (Join-Path $Bundled 'drivers') -File | Where-Object { $_.Name -match $pat } | Select-Object -First 1 } return $null }

function Install-Package($asset) {
  if ($asset.FullName) { $f = $asset.FullName; $asset = @{ name = $asset.Name } }
  else { $f = Join-Path $env:TEMP $asset.name; Write-Host "Downloading $($asset.name) ..."; Invoke-WebRequest $asset.browser_download_url -OutFile $f -UseBasicParsing }
  if ($f -match '\.msi$') { $p = Start-Process msiexec.exe -ArgumentList @('/i', "`"$f`"", '/qn', '/norestart') -Wait -PassThru }
  else { $p = Start-Process $f -ArgumentList @('/quiet', '/norestart') -Wait -PassThru }
  Write-Host "Installer finished (code $($p.ExitCode))."
  if ($p.ExitCode -eq 3010 -or $p.ExitCode -eq 1641) { $script:needReboot = $true }
  elseif ($p.ExitCode -ne 0) { throw "installer for $($asset.name) failed with code $($p.ExitCode)" }
  if (-not $Bundled) { Remove-Item $f -ErrorAction SilentlyContinue }
}

try {
  Step 1 'ViGEmBus driver (makes the virtual PlayStation controller)'
  if (Get-Service -Name 'ViGEmBus' -ErrorAction SilentlyContinue) { Write-Host 'Already installed.' }
  else { $b = Find-Bundled 'ViGEm'; if ($b) { Install-Package $b } else { Install-Package (Get-LatestAsset 'nefarius/ViGEmBus' '(x64|x86_arm64).*\.(msi|exe)$|\.msi$') }; $needReboot = $true }

  Step 2 'HidHide driver (hides the real controller so games see one pad)'
  $hh = Join-Path $env:ProgramFiles 'Nefarius Software Solutions\HidHide\x64\HidHideCLI.exe'
  if ((Test-Path $hh) -or (Get-Service -Name 'HidHide' -ErrorAction SilentlyContinue)) { Write-Host 'Already installed.' }
  else { $b = Find-Bundled 'HidHide'; if ($b) { Install-Package $b } else { Install-Package (Get-LatestAsset 'nefarius/HidHide' '(x64).*\.(msi|exe)$|\.msi$') }; $needReboot = $true }

  $app = Join-Path $root 'app'
  $bundledExe = if ($Bundled) { Join-Path $Bundled 'ScufDualSense.exe' } else { '' }
  if ($bundledExe -and (Test-Path $bundledExe)) {
    Step 3 'Using the bridge that came inside this console (nothing to build)'
    Get-Process -Name 'ScufDualSense' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $app | Out-Null
    Copy-Item $bundledExe (Join-Path $app 'ScufDualSense.exe') -Force
    $ico = Join-Path $Bundled 'app.ico'; if (Test-Path $ico) { Copy-Item $ico (Join-Path $app 'app.ico') -Force }
    $exe = Join-Path $app 'ScufDualSense.exe'
  } else {
    Step 3 '.NET 8 SDK (needed once, to build the bridge)'
    $dn = Join-Path $root 'dotnet'
    $dotnet = Join-Path $dn 'dotnet.exe'
    if (-not (Test-Path $dotnet)) {
      $s = Join-Path $root 'dotnet-install.ps1'
      Invoke-WebRequest 'https://dot.net/v1/dotnet-install.ps1' -OutFile $s -UseBasicParsing
      & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $s -Channel 8.0 -InstallDir $dn
      if (-not (Test-Path $dotnet)) { throw '.NET SDK did not install' }
    } else { Write-Host 'Already there.' }

    Step 4 'Downloading the bridge'
    $src = Join-Path $root 'src'
    if (Test-Path $src) { Remove-Item $src -Recurse -Force }
    $zip = Join-Path $root 'bridge.zip'
    Invoke-WebRequest 'https://codeload.github.com/pedjaaaaa/Scuf-Omega-PS5-for-PC/zip/refs/heads/main' -OutFile $zip -UseBasicParsing
    Expand-Archive $zip -DestinationPath $src -Force
    Remove-Item $zip -ErrorAction SilentlyContinue
    $proj = Get-ChildItem $src -Recurse -Filter 'ScufDualSense.csproj' | Select-Object -First 1
    if (-not $proj) { throw 'ScufDualSense.csproj not found in the download' }

    Step 5 'Building the bridge (1 to 3 minutes)'
    Get-Process -Name 'ScufDualSense' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    $env:DOTNET_ROOT = $dn; $env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'; $env:DOTNET_NOLOGO = '1'
    & $dotnet publish $proj.FullName -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -o $app
    $exe = Join-Path $app 'ScufDualSense.exe'
    if (-not (Test-Path $exe)) { throw 'the build did not produce ScufDualSense.exe (scroll up for the error)' }
  }

  Step 6 'Starting it with Windows'
  $act = New-ScheduledTaskAction -Execute $exe -WorkingDirectory $app
  $trg = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  $pri = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive
  $set = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 99 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable
  Register-ScheduledTask -TaskName 'ConsoleControllerBridge' -Action $act -Trigger $trg -Principal $pri -Settings $set -Force | Out-Null
  Set-Content -Path (Join-Path $root 'installed.txt') -Value (Get-Date -Format 'yyyy-MM-dd HH:mm') -Encoding ASCII

  Write-Host ''
  if ($needReboot) {
    Write-Host 'DONE. Restart the PC once so the new drivers load. The bridge then starts by itself at sign-in.' -ForegroundColor Green
  } else {
    Start-ScheduledTask -TaskName 'ConsoleControllerBridge'
    Write-Host 'DONE. The bridge is running (PlayStation icon in the tray) and starts by itself at sign-in.' -ForegroundColor Green
  }
  Write-Host 'Put the SCUF Omega in PS5 mode (platform switch under the faceplate) and plug it in or turn it on.'
  Write-Host 'In Steam, set "Disable Steam Input" for a game if you see Xbox prompts.'
  exit 0
} catch {
  Write-Host ''
  Write-Host ('FAILED: ' + $_.Exception.Message) -ForegroundColor Red
  Write-Host ('Log: ' + (Join-Path $root 'setup.log'))
  exit 1
} finally { try { Stop-Transcript | Out-Null } catch {}; if ($Pause) { Read-Host 'Press Enter to close this window' | Out-Null } }
