param(
  [string]$Port = '4173'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$docsRoot = Join-Path $repoRoot 'docs'
$tempServer = Join-Path $env:TEMP 'freevibes-docs-server.js'
$tempCheck = Join-Path $docsRoot '__audio-check.html'
$desktopShot = Join-Path $env:TEMP 'freevibes-docs-desktop.png'
$mobileShot = Join-Path $env:TEMP 'freevibes-docs-mobile.png'
$serverStdOut = Join-Path $env:TEMP 'freevibes-docs-server.out.log'
$serverStdErr = Join-Path $env:TEMP 'freevibes-docs-server.err.log'
$rootForNode = $docsRoot.Replace('\', '\\')

$serverScript = @"
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = '$rootForNode';
const port = $Port;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.md': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:' + port);
  const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filePath = path.normalize(path.join(root, rel));

  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }

    const contentType = mime[path.extname(filePath)] || 'application/octet-stream';
    const total = data.length;
    const range = req.headers.range;

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);

      if (match) {
        const start = match[1] ? Number.parseInt(match[1], 10) : 0;
        const end = match[2] ? Number.parseInt(match[2], 10) : total - 1;
        const chunk = data.subarray(start, end + 1);

        res.writeHead(206, {
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
          'Content-Length': chunk.length,
        });
        res.end(chunk);
        return;
      }
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': total,
    });
    res.end(data);
  });
}).listen(port, '127.0.0.1');
"@

$checkHtml = @"
<!doctype html>
<html>
  <body>
    <pre id="status">pending</pre>
    <audio
      id="player"
      preload="auto"
      muted
      src="http://127.0.0.1:$Port/assets/audio/jazz-at-the-park.ogg"
    ></audio>
    <script>
      const status = document.getElementById('status');
      const audio = document.getElementById('player');
      let duration = 0;
      let ended = false;
      let canplay = false;

      function render() {
        status.textContent =
          'duration=' +
          duration.toFixed(2) +
          '; ended=' +
          ended +
          '; canplay=' +
          canplay +
          '; currentTime=' +
          audio.currentTime.toFixed(2);
      }

      audio.addEventListener('loadedmetadata', () => {
        duration = audio.duration;
        render();
      });

      audio.addEventListener(
        'canplay',
        async () => {
          canplay = true;
          if (Number.isFinite(audio.duration) && audio.duration > 1) {
            audio.currentTime = Math.max(audio.duration - 0.75, 0);
          }

          try {
            await audio.play();
          } catch (error) {
            status.textContent =
              'play-error=' + (error && error.message ? error.message : String(error));
            return;
          }

          render();
        },
        { once: true },
      );

      audio.addEventListener('ended', () => {
        ended = true;
        render();
      });

      setTimeout(render, 18000);
    </script>
  </body>
</html>
"@

Set-Content -Path $tempServer -Value $serverScript -Encoding UTF8
Set-Content -Path $tempCheck -Value $checkHtml -Encoding UTF8

$edgeCandidates = @(
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
)

$browser = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $browser) {
  throw 'No headless-capable browser found. Install Edge or Chrome to validate the public showcase.'
}

$server = Start-Process node -ArgumentList $tempServer -PassThru -WindowStyle Hidden -RedirectStandardOutput $serverStdOut -RedirectStandardError $serverStdErr

try {
  $listening = $false

  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 500

    try {
      Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing | Out-Null
      $listening = $true
      break
    } catch {
      if ($server.HasExited) {
        break
      }
    }
  }

  if (-not $listening) {
    $stdOut = if (Test-Path $serverStdOut) { Get-Content $serverStdOut -Raw } else { '' }
    $stdErr = if (Test-Path $serverStdErr) { Get-Content $serverStdErr -Raw } else { '' }
    throw "Static showcase server did not start correctly.`nSTDOUT:`n$stdOut`nSTDERR:`n$stdErr"
  }

  $checks = @(
    '/',
    '/styles.css',
    '/app.js',
    '/assets/audio/jazz-at-the-park.ogg'
  ) | ForEach-Object {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port$_" -UseBasicParsing
    [pscustomobject]@{
      path = $_
      status = $response.StatusCode
      contentType = $response.Headers['Content-Type']
      contentLength = $response.Headers['Content-Length']
    }
  }

  $checkUri = "http://127.0.0.1:$Port/__audio-check.html"
  $domCommand = '"' + $browser + '" --headless --disable-gpu --autoplay-policy=no-user-gesture-required --virtual-time-budget=22000 --dump-dom "' + $checkUri + '" 2>&1'
  $dom = cmd.exe /c $domCommand
  $audioStatusMatch = [regex]::Match(($dom | Out-String), '<pre id="status">(?<status>.*?)</pre>')
  & $browser --headless --disable-gpu --window-size=1440,900 --screenshot=$desktopShot "http://127.0.0.1:$Port/" | Out-Null
  & $browser --headless --disable-gpu --window-size=390,844 --screenshot=$mobileShot "http://127.0.0.1:$Port/" | Out-Null

  [pscustomobject]@{
    checks = $checks
    audioStatus = if ($audioStatusMatch.Success) { $audioStatusMatch.Groups['status'].Value } else { $null }
    desktopShot = $desktopShot
    mobileShot = $mobileShot
    browser = $browser
  } | ConvertTo-Json -Depth 6
}
finally {
  if (Test-Path $tempCheck) {
    Remove-Item $tempCheck -Force
  }

  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}
