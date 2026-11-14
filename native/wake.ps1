# Starts My Console when an Xbox controller is switched on (or plugged in) while the console is not running.
# It only looks at "was off, now on", so a controller that is already on when Windows starts never triggers it (autostart handles that).
param([string]$Root)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class XI {
  [StructLayout(LayoutKind.Sequential)] public struct GP { public ushort b; public byte lt; public byte rt; public short lx; public short ly; public short rx; public short ry; }
  [StructLayout(LayoutKind.Sequential)] public struct ST { public uint pk; public GP g; }
  [DllImport("xinput1_4.dll")] public static extern int XInputGetState(int i, out ST s);
  [DllImport("xinput1_4.dll", EntryPoint = "#100")] public static extern int XInputGetStateEx(int i, out ST s);   // the same, but it also reports the Xbox (guide) button
  public static bool Guide() { for (int i = 0; i < 4; i++) { ST s; if (XInputGetStateEx(i, out s) == 0 && (s.g.b & 0x0400) != 0) return true; } return false; }
  public static bool Any() { for (int i = 0; i < 4; i++) { ST s; if (XInputGetState(i, out s) == 0) return true; } return false; }
}
'@
$logf = Join-Path $env:TEMP 'my-console-wake.log'
function Log($t) { try { Add-Content -Path $logf -Value ((Get-Date -Format 'HH:mm:ss') + ' ' + $t) } catch {} }
function Running {   # quick check (a few milliseconds): is an Electron from this folder already running?
  try { foreach ($p in [System.Diagnostics.Process]::GetProcessesByName('electron')) { try { if ($p.MainModule.FileName.ToLower().StartsWith($Root.ToLower())) { return $true } } catch { return $true } } return $false }
  catch { return [bool](Get-CimInstance Win32_Process -Filter "Name='electron.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.ToLower().Contains($Root.ToLower()) }) }
}
function Launch($why) {
  if (Running) { Log ($why + ': console already running') }
  else { Log ($why + ': starting the console'); Start-Process -FilePath (Join-Path $Root 'node_modules\electron\dist\electron.exe') -ArgumentList ('"' + $Root + '"') -WorkingDirectory $Root }
}
function GuideNow { try { return [XI]::Guide() } catch { Log ('guide read failed: ' + $_.Exception.Message); return $false } }
try { Remove-Item $logf -Force } catch {}
Log ('watcher started, controller on: ' + [XI]::Any())
$was = [XI]::Any(); $held = 0; $armed = -not (GuideNow)
while ($true) {
  Start-Sleep -Milliseconds 40
  $now = [XI]::Any()
  if ($now -ne $was) { Log ('controller ' + $(if ($now) { 'on' } else { 'off' })) }
  $quiet = $false; try { $nf = Join-Path $env:TEMP 'my-console-nowake.txt'; if ((Test-Path $nf) -and ((Get-Date) - (Get-Item $nf).LastWriteTime).TotalSeconds -lt 60) { $quiet = $true } } catch {}   # just closed the console and switched the dongle off and on: that is not a reason to open it again
  if ($now -and -not $was -and $quiet) { Log 'controller on again after closing the console: ignored' }
  elseif ($now -and -not $was) { Start-Sleep -Milliseconds 120; Launch 'controller switched on' }
  # Xbox button held for about half a second while the console is closed opens it (also right after closing it, which is what a controller that stays plugged in needs).
  # The button must have been let go once first, so a hold that was already down when the console closed does not open it again.
  $g = $now -and (GuideNow)
  if (-not $g) { $armed = $true; $held = 0 } elseif ($armed) { $held++ }
  if ($held -eq 10) { Launch 'xbox button held'; $armed = $false; $held = 0 }
  $was = $now
}
