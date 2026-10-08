[CmdletBinding()]
param(
    [switch] $Replace
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$plainEnvironment = Join-Path $projectRoot '.env.development'
$encryptedEnvironment = Join-Path $projectRoot '.env.development.encrypted'
$vendorAutoload = Join-Path $projectRoot 'vendor\autoload.php'

if (-not (Test-Path -LiteralPath $plainEnvironment)) {
    throw 'Create .env.development from .env.development.example and fill in the development values first.'
}

if (-not (Test-Path -LiteralPath $vendorAutoload)) {
    throw 'Composer dependencies are required. Run composer install first.'
}

if ((Test-Path -LiteralPath $encryptedEnvironment) -and -not $Replace) {
    throw '.env.development.encrypted already exists. Use -Replace to update it.'
}

Push-Location $projectRoot

try {
    $encryptArguments = @('artisan', 'env:encrypt', '--env=development')

    if ($Replace) {
        $encryptArguments += '--force'
    }

    & php @encryptArguments

    if ($LASTEXITCODE -ne 0) {
        throw 'Laravel could not encrypt the development environment.'
    }

    Write-Host 'The encrypted development environment can now be committed.' -ForegroundColor Green
    Write-Host 'Store the displayed decryption key outside Git. Do not lose it.' -ForegroundColor Yellow
    Write-Host 'The plaintext .env.development remains ignored by Git.'
}
finally {
    Pop-Location
}
