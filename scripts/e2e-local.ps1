$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$nodeProcess = $null

try {
    Push-Location $root
    $nodeProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "node" -WorkingDirectory "$root\blockchain" -PassThru
    $rpcReady = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        try {
            $body = '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
            $response = Invoke-RestMethod -Uri "http://127.0.0.1:8545" -Method Post -ContentType "application/json" -Body $body
            if ($response.result -eq "0x7a69") { $rpcReady = $true; break }
        } catch { }
        Start-Sleep -Milliseconds 250
    }
    if (-not $rpcReady) { throw "Hardhat node did not become ready on http://127.0.0.1:8545" }

    Push-Location "$root\blockchain"
    $deploymentOutput = npx hardhat run scripts/deployPhase2.ts --network localhost | Out-String
    Pop-Location
    $deployment = $deploymentOutput | ConvertFrom-Json

    $env:ARTSHIELD_E2E_BLOCKCHAIN = "1"
    $env:BLOCKCHAIN_RPC_URL = "http://127.0.0.1:8545"
    $env:CERTIFICATE_CONTRACT_ADDRESS = $deployment.certificate
    $env:OWNERSHIP_CONTRACT_ADDRESS = $deployment.ownership
    $env:RIGHTS_CONTRACT_ADDRESS = $deployment.rights
    $env:CERTIFICATE_SIGNER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    $env:ARTSHIELD_MUTATION_TOKEN = "local-e2e-token"
    $env:ARTSHIELD_MUTATION_ROLE = "operator"

    Push-Location "$root\backend"
    npm test -- --test-name-pattern="Phase 2 local blockchain integration"
    if ($LASTEXITCODE -ne 0) { throw "Real local Hardhat E2E failed" }
    Pop-Location
} finally {
    if ($nodeProcess) { Stop-Process -Id $nodeProcess.Id -Force -ErrorAction SilentlyContinue }
    $rpcProcessId = (Get-NetTCPConnection -LocalPort 8545 -State Listen -ErrorAction SilentlyContinue).OwningProcess
    if ($rpcProcessId) { Stop-Process -Id $rpcProcessId -Force -ErrorAction SilentlyContinue }
    while ((Get-Location).Path -ne $root) { Pop-Location }
}