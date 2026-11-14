# Fetches the four support files go-librespot needs on Windows (they come from MSYS2's free package repository) and puts them next to go-librespot.exe
param([string]$Dest)
$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$base = 'https://repo.msys2.org/mingw/mingw64/'
$tmp = Join-Path $env:TEMP ('snd-libs-' + [guid]::NewGuid().ToString('N').Substring(0, 8)); New-Item -ItemType Directory -Path $tmp | Out-Null
Write-Host 'Reading the package list...'
$idx = (Invoke-WebRequest $base -UseBasicParsing -Headers @{ 'User-Agent' = 'my-console' }).Content
$names = [regex]::Matches($idx, 'href="(mingw-w64-x86_64-[^"]+-any\.pkg\.tar\.zst)"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
function Latest($pkg) {
  $pre = 'mingw-w64-x86_64-' + $pkg + '-'; $best = $null; $bv = $null
  foreach ($n in $names) {
    if (-not $n.StartsWith($pre)) { continue }
    $rest = $n.Substring($pre.Length); if ($rest -notmatch '^\d') { continue }
    $m = [regex]::Match($rest, '^(\d+(?:\.\d+)*)'); $parts = $m.Groups[1].Value.Split('.')
    while ($parts.Count -lt 2) { $parts += '0' }; if ($parts.Count -gt 4) { $parts = $parts[0..3] }
    try { $v = [version]($parts -join '.') } catch { continue }
    if ($null -eq $bv -or $v -gt $bv) { $bv = $v; $best = $n }
  }
  return $best
}
$zst = $null
& tar --help 2>$null | Out-Null
$test = Join-Path $tmp 'probe'; $haveTarZst = $true
function Unpack($file, $to) {
  New-Item -ItemType Directory -Force -Path $to | Out-Null
  & tar -xf $file -C $to 2>$null
  if ($LASTEXITCODE -ne 0) {
    if (-not $script:zstdExe) {
      Write-Host 'Getting a small unzip helper (zstd)...'
      $r = Invoke-RestMethod 'https://api.github.com/repos/facebook/zstd/releases/latest' -Headers @{ 'User-Agent' = 'my-console' }
      $a = $r.assets | Where-Object { $_.name -match 'win64\.zip$' } | Select-Object -First 1
      $zf = Join-Path $tmp 'zstd.zip'; Invoke-WebRequest $a.browser_download_url -OutFile $zf -UseBasicParsing; Expand-Archive $zf -DestinationPath (Join-Path $tmp 'zstd') -Force
      $script:zstdExe = (Get-ChildItem (Join-Path $tmp 'zstd') -Recurse -Filter zstd.exe | Select-Object -First 1).FullName
    }
    $tarf = $file -replace '\.zst$', ''; & $script:zstdExe -d -q -f $file -o $tarf; & tar -xf $tarf -C $to
  }
}
$script:zstdExe = $null
foreach ($p in 'flac', 'libogg', 'libvorbis', 'mpg123', 'gcc-libs', 'libwinpthread', 'libiconv', 'gettext-runtime', 'zlib') {
  $n = Latest $p; if (-not $n) { Write-Host ('  (no package named ' + $p + ', skipping)'); continue }
  Write-Host ('Downloading ' + $n)
  $f = Join-Path $tmp $n; Invoke-WebRequest ($base + $n) -OutFile $f -UseBasicParsing
  Unpack $f (Join-Path $tmp ('x-' + $p))
}
$count = 0
Get-ChildItem $tmp -Recurse -Filter *.dll | Where-Object { $_.FullName -match '[\\/]mingw64[\\/]bin[\\/]' } | ForEach-Object { Copy-Item $_.FullName (Join-Path $Dest $_.Name) -Force; $count++ }
Write-Host ('Copied ' + $count + ' support files.')
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
if ($count -lt 4) { Write-Host 'Too few files were found.'; exit 1 }
