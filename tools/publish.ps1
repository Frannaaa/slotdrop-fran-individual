param([string]$Repository = 'Frannaaa/slotdrop-fran-individual')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if ($Repository -notmatch '^Frannaaa/[A-Za-z0-9_.-]+$') { throw 'Use a repository under your own Frannaaa account.' }
foreach ($name in @('docs\network-list.png','docs\console-error.png')) {
    if (-not (Test-Path -LiteralPath $name)) { throw "Missing genuine DevTools evidence: $name" }
    $bytes = [IO.File]::ReadAllBytes((Join-Path $projectRoot $name))
    if ($bytes.Length -lt 1000 -or [BitConverter]::ToString($bytes[0..7]) -ne '89-50-4E-47-0D-0A-1A-0A') { throw "Not a complete PNG: $name" }
}
if (-not (Test-Path -LiteralPath 'docs\live-checks.json')) { throw 'Run tools\verify-live.ps1 against your real personal database first.' }
$check = Get-Content -LiteralPath 'docs\live-checks.json' -Raw | ConvertFrom-Json
if (-not $check.orderTablesRefused -or $check.productCount -lt 8) { throw 'Live verification is incomplete.' }
$branch = & git branch --show-current
if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') { throw 'Run from the individual repository main branch.' }
if ((& git ls-files -- config.js)) { throw 'config.js must never be committed.' }
if (Get-Command node -ErrorAction SilentlyContinue) {
    & node tools/check.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Code checks failed.' }
}
$dirty = & git status --porcelain
if ($dirty) { throw 'Commit the final reviewed files, screenshots and live evidence before tagging.' }
$remote = & git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    & git remote add origin "https://github.com/$Repository.git"
    if ($LASTEXITCODE -ne 0) { throw 'Could not add your personal origin.' }
} elseif ($remote -notin @("https://github.com/$Repository.git", "git@github.com:$Repository.git")) { throw 'Origin points somewhere else. No changes made to it.' }
& git ls-remote origin HEAD
if ($LASTEXITCODE -ne 0) { throw "Create the empty personal GitHub repository $Repository first and sign in to Git." }
$tagCommit = & git rev-parse --verify --quiet 'refs/tags/ia-b-v1.0^{commit}'
if ($LASTEXITCODE -eq 0) {
    $headCommit = & git rev-parse HEAD
    if ($tagCommit -ne $headCommit) { throw 'ia-b-v1.0 already points to a different commit. Do not move a submitted tag.' }
} else {
    & git tag -a ia-b-v1.0 -m 'Individual Finals submission'
    if ($LASTEXITCODE -ne 0) { throw 'Could not tag main.' }
}
& git push --atomic -u origin main refs/tags/ia-b-v1.0
if ($LASTEXITCODE -ne 0) { throw 'Push failed. The local commit and tag are preserved; no force push was attempted.' }
Write-Host "Published https://github.com/$Repository on main with ia-b-v1.0."
Write-Host 'Submit the repository link and your own unedited recording to Canvas after checking them.'
