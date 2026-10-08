[CmdletBinding()]
param(
    [switch] $Replace
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectRoot '.env'
$environmentBackup = $null
$encryptedEnvironment = Join-Path $projectRoot '.env.development.encrypted'
$environmentTemplate = Join-Path $projectRoot '.env.development.example'
$artisanFile = Join-Path $projectRoot 'artisan'
$vendorAutoload = Join-Path $projectRoot 'vendor\autoload.php'

if (Test-Path -LiteralPath $environmentFile) {
    if (-not $Replace) {
        Write-Host 'The .env file already exists. Nothing was changed.' -ForegroundColor Yellow
        Write-Host 'Run again with -Replace only if you want to replace it after creating a backup.'
        exit 0
    }

    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $environmentBackup = Join-Path $projectRoot ".env.backup.$timestamp"
    Copy-Item -LiteralPath $environmentFile -Destination $environmentBackup
    Write-Host "Existing .env backed up to $environmentBackup" -ForegroundColor Yellow
}

Push-Location $projectRoot

try {
    if (Test-Path -LiteralPath $encryptedEnvironment) {
        if (-not (Test-Path -LiteralPath $vendorAutoload)) {
            throw 'Composer dependencies are required to decrypt the environment. Run composer install first.'
        }

        $secureKey = Read-Host 'Development environment decryption key' -AsSecureString
        $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
        $previousEncryptionKey = $env:LARAVEL_ENV_ENCRYPTION_KEY

        try {
            $env:LARAVEL_ENV_ENCRYPTION_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
            $decryptArguments = @('artisan', 'env:decrypt', '--env=development', '--filename=.env', '--no-interaction')

            if ($Replace) {
                $decryptArguments += '--force'
            }

            & php @decryptArguments

            if ($LASTEXITCODE -ne 0) {
                throw 'Laravel could not decrypt the development environment.'
            }
        }
        finally {
            $env:LARAVEL_ENV_ENCRYPTION_KEY = $previousEncryptionKey
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
        }
    }
    else {
        if (-not (Test-Path -LiteralPath $environmentTemplate)) {
            throw 'Neither .env.development.encrypted nor .env.development.example exists.'
        }

        Copy-Item -LiteralPath $environmentTemplate -Destination $environmentFile -Force:$Replace
        Write-Host 'Created .env from the development template.' -ForegroundColor Green
        Write-Host 'Fill in the missing development credentials before using external services.' -ForegroundColor Yellow
    }

    if ((Test-Path -LiteralPath $artisanFile) -and (Test-Path -LiteralPath $vendorAutoload)) {
        $appKeyLine = Select-String -LiteralPath $environmentFile -Pattern '^APP_KEY=(.*)$' | Select-Object -First 1

        if ($appKeyLine -and $appKeyLine.Matches[0].Groups[1].Value.Trim() -eq '') {
            & php artisan key:generate --no-interaction

            if ($LASTEXITCODE -ne 0) {
                throw 'Laravel could not generate APP_KEY.'
            }
        }

        & php artisan optimize:clear --no-interaction
    }

    Write-Host 'Development environment is ready.' -ForegroundColor Green
    Write-Host 'Next: run php artisan migrate, php artisan serve, and npm run dev.'
}
catch {
    if ($environmentBackup -and (Test-Path -LiteralPath $environmentBackup)) {
        Copy-Item -LiteralPath $environmentBackup -Destination $environmentFile -Force
        Write-Host 'The original .env was restored after the error.' -ForegroundColor Yellow
    }

    throw
}
finally {
    Pop-Location
}
