# Runs with administrator rights (through the task made by padoff-setup.bat): switches the controller's dongle off for a while, then on again.
$ErrorActionPreference = 'SilentlyContinue'
$logf = Join-Path $env:TEMP 'my-console-padoff.log'
function Log($t) { try { Add-Content -Path $logf -Value ((Get-Date -Format 'HH:mm:ss') + ' [admin] ' + $t) } catch {} }
$all = @(Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -like 'USB\VID_*' })
foreach ($d in $all) { Log ('usb: ' + $d.InstanceId + ' | ' + $d.FriendlyName + ' | ' + $d.Manufacturer + ' | ' + $d.Class) }
$pick = @($all | Where-Object { $_.InstanceId -notmatch '&MI_' -and (($_.FriendlyName + ' ' + $_.Manufacturer) -match 'SCUF|Corsair|Xbox') })
Log ('chosen: ' + (($pick | ForEach-Object { $_.InstanceId }) -join ', '))
foreach ($d in $pick) { try { Disable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction Stop; Log ('disabled ' + $d.InstanceId) } catch { Log ('disable failed: ' + $_.Exception.Message) } }
Start-Sleep -Seconds 12
foreach ($d in $pick) { try { Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction Stop; Log ('enabled ' + $d.InstanceId) } catch { Log ('enable failed: ' + $_.Exception.Message) } }
