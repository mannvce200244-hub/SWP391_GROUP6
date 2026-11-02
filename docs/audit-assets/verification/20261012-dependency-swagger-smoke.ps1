param([string]$Workspace = 'D:/m4n')
$ErrorActionPreference = 'Stop'
$taskPort = 18084
if (Get-NetTCPConnection -State Listen -LocalPort $taskPort -ErrorAction SilentlyContinue) {
    throw 'Audit port already in use.'
}
$taskEvidence = Join-Path $Workspace 'docs/audit-assets/verification'
$taskJar = Join-Path $Workspace 'm4n-backend/target/m4n-backend-0.0.1-SNAPSHOT.jar'
$taskBase = "http://localhost:$taskPort"
$taskChecks = [Collections.Generic.List[object]]::new()
$taskBytes = [byte[]]::new(32)
[Security.Cryptography.RandomNumberGenerator]::Fill($taskBytes)
$env:JWT_SECRET = [Convert]::ToBase64String($taskBytes)
$env:DB_URL = 'jdbc:postgresql://localhost:5432/m4n_production_audit_20261012_1739'
$env:DB_USERNAME = 'postgres'
$env:DB_PASSWORD = 'local-test-trust-auth'
$env:SERVER_PORT = "$taskPort"
$env:SEED_DEV_ACCOUNTS = 'false'
$env:INITIAL_ADMIN_ENABLED = 'false'
$env:OTP_EMAIL_ENABLED = 'true'
$env:GMAIL_USERNAME = 'audit-sender@example.test'
$env:GMAIL_APP_PASSWORD = 'synthetic-no-delivery-test-password'
$env:FRONTEND_URL = 'https://shop.example.test'
$env:CORS_ALLOWED_ORIGINS = $env:FRONTEND_URL
$env:PRODUCT_IMAGE_DIRECTORY = Join-Path ([IO.Path]::GetTempPath()) 'm4n-production-audit-20261012/images'
$env:PRODUCT_IMAGE_PUBLIC_BASE_URL = 'https://shop.example.test/api/v1/media'
$env:GHN_ENABLED = 'false'
$env:MOMO_ENABLED = 'false'
$env:VNPAY_ENABLED = 'false'
$env:RESET_EMAIL_ENABLED = 'false'
function Check-Status([string]$Name, [string]$Path, [int]$Expected) {
    $taskResponse = Invoke-WebRequest "$taskBase$Path" -SkipHttpErrorCheck -TimeoutSec 20
    $taskPassed = [int]$taskResponse.StatusCode -eq $Expected
    $taskChecks.Add(@{name=$Name;path=$Path;expected=$Expected;actual=[int]$taskResponse.StatusCode;passed=$taskPassed})
    if (-not $taskPassed) { throw "Unexpected HTTP status: $Name" }
    return $taskResponse
}
function Check-Condition([string]$Name, [bool]$Passed) {
    $taskChecks.Add(@{name=$Name;passed=$Passed})
    if (-not $Passed) { throw "Failed check: $Name" }
}
try {
    foreach ($taskProfile in @('default', 'prod')) {
        $env:SPRING_PROFILES_ACTIVE = $taskProfile
        $taskProcess = $null
        try {
            $taskProcess = Start-Process -FilePath 'C:/Program Files/Java/jdk-21/bin/java.exe' -ArgumentList @('-jar', $taskJar, '--spring.jpa.hibernate.ddl-auto=validate') -WorkingDirectory "$Workspace/m4n-backend" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$taskEvidence/20261012-dependency-$taskProfile-startup.log" -RedirectStandardError "$taskEvidence/20261012-dependency-$taskProfile-startup-error.log"
            $taskReady = $false
            for ($taskAttempt = 0; $taskAttempt -lt 90; $taskAttempt++) {
                if ($taskProcess.HasExited) { throw 'Audit backend exited before health became available.' }
                try { $taskReady = (Invoke-WebRequest "$taskBase/api/v1/health" -TimeoutSec 1).StatusCode -eq 200 } catch { }
                if ($taskReady) { break }
                Start-Sleep -Milliseconds 500
            }
            if (-not $taskReady) { throw 'Audit backend did not become ready.' }
            $null = Check-Status "$taskProfile packaged health" '/api/v1/health' 200
            if ($taskProfile -eq 'prod') {
                $null = Check-Status 'Prod Swagger disabled' '/swagger-ui/index.html' 404
                $null = Check-Status 'Prod OpenAPI disabled' '/v3/api-docs' 404
                $null = Check-Status 'Prod Swagger configuration disabled' '/v3/api-docs/swagger-config' 404
            } else {
                $taskSpec = (Check-Status 'Development OpenAPI' '/v3/api-docs' 200).Content | ConvertFrom-Json
                Check-Condition 'Application paths and JWT security generated' ($null -ne $taskSpec.paths.'/api/v1/auth/login'.post.requestBody -and $null -ne $taskSpec.components.schemas.LoginRequest -and $taskSpec.components.securitySchemes.bearerAuth.scheme -eq 'bearer')
                $taskHtml = Check-Status 'Development Swagger HTML' '/swagger-ui/index.html' 200
                Check-Condition 'Swagger references bundle' ($taskHtml.Content -match 'swagger-ui-bundle.js')
                $null = Check-Status 'Development Swagger JS' '/swagger-ui/swagger-ui-bundle.js' 200
                $taskConfig = (Check-Status 'Development Swagger configuration' '/v3/api-docs/swagger-config' 200).Content | ConvertFrom-Json
                Check-Condition 'Swagger uses application specification' ($taskConfig.url -eq '/v3/api-docs')
            }
        } finally {
            if ($taskProcess -and -not $taskProcess.HasExited) {
                Stop-Process -Id $taskProcess.Id
                $taskProcess.WaitForExit()
            }
        }
    }
} finally {
    $taskChecks | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath "$taskEvidence/20261012-dependency-swagger-smoke.json" -Encoding utf8
}
Write-Output "Packaged Swagger checks: $($taskChecks.Count) passed; own process stopped; no external provider calls."
