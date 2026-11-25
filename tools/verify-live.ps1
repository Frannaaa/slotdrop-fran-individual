# Verifies real, anonymous REST reads. Never uses or prints a secret key.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $projectRoot 'config.js'
if (-not (Test-Path -LiteralPath $configPath)) { throw 'Create config.js from config.example.js first.' }
$configText = Get-Content -LiteralPath $configPath -Raw
$urlMatch = [regex]::Match($configText, 'export\s+const\s+SUPABASE_URL\s*=\s*["'']([^"'']+)["'']')
$keyMatch = [regex]::Match($configText, 'export\s+const\s+SUPABASE_PUBLISHABLE_KEY\s*=\s*["'']([^"'']+)["'']')
if (-not $urlMatch.Success -or -not $keyMatch.Success) { throw 'Both exported config values are required.' }
$projectUrl = $urlMatch.Groups[1].Value.TrimEnd('/')
$publishableKey = $keyMatch.Groups[1].Value
if ($projectUrl -notmatch '^https://[a-z0-9-]+\.supabase\.co$' -or $projectUrl -match 'YOUR-PROJECT') { throw 'Use your real personal Supabase Project URL.' }
if ($publishableKey.StartsWith('sb_secret_') -or $publishableKey.EndsWith('...')) { throw 'Use only a publishable key or a legacy anon key.' }
if (-not $publishableKey.StartsWith('sb_publishable_')) {
    try {
        $payload = $publishableKey.Split('.')[1].Replace('-','+').Replace('_','/')
        $payload = $payload.PadRight([int]([math]::Ceiling($payload.Length / 4.0) * 4), '=')
        $claims = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json
        if ($claims.role -ne 'anon') { throw 'Not an anon key.' }
    } catch { throw 'That is not a publishable key or legacy anon key. No request was sent.' }
}
$headers = @{ apikey = $publishableKey; Accept = 'application/json' }
function Read-Products([string]$queryString) {
    $answer = Invoke-WebRequest -UseBasicParsing -Uri "$projectUrl/rest/v1/products?$queryString" -Headers $headers -TimeoutSec 25
    if ([int]$answer.StatusCode -ne 200) { throw 'Product read did not return HTTP 200.' }
    return ,@($answer.Content | ConvertFrom-Json)
}
$rows = Read-Products 'select=id,sku,name,category,price,stock&order=id.asc'
if ($rows.Count -lt 8) { throw 'Expected at least eight products.' }
if (-not ($rows | Where-Object stock -eq 0)) { throw 'The sold-out row is missing.' }
if (-not ($rows | Where-Object { $_.stock -gt 0 -and $_.stock -le 3 })) { throw 'The low-stock row is missing.' }
$filteredRows = Read-Products 'select=id,name,price,stock&name=ilike.*Laro*'
if ($filteredRows.Count -ne 2) { throw 'The narrowed Laro query did not return the two seeded rows.' }
$missing = Read-Products 'select=id&id=eq.999999'
if ($missing.Count -ne 0) { throw 'Choose a different unknown id for the empty-state check.' }
$detail = Read-Products ("select=id,name,price,stock&id=eq." + $rows[0].id)
if ($detail.Count -ne 1) { throw 'Detail did not return exactly one row.' }
foreach ($table in @('orders','order_items')) {
    $refused = $false
    try { $null = Invoke-WebRequest -UseBasicParsing -Uri "$projectUrl/rest/v1/$($table)?select=id" -Headers $headers -TimeoutSec 25 }
    catch {
        if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -in @(401,403)) { $refused = $true }
        else { throw 'Order-table check failed for a reason other than permission denial.' }
    }
    if (-not $refused) { throw "Anonymous $table read was not refused. Review grants and RLS." }
}
$evidence = [ordered]@{
    checkedAt = [DateTime]::UtcNow.ToString('o')
    environment = 'Live personal Supabase REST API, anonymous browser-safe key'
    productCount = $rows.Count
    narrowedCount = $filteredRows.Count
    unknownIdCount = $missing.Count
    detailCount = $detail.Count
    orderTablesRefused = $true
    note = 'This verifies read behavior, not the required DevTools screenshots or voice recording.'
}
$destination = Join-Path $projectRoot 'docs\live-checks.json'
$evidence | ConvertTo-Json | Set-Content -LiteralPath $destination -Encoding UTF8
Write-Host 'Live checks passed: catalog, real filter, detail, empty result and protected order tables.'
Write-Host "Saved evidence to $destination. No key was saved in the evidence."
