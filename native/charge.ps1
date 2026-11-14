# Separate little watcher: asks Windows whether the controller's battery is charging (the XInput battery report cannot say). Prints "chg <Status> <percent>" whenever it changes.
$ErrorActionPreference = 'SilentlyContinue'
try { [void][Windows.Gaming.Input.Gamepad, Windows.Gaming.Input, ContentType = WindowsRuntime] } catch {}
$last = ''
while ($true) {
  try {
    $out = 'chg None -1'
    $gp = [Windows.Gaming.Input.Gamepad]::Gamepads
    if ($gp -ne $null -and $gp.Count -gt 0) {
      $r = $gp[0].TryGetBatteryReport()
      if ($r -ne $null) {
        $full = 0.0; $rem = 0.0
        if ($r.FullChargeCapacityInMilliwattHours -ne $null) { $full = [double]$r.FullChargeCapacityInMilliwattHours }
        if ($r.RemainingCapacityInMilliwattHours -ne $null) { $rem = [double]$r.RemainingCapacityInMilliwattHours }
        $pct = -1; if ($full -gt 0) { $pct = [int][math]::Round(100.0 * $rem / $full) }
        $out = 'chg ' + $r.Status.ToString() + ' ' + $pct
      }
    }
    if ($out -ne $last) { $last = $out; [Console]::Out.WriteLine($out); [Console]::Out.Flush() }
  } catch {}
  Start-Sleep -Seconds 3
}
