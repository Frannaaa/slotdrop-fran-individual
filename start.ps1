param([int]$Port = 3000, [switch]$NoBrowser, [switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
if ($Port -lt 1024 -or $Port -gt 65535) { throw 'Choose a port from 1024 to 65535.' }
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'config.js'))) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'config.example.js') -Destination (Join-Path $PSScriptRoot 'config.js')
    Write-Host 'Created config.js. Add your own Project URL and publishable key before browsing.'
}
$pythonCandidates = @()
if ($env:LOCALAPPDATA) {
    $pythonRoot = Join-Path $env:LOCALAPPDATA 'Python'
    if (Test-Path -LiteralPath $pythonRoot) {
        $pythonCandidates += Get-ChildItem -LiteralPath $pythonRoot -Directory -Filter 'pythoncore-*' | Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName 'python.exe' }
    }
    $classicRoot = Join-Path $env:LOCALAPPDATA 'Programs\Python'
    if (Test-Path -LiteralPath $classicRoot) {
        $pythonCandidates += Get-ChildItem -LiteralPath $classicRoot -Directory | Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName 'python.exe' }
    }
}
$python = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $python) {
    $command = Get-Command python -CommandType Application -ErrorAction SilentlyContinue | Where-Object Source -NotLike '*WindowsApps*' | Select-Object -First 1
    if ($command) { $python = $command.Source }
}
if (-not $python) { throw 'Python was not found. Use VS Code Live Server on index.html, or install Python and reopen the terminal.' }
$url = "http://localhost:$Port"
$logDirectory = Join-Path $PSScriptRoot '.local'
$null = New-Item -ItemType Directory -Path $logDirectory -Force
$runId = [guid]::NewGuid().ToString('N')
$stdout = Join-Path $logDirectory "server-$runId.stdout.log"
$stderr = Join-Path $logDirectory "server-$runId.stderr.log"
$server = Start-Process -FilePath $python -ArgumentList @('-m','http.server',"$Port",'--bind','127.0.0.1') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
try {
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        $server.Refresh()
        if ($server.HasExited) { throw "The local server stopped. Check $stderr. The port may already be in use." }
        try {
            $probe = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port/CatalogModel.js" -TimeoutSec 2
            if ($probe.StatusCode -eq 200 -and $probe.Content -match 'export function listProducts') { $ready = $true; break }
        } catch {}
        Start-Sleep -Milliseconds 200
    }
    if (-not $ready) { throw "The individual server did not become ready. Check $stderr." }
    if ($CheckOnly) { Write-Host 'PASS local HTTP server and individual module read. Test server will stop.'; return }
    Write-Host "Serving the individual storefront at $url"
    Write-Host 'Keep this terminal open. Press Ctrl+C to stop.'
    Write-Host 'This server reads the current folder only. It does not start the group project.'
    if (-not $NoBrowser) { Start-Process -FilePath $url }
    while (-not $server.HasExited) { Start-Sleep -Seconds 1; $server.Refresh() }
    if ($server.ExitCode -ne 0) { throw "The server stopped with an error. Check $stderr." }
} finally {
    $server.Refresh()
    if (-not $server.HasExited) { Stop-Process -InputObject $server -Force -ErrorAction SilentlyContinue }
}
