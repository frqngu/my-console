# Keeps the mouse inside the Xbox menu while it is open over a keyboard-and-mouse game.
# It lets go by itself the moment the console stops refreshing the flag file (menu closed, console closed or crashed).
param([string]$Flag)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class Clip {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int l; public int t; public int r; public int b; }
  [DllImport("user32.dll")] public static extern bool ClipCursor(ref RECT rc);
  [DllImport("user32.dll")] public static extern bool ClipCursor(IntPtr rc);
  public static void On(int l, int t, int r, int b) { RECT x = new RECT(); x.l = l; x.t = t; x.r = r; x.b = b; ClipCursor(ref x); }
  public static void Off() { ClipCursor(IntPtr.Zero); }
}
'@
try {
  while ($true) {
    if (-not (Test-Path $Flag)) { break }
    if (((Get-Date) - (Get-Item $Flag).LastWriteTime).TotalSeconds -gt 3) { break }
    $p = (Get-Content $Flag -Raw).Trim().Split(' ')
    if ($p.Count -ge 4) { [Clip]::On([int]$p[0], [int]$p[1], [int]$p[2], [int]$p[3]) }
    Start-Sleep -Milliseconds 100
  }
} finally { [Clip]::Off() }
