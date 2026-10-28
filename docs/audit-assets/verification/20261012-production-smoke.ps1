param(
    [string]$Database = 'm4n_production_audit_20261012_1739',
    [string]$Workspace = 'D:/m4n'
)
$ErrorActionPreference = 'Stop'
if ($Database -notmatch '^m4n_production_audit_[0-9_]+$') { throw 'Use a dedicated audit database only.' }
$taskPort = 18083
if (Get-NetTCPConnection -State Listen -LocalPort $taskPort -ErrorAction SilentlyContinue) { throw 'Audit port already in use.' }
$taskEvidence = Join-Path $Workspace 'docs/audit-assets/verification'
$taskJava = 'C:/Program Files/Java/jdk-21/bin/java.exe'
$taskJar = Join-Path $Workspace 'm4n-backend/target/m4n-backend-0.0.1-SNAPSHOT.jar'
$taskBytes = [byte[]]::new(32)
[Security.Cryptography.RandomNumberGenerator]::Fill($taskBytes)
$env:JWT_SECRET = [Convert]::ToBase64String($taskBytes)
[Security.Cryptography.RandomNumberGenerator]::Fill($taskBytes)
$env:INITIAL_ADMIN_PASSWORD = [Convert]::ToBase64String($taskBytes)
$env:INITIAL_ADMIN_ENABLED = 'true'
$env:INITIAL_ADMIN_EMAIL = 'production-audit-admin@example.test'
$env:INITIAL_ADMIN_FULL_NAME = 'Production Audit Admin'
$env:SPRING_PROFILES_ACTIVE = 'prod'
$env:SERVER_PORT = "$taskPort"
$env:DB_URL = "jdbc:postgresql://localhost:5432/$Database"
$env:DB_USERNAME = 'postgres'
$env:DB_PASSWORD = 'local-test-trust-auth'
$env:SEED_DEV_ACCOUNTS = 'false'
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
$taskChecks = [Collections.Generic.List[object]]::new()
$taskBase = "http://localhost:$taskPort"
function Check-Status {
    param([string]$Name, [string]$Path, [int]$Expected, [string]$Method = 'GET', $Body = $null, $Headers = @{})
    $taskArgs = @{Uri="$taskBase$Path"; Method=$Method; Headers=$Headers; SkipHttpErrorCheck=$true; TimeoutSec=15}
    if ($null -ne $Body) { $taskArgs.Body = ConvertTo-Json $Body -Depth 5 -Compress; $taskArgs.ContentType = 'application/json' }
    $taskResponse = Invoke-WebRequest @taskArgs
    $taskPassed = [int]$taskResponse.StatusCode -eq $Expected
    $taskChecks.Add(@{name=$Name;path=$Path;expected=$Expected;actual=[int]$taskResponse.StatusCode;passed=$taskPassed})
    if (-not $taskPassed) { throw "Unexpected HTTP status: $Name" }
    return $taskResponse
}
function Check-Condition {
    param([string]$Name, [bool]$Passed)
    $taskChecks.Add(@{name=$Name;passed=$Passed})
    if (-not $Passed) { throw "Failed check: $Name" }
}
function Get-RefreshCookie {
    param($Response)
    $taskCookieHeader = $Response.Headers['Set-Cookie'] -join ';'
    if ($taskCookieHeader -notmatch 'm4n_refresh_token=([^;]+)') { throw 'Expected refresh cookie.' }
    return "m4n_refresh_token=$($Matches[1])"
}
$taskProcess = $null
try {
    $taskProcess = Start-Process -FilePath $taskJava -ArgumentList @('-jar', $taskJar) -WorkingDirectory "$Workspace/m4n-backend" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$taskEvidence/20261012-production-startup.log" -RedirectStandardError "$taskEvidence/20261012-production-startup-error.log"
    $taskReady = $false
    for ($taskAttempt = 0; $taskAttempt -lt 60; $taskAttempt++) {
        if ($taskProcess.HasExited) { throw 'Audit backend exited before health became available.' }
        try { $taskReady = (Invoke-WebRequest "$taskBase/api/v1/health" -TimeoutSec 1).StatusCode -eq 200 } catch { }
        if ($taskReady) { break }
        Start-Sleep -Milliseconds 500
    }
    if (-not $taskReady) { throw 'Audit backend did not become ready.' }
    $taskHealth = Check-Status 'Production packaged health' '/api/v1/health' 200
    Check-Condition 'No MIME sniffing header' (($taskHealth.Headers['X-Content-Type-Options'] -join '') -eq 'nosniff')
    $taskOptions = (Check-Status 'Production payment options' '/api/v1/payments/options' 200).Content | ConvertFrom-Json
    Check-Condition 'Sandbox providers unavailable' (-not $taskOptions.vnpayAvailable -and -not $taskOptions.momoAvailable)
    $taskCatalog = (Check-Status 'Fresh production catalog' '/api/v1/products?size=1' 200).Content | ConvertFrom-Json
    Check-Condition 'No seeded products' (@($taskCatalog.content).Count -eq 0)
    $null = Check-Status 'Swagger disabled' '/swagger-ui/index.html' 404
    $null = Check-Status 'OpenAPI disabled' '/v3/api-docs' 404
    $null = Check-Status 'Protected orders require login' '/api/v1/orders/me' 401
    $taskLogin = Check-Status 'Opt-in bootstrap login' '/api/v1/auth/login' 200 'POST' @{email=$env:INITIAL_ADMIN_EMAIL;password=$env:INITIAL_ADMIN_PASSWORD}
    $taskAuth = $taskLogin.Content | ConvertFrom-Json
    Check-Condition 'Bootstrap role preserved' ($taskAuth.user.role -eq 'SUPER_ADMIN')
    $taskCookie = Get-RefreshCookie $taskLogin
    $taskCookieAttributes = $taskLogin.Headers['Set-Cookie'] -join ';'
    Check-Condition 'Secure HttpOnly SameSite auth cookie' ($taskCookieAttributes -match '(?i);\s*Secure' -and $taskCookieAttributes -match '(?i);\s*HttpOnly' -and $taskCookieAttributes -match '(?i)SameSite=Lax' -and $taskCookieAttributes -match 'Path=/api/v1/auth')
    $null = Check-Status 'Simple refresh blocked' '/api/v1/auth/refresh' 403 'POST' $null @{Cookie=$taskCookie}
    $null = Check-Status 'Simple logout blocked' '/api/v1/auth/logout' 403 'POST' $null @{Cookie=$taskCookie}
    $null = Check-Status 'Sibling origin refresh blocked' '/api/v1/auth/refresh' 403 'POST' $null @{Cookie=$taskCookie;'X-Requested-With'='M4N';Origin='https://evil.example.test'}
    $taskRefreshed = Check-Status 'Trusted refresh survives rejected requests' '/api/v1/auth/refresh' 200 'POST' $null @{Cookie=$taskCookie;'X-Requested-With'='M4N';Origin=$env:FRONTEND_URL}
    $taskAuth = $taskRefreshed.Content | ConvertFrom-Json
    $taskCookie = Get-RefreshCookie $taskRefreshed
    $null = Check-Status 'Production admin list' '/api/v1/admin/products?size=1' 200 'GET' $null @{Authorization="Bearer $($taskAuth.accessToken)"}
    $null = Check-Status 'OTP proof still mandatory' '/api/v1/auth/register' 400 'POST' @{fullName='Unverified audit';email='unverified@example.test';password='TestPassword123!'}
    $null = Check-Status 'Unknown uploaded image returns not found' '/api/v1/media/00000000-0000-0000-0000-000000000000.png' 404
    $null = Check-Status 'Trusted logout' '/api/v1/auth/logout' 204 'POST' $null @{Cookie=$taskCookie;'X-Requested-With'='M4N';Origin=$env:FRONTEND_URL}
    $null = Check-Status 'Revoked cookie cannot refresh' '/api/v1/auth/refresh' 401 'POST' $null @{Cookie=$taskCookie;'X-Requested-With'='M4N'}
} finally {
    $taskChecks | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath "$taskEvidence/20261012-production-smoke.json" -Encoding utf8
    if ($taskProcess -and -not $taskProcess.HasExited) { Stop-Process -Id $taskProcess.Id; $taskProcess.WaitForExit() }
}
Write-Output "Production-profile localhost smoke: $($taskChecks.Count) checks passed; no external email/provider calls."
