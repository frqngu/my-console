param([string]$Procs, [string]$Title, [int]$Max = 150)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class MI {
  [StructLayout(LayoutKind.Sequential)] public struct PT { public int X; public int Y; }
  [StructLayout(LayoutKind.Sequential)] public struct RC { public int L; public int T; public int R; public int B; }
  public delegate bool EnumProc(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int k);
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out PT p);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RC r);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr p);
  public static List<long[]> Wins() {
    List<long[]> res = new List<long[]>();
    EnumWindows(delegate (IntPtr h, IntPtr p) {
      if (!IsWindowVisible(h) || IsIconic(h)) return true;
      RC r; if (!GetWindowRect(h, out r)) return true;
      if (r.R - r.L < 300 || r.B - r.T < 200 || r.L < -20000) return true;
      uint pid; GetWindowThreadProcessId(h, out pid);
      res.Add(new long[] { (long)pid, r.L, r.T, r.R, r.B });
      return true;
    }, IntPtr.Zero);
    return res;
  }
}
'@
[void][MI]::SetProcessDPIAware()
# Windows' own text recognition: finds the words on a picture of the launcher and where they are (the launchers expose nothing else)
$ocrCode = @'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
[void][Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
[void][Windows.Media.Ocr.OcrResult, Windows.Foundation, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.SoftwareBitmap, Windows.Foundation, ContentType = WindowsRuntime]
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.IsGenericType -and $_.GetParameters()[0].ParameterType.GetGenericTypeDefinition().Name -eq 'IAsyncOperation`1' })[0]
function Await($op, $type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); [void]$t.Wait(-1); return $t.Result }
function Snap($l, $t, $w, $h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $gfx = [System.Drawing.Graphics]::FromImage($bmp); $gfx.CopyFromScreen($l, $t, 0, 0, $bmp.Size); $gfx.Dispose()
  return $bmp
}
function Get-Words($bmp, $l, $t) {
  $out = New-Object System.Collections.ArrayList
  $ms = New-Object System.IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $ras = [System.IO.WindowsRuntimeStreamExtensions]::AsRandomAccessStream($ms)
  $dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($ras)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $sb = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $res = Await ($engine.RecognizeAsync($sb)) ([Windows.Media.Ocr.OcrResult])
  $ms.Dispose()
  foreach ($ln in $res.Lines) { foreach ($wd in $ln.Words) {
    $r = $wd.BoundingRect
    [void]$out.Add(@{ t = $wd.Text.Trim().ToLower(); b = @(($l + $r.X - 14), ($t + $r.Y - 12), ($l + $r.X + $r.Width + 14), ($t + $r.Y + $r.Height + 12)) })
  } }
  return $out
}
function Find-Dialog($words) {
  $cw = $null; $gw = $null
  foreach ($x in $words) {
    if ($x.t -match '^(cancel|decline)$') { if (-not $cw) { $cw = $x.b } }
    elseif ($x.t -match '^(install|confirm|continue|download|accept|next)$') { $gw = $x.b }
  }
  if ($cw -and $gw -and ([math]::Abs($cw[1] - $gw[1]) -lt 90)) { return @($cw, $gw) }
  return $null
}
'@
Invoke-Expression $ocrCode
$ocrOk = ($engine -and $asTask)
$sync = [hashtable]::Synchronized(@{ open = $false; c = $null; g = $null; stop = $false; dbg = $null; ocr = $ocrCode; names = ($Procs.Split(',') | ForEach-Object { $_.Trim().ToLower() }) })
# the slow part (reading the screen) runs on its own thread, so the mouse can be watched without any gaps
$scan = {
  $ErrorActionPreference = 'SilentlyContinue'
  . ([scriptblock]::Create($sync.ocr))
  $pidName = @{}
  while (-not $sync.stop) {
    $found = $false
    try {
      foreach ($w in [MI]::Wins()) {
        $wp = [int]$w[0]
        if (-not $pidName.ContainsKey($wp)) { $pidName[$wp] = (Get-Process -Id $wp).ProcessName.ToLower() }
        if ($sync.names -notcontains $pidName[$wp]) { continue }
        $l = [int]$w[1]; $t = [int]$w[2]
        $bmp = Snap $l $t ([int]($w[3] - $w[1])) ([int]($w[4] - $w[2]))
        $words = Get-Words $bmp $l $t; $bmp.Dispose()
        $hit = Find-Dialog $words
        if ($hit) { $sync.c = $hit[0]; $sync.g = $hit[1]; $found = $true; $sync.dbg = ($pidName[$wp] + ' ocr dialog found in window ' + $l + ',' + $t + ' ' + ($w[3]-$w[1]) + 'x' + ($w[4]-$w[2])); break }
        else { $sync.dbg = ($pidName[$wp] + ' ocr ok, ' + $words.Count + ' words, no dialog') }
      }
    } catch { $sync.dbg = ('scan error: ' + $_.Exception.Message) }
    $sync.open = $found
    Start-Sleep -Milliseconds 60
  }
}
$rs = [runspacefactory]::CreateRunspace(); $rs.ApartmentState = 'STA'; $rs.Open(); $rs.SessionStateProxy.SetVariable('sync', $sync)
$ps = [powershell]::Create(); $ps.Runspace = $rs; if ($ocrOk) { [void]$ps.AddScript($scan.ToString()); [void]$ps.BeginInvoke() } else { Write-Output 'dbg no text recognition available' }
$pn = @{}; $stC = $null; $stG = $null; $stTry = 0; $stAt = Get-Date; $trk = [IntPtr]::Zero; $isSteam = ($Procs -match 'steam'); $was = $false; $down = $false; $lost = $null; $lastDbg = Get-Date
$end = (Get-Date).AddSeconds($Max)
function WaitUp() { $n = 0; while (([MI]::GetAsyncKeyState(1) -band 0x8000) -ne 0 -and $n -lt 150) { Start-Sleep -Milliseconds 10; $n++ }; Start-Sleep -Milliseconds 90 }   # let the launcher get the whole click (press and release) before the console takes the screen back
function Pt() { $p = New-Object MI+PT; [void][MI]::GetCursorPos([ref]$p); return $p }
function Inside($p, $b) { return ($b -and $p.X -ge $b[0] -and $p.X -le $b[2] -and $p.Y -ge $b[1] -and $p.Y -le $b[3]) }
while ((Get-Date) -lt $end) {
  $open = [bool]$sync.open
  if ($sync.dbg -and ((Get-Date) - $lastDbg).TotalSeconds -gt 4) { Write-Output ('dbg ' + $sync.dbg); $lastDbg = Get-Date }
  if ($open -and -not $was) { Write-Output 'open'; $was = $true }
  elseif ($was -and -not $open) { if (-not $lost) { $lost = Get-Date } elseif (((Get-Date) - $lost).TotalMilliseconds -gt 2500) { Write-Output 'closed'; break } }
  if ($open) { $lost = $null }
  $fw = [MI]::GetForegroundWindow(); $fp = [uint32]0; [void][MI]::GetWindowThreadProcessId($fw, [ref]$fp)
  if (-not $pn.ContainsKey($fp)) { $pr = Get-Process -Id $fp -ErrorAction SilentlyContinue; $pn[$fp] = $(if ($pr) { $pr.ProcessName.ToLower() } else { '' }) }
  $fn = $pn[$fp]; $inL = ($sync.names -contains $fn)
  if ($isSteam) {   # Steam's confirm box is a small window of its own: when that window disappears the box was closed, whatever button did it
    if ($inL -and $fw -ne $trk) { $rr = New-Object MI+RC; [void][MI]::GetWindowRect($fw, [ref]$rr); $ww = $rr.R - $rr.L; $hh = $rr.B - $rr.T; if ($ww -gt 250 -and $hh -gt 150 -and $ww -lt 1000 -and $hh -lt 800) { $trk = $fw; Write-Output ('dbg steam box window ' + $ww + 'x' + $hh); $stC = $null; $stG = $null; $stTry = 0; $stAt = (Get-Date).AddSeconds(-1) } }
    if ($trk -ne [IntPtr]::Zero -and -not $stC -and $stTry -lt 5 -and $ocrOk -and ((Get-Date) - $stAt).TotalMilliseconds -gt 350) {   # read the box's buttons ahead of time, so Cancel can be answered the instant it is pressed
      $stAt = Get-Date; $stTry++
      try { $r2 = New-Object MI+RC; [void][MI]::GetWindowRect($trk, [ref]$r2); $b2 = Snap $r2.L $r2.T ($r2.R - $r2.L) ($r2.B - $r2.T); $w2 = Get-Words $b2 $r2.L $r2.T; $b2.Dispose(); $h2 = Find-Dialog $w2
        if ($h2) { $stC = $h2[0]; $stG = $h2[1]; Write-Output ('dbg steam box buttons read, cancel=' + ($stC -join ',')) } else { Write-Output ('dbg steam box words: ' + (($w2 | ForEach-Object { $_.t }) -join ' ')) } } catch {}
    }
    if ($trk -ne [IntPtr]::Zero -and -not [MI]::IsWindowVisible($trk)) { Write-Output 'dbg steam box window gone'; Write-Output 'closed'; break }
  }
  if (([MI]::GetAsyncKeyState(27) -band 0x8000) -ne 0 -and $inL) { Write-Output 'cancel'; break }
  $ks = [MI]::GetAsyncKeyState(1); $l = (($ks -band 0x8000) -ne 0) -or (($ks -band 1) -ne 0)   # also catches a click that was too quick for one pass of this loop
  if ($l -and -not $down) { Write-Output ('dbg click at ' + (Pt).X + ',' + (Pt).Y + ' in ' + $fn + ' launcher=' + $inL + ' open=' + $open) }
  if ($l -and -not $down -and $inL) {
    $p = Pt; $c = $sync.c; $g = $sync.g; $open = [bool]$sync.open
    if (-not $open -and $stC -and $trk -ne [IntPtr]::Zero) { $c = $stC; $g = $stG; $open = $true }
    Write-Output ('dbg click boxes cancel=' + ($sync.c -join ',') + ' go=' + ($sync.g -join ','))
    if ($open -and (Inside $p $c)) { Write-Output 'precancel'; WaitUp; Write-Output 'cancel'; break }
    if ($open -and (Inside $p $g)) { WaitUp; Write-Output 'confirm' }
    elseif ($ocrOk) {
      # the box was not read yet when you clicked (or has just closed): take a picture of the window right now, before the click does anything, then see which word you clicked
      # first only a small picture around the mouse (reads in a fraction of the time), the whole window only if that finds nothing
      $res = $null; $cl = [int]($p.X - 170); $ct = [int]($p.Y - 50)
      try { $bq = Snap $cl $ct 340 100; $wq = Get-Words $bq $cl $ct; $bq.Dispose(); Write-Output ('dbg crop words: ' + (($wq | ForEach-Object { $_.t }) -join ' ')); foreach ($x in $wq) { if (Inside $p $x.b) { if ($x.t -match '^(cancel|decline)$') { $res = 'cancel' } elseif ($x.t -match '^(install|confirm|continue|download|accept|next)$') { $res = 'confirm' } } } } catch {}
      if ($res -eq 'cancel') { Write-Output 'precancel'; WaitUp; Write-Output 'cancel'; $sync.stop = $true; Write-Output 'end'; exit }
      if ($res -eq 'confirm') { WaitUp; Write-Output 'confirm' }
      $rc = New-Object MI+RC; [void][MI]::GetWindowRect($fw, [ref]$rc)
      $bw = $rc.R - $rc.L; $bh = $rc.B - $rc.T
      if (-not $res -and $bw -gt 200 -and $bh -gt 150 -and $bw -lt 6000) {
        $bmp = Snap $rc.L $rc.T $bw $bh
        $words = Get-Words $bmp $rc.L $rc.T; $bmp.Dispose()
        foreach ($x in $words) { if (Inside $p $x.b) {
          if ($x.t -match '^(cancel|decline)$') { Write-Output 'precancel'; WaitUp; Write-Output 'cancel'; $sync.stop = $true; Write-Output 'end'; exit }
          if ($x.t -match '^(install|confirm|continue|download|accept|next)$') { WaitUp; Write-Output 'confirm' }
        } }
      }
    }
  }
  $down = $l
  Start-Sleep -Milliseconds 10
}
$sync.stop = $true
Write-Output 'end'
