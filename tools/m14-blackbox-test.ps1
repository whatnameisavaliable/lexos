# M14 SOP Worker blackbox tests
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
npx tsx tools/m14-blackbox-test.mjs
exit $LASTEXITCODE
