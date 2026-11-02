param(
    [string]$BaseUrl = 'http://localhost:18082/api/v1',
    [string]$EvidencePath = "$PSScriptRoot/20261012-api-smoke.json"
)
$ErrorActionPreference = 'Stop'
if (-not $env:M4N_SMOKE_TEST_PASSWORD) { throw 'Export the dedicated test-fixture password before running.' }
$taskChecks = [Collections.Generic.List[object]]::new()
function Check-Api {
    param([string]$Name, [string]$Path, [int]$Expected, [string]$Method = 'GET', $Body = $null, $Headers = @{}, $Session = $null)
    $taskRequestHeaders = @{'X-Requested-With'='M4N'}
    foreach ($taskKey in $Headers.Keys) { $taskRequestHeaders[$taskKey] = $Headers[$taskKey] }
    $taskArgs = @{ Uri = "$BaseUrl$Path"; Method = $Method; Headers = $taskRequestHeaders; SkipHttpErrorCheck = $true }
    if ($null -ne $Body) { $taskArgs.Body = ConvertTo-Json $Body -Depth 5 -Compress; $taskArgs.ContentType = 'application/json' }
    if ($Session) { $taskArgs.WebSession = $Session }
    $taskResponse = Invoke-WebRequest @taskArgs
    $taskPassed = [int]$taskResponse.StatusCode -eq $Expected
    $taskChecks.Add(@{name=$Name;method=$Method;path=$Path;expected=$Expected;actual=[int]$taskResponse.StatusCode;passed=$taskPassed})
    if (-not $taskPassed) { throw "Unexpected HTTP status for $Name" }
    return $taskResponse
}
try {
    $null = Check-Api 'Packaged health' '/health' 200
    $taskOptions = Check-Api 'Payment options' '/payments/options' 200
    $taskFlags = $taskOptions.Content | ConvertFrom-Json
    if ($taskFlags.vnpayAvailable -or $taskFlags.momoAvailable) { throw 'Smoke expects unconfigured payment providers.' }
    $null = Check-Api 'Registration requires OTP proof' '/auth/register' 400 'POST' @{fullName='Smoke customer';email='unverified-smoke@example.test';password='SmokePassword123!'}
    $null = Check-Api 'Registration OTP unavailable honestly' '/auth/email-otp' 503 'POST' @{email='smoke@example.test';purpose='REGISTER'}
    $null = Check-Api 'Unknown reset OTP has same unconfigured result' '/auth/email-otp' 503 'POST' @{email='missing-smoke@example.test';purpose='RESET_PASSWORD'}
    $null = Check-Api 'Media path validation' '/media/invalid.png' 404
    $null = Check-Api 'Address options require session' '/shipping/options' 401
    $taskCustomerSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
    $taskLogin = Check-Api 'Customer fixture login' '/auth/login' 200 'POST' @{email='customer@m4n.vn';password=$env:M4N_SMOKE_TEST_PASSWORD} @{} $taskCustomerSession
    $taskAuth = $taskLogin.Content | ConvertFrom-Json
    if ($taskAuth.user.role -ne 'CUSTOMER') { throw 'Unexpected customer fixture role.' }
    $taskHeaders = @{Authorization="Bearer $($taskAuth.accessToken)"}
    $taskShipping = Check-Api 'Shipping options' '/shipping/options' 200 'GET' $null $taskHeaders
    $taskShippingFlags = $taskShipping.Content | ConvertFrom-Json
    if ($taskShippingFlags.carrierEnabled -or $taskShippingFlags.carrierAvailable) { throw 'Smoke expects disabled GHN.' }
    $null = Check-Api 'GHN unconfigured without fake address' '/shipping/provinces' 503 'GET' $null $taskHeaders
    $null = Check-Api 'Empty selected cart rejected' '/checkout/preview' 400 'POST' @{cartItemIds=@()} $taskHeaders
    $null = Check-Api 'Forged MoMo notification rejected' '/payments/momo/ipn' 503 'POST' @{resultCode='0';orderId='forged'}
    $null = Check-Api 'Customer cannot create product' '/admin/products' 403 'POST' @{} $taskHeaders
    $null = Check-Api 'Customer fixture logout' '/auth/logout' 204 'POST' @{} $taskHeaders $taskCustomerSession
    $taskAdminSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
    $taskLogin = Check-Api 'Admin fixture login' '/auth/login' 200 'POST' @{email='admin@m4n.vn';password=$env:M4N_SMOKE_TEST_PASSWORD} @{} $taskAdminSession
    $taskAuth = $taskLogin.Content | ConvertFrom-Json
    if ($taskAuth.user.role -ne 'ADMIN') { throw 'Unexpected admin fixture role.' }
    $taskHeaders = @{Authorization="Bearer $($taskAuth.accessToken)"}
    $null = Check-Api 'Admin product list' '/admin/products?page=0&size=1' 200 'GET' $null $taskHeaders
    $null = Check-Api 'Admin fixture logout' '/auth/logout' 204 'POST' @{} $taskHeaders $taskAdminSession
} finally {
    $taskChecks | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $EvidencePath -Encoding utf8
}
Write-Output "HTTP smoke passed: $($taskChecks.Count) checks. Evidence excludes credentials and tokens."
