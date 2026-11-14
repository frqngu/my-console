# Runs once when the console closes (only if padoff.on exists): tries to switch the controller off. Log: %TEMP%\my-console-padoff.log
$ErrorActionPreference = 'SilentlyContinue'
$logf = Join-Path $env:TEMP 'my-console-padoff.log'
function Log($t) { try { Add-Content -Path $logf -Value ((Get-Date -Format 'HH:mm:ss') + ' ' + $t) } catch {} }
try { Remove-Item $logf -Force } catch {}
Log 'started'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PO {
  [StructLayout(LayoutKind.Sequential)] public struct GP { public ushort b; public byte lt; public byte rt; public short lx; public short ly; public short rx; public short ry; }
  [StructLayout(LayoutKind.Sequential)] public struct ST { public uint pk; public GP g; }
  [DllImport("xinput1_4.dll")] public static extern int XInputGetState(int i, out ST s);
  [DllImport("xinput1_4.dll", EntryPoint = "#103")] public static extern int XInputPowerOffController(int i);
  public static bool Any() { for (int i = 0; i < 4; i++) { ST s; if (XInputGetState(i, out s) == 0) return true; } return false; }
}
'@
Start-Sleep -Milliseconds 400
Log ('controller connected: ' + [PO]::Any())
for ($i = 0; $i -lt 4; $i++) { try { Log ('power off pad ' + $i + ' -> ' + [PO]::XInputPowerOffController($i)) } catch { Log ('power off pad ' + $i + ' failed: ' + $_.Exception.Message) } }
Start-Sleep -Milliseconds 2000
$still = [PO]::Any()
Log ('still connected after power off: ' + $still)
if ($still) {
  # the dongle does not take the command: cut the dongle off for a few seconds instead (needs padoff-setup.bat, run once as administrator)
  try { Set-Content -Path (Join-Path $env:TEMP 'my-console-nowake.txt') -Value (Get-Date).ToString('o') } catch {}
  $r = & schtasks.exe /run /tn MyConsoleDongleOff 2>&1
  Log ('dongle task: ' + ($r -join ' '))
}
