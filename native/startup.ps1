# Runs the programs Windows normally starts at sign-in (Run keys + Startup folders: Armoury Crate, RGB software, etc.). Needed because the console is the Windows shell,
# and only the normal shell (explorer.exe) does this by itself. Log: %TEMP%\my-console-startup.log
$ErrorActionPreference = 'SilentlyContinue'
$logf = Join-Path $env:TEMP 'my-console-startup.log'
function Log($t) { try { Add-Content -Path $logf -Value ((Get-Date -Format 'HH:mm:ss') + ' ' + $t) } catch {} }
try { Remove-Item $logf -Force } catch {}
Log 'started'
$skip = @('MyConsole', 'MyConsoleWake')
function Approved($sub, $name) {
  foreach ($root in @('HKCU:', 'HKLM:')) {
    $p = "$root\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\$sub"
    $v = (Get-ItemProperty -Path $p -Name $name -ErrorAction SilentlyContinue).$name
    if ($v -is [byte[]] -and $v.Length -gt 0 -and (($v[0] -band 1) -eq 1)) { return $false }
  }
  return $true
}
function Running($exe) { $n = [IO.Path]::GetFileNameWithoutExtension($exe); if (-not $n) { return $false }; return [bool](Get-Process -Name $n -ErrorAction SilentlyContinue) }
function Launch($name, $cmd) {
  if (-not $cmd) { return }
  $cmd = [Environment]::ExpandEnvironmentVariables($cmd.Trim())
  $exe = $null; $args2 = ''
  if ($cmd.StartsWith('"')) { $i = $cmd.IndexOf('"', 1); if ($i -gt 0) { $exe = $cmd.Substring(1, $i - 1); $args2 = $cmd.Substring($i + 1).Trim() } }
  elseif ($cmd -match '^(.*?\.(exe|bat|cmd|lnk|vbs))(\s+(.*))?$') { $exe = $Matches[1]; $args2 = $Matches[4] }
  else { $exe = $cmd }
  if (-not $exe -or -not (Test-Path $exe)) { Log ('missing: ' + $name + ' -> ' + $cmd); return }
  if ($exe -match '\.exe$' -and (Running $exe)) { Log ('already running: ' + $name); return }
  try { if ($args2) { Start-Process -FilePath $exe -ArgumentList $args2 -WorkingDirectory (Split-Path $exe) } else { Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe) }; Log ('started: ' + $name + ' (' + $exe + ')') } catch { Log ('failed: ' + $name + ': ' + $_.Exception.Message) }
}
foreach ($k in @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run', 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run')) {
  $props = Get-ItemProperty -Path $k -ErrorAction SilentlyContinue
  if (-not $props) { continue }
  foreach ($p in $props.PSObject.Properties) {
    if ($p.Name -like 'PS*') { continue }
    if ($skip -contains $p.Name) { continue }
    if (-not (Approved 'Run' $p.Name)) { Log ('disabled in Task Manager: ' + $p.Name); continue }
    Launch $p.Name ([string]$p.Value)
  }
}
foreach ($d in @([Environment]::GetFolderPath('Startup'), [Environment]::GetFolderPath('CommonStartup'))) {
  if (-not $d -or -not (Test-Path $d)) { continue }
  foreach ($f in Get-ChildItem -Path $d -File -ErrorAction SilentlyContinue) {
    if ($f.Name -ieq 'desktop.ini' -or $f.BaseName -like 'MyConsole*') { continue }
    if (-not (Approved 'StartupFolder' $f.Name)) { Log ('disabled in Task Manager: ' + $f.Name); continue }
    try { Start-Process -FilePath $f.FullName; Log ('started: ' + $f.Name) } catch { Log ('failed: ' + $f.Name) }
  }
}
Log 'done'
