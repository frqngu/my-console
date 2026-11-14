# Keeps running so showing and hiding the Discord window is instant (no start-up each time).
Add-Type 'using System;using System.Runtime.InteropServices;public class DW{[DllImport("user32.dll")]public static extern bool SetProcessDPIAware();[DllImport("user32.dll")]public static extern bool ShowWindow(IntPtr h,int c);[DllImport("user32.dll")]public static extern bool SetWindowPos(IntPtr h,IntPtr a,int x,int y,int w,int hh,uint f);[DllImport("user32.dll")]public static extern bool SetForegroundWindow(IntPtr h);[DllImport("user32.dll")]public static extern bool PostMessage(IntPtr h,uint m,IntPtr w,IntPtr l);[DllImport("user32.dll")]public static extern void keybd_event(byte b,byte s,uint f,UIntPtr e);[DllImport("user32.dll")]public static extern bool BringWindowToTop(IntPtr h);[DllImport("user32.dll")]public static extern bool SetCursorPos(int x,int y);}'
[void][DW]::SetProcessDPIAware()
function Find-Disc { Get-Process Discord -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1 }
[Console]::Out.WriteLine('ready'); [Console]::Out.Flush()
while ($true) {
  $line = [Console]::In.ReadLine(); if ($line -eq $null) { break }
  $a = $line.Trim().Split(' ')
  try {
    if ($a[0] -eq 'show' -and $a.Length -ge 5) {
      $x = [int]$a[1]; $y = [int]$a[2]; $w = [int]$a[3]; $hh = [int]$a[4]; $p = $null
      for ($i = 0; $i -lt 100; $i++) { $p = Find-Disc; if ($p) { break }; Start-Sleep -Milliseconds 30 }
      if ($p) {
        $h = [IntPtr]$p.MainWindowHandle
        [void][DW]::ShowWindow($h, 9)
        [void][DW]::SetWindowPos($h, [IntPtr]::Zero, $x + 60, $y + 60, 900, 600, 0x0040)
        [void][DW]::ShowWindow($h, 3)
        [DW]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [DW]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
        [void][DW]::BringWindowToTop($h); [void][DW]::SetForegroundWindow($h)
        [void][DW]::SetCursorPos($x + [int]($w / 2), $y + [int]($hh / 2))
        [Console]::Out.WriteLine('shown'); [Console]::Out.Flush()
      } else { [Console]::Out.WriteLine('nowindow'); [Console]::Out.Flush() }
    } elseif ($a[0] -eq 'hide') {
      $p = Find-Disc
      if ($p) { [void][DW]::PostMessage([IntPtr]$p.MainWindowHandle, 0x10, [IntPtr]::Zero, [IntPtr]::Zero) }
    }
  } catch { [Console]::Out.WriteLine('error ' + $_.Exception.Message); [Console]::Out.Flush() }
}
