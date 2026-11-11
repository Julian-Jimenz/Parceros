# Prueba TCP + login SQL (lee .env, no muestra contraseña)
param(
  [string]$EnvFile = "",
  [string]$ProjectRoot = ""
)

$ErrorActionPreference = "Stop"

if (-not $ProjectRoot) {
  $ProjectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
}
if (-not $EnvFile) {
  $EnvFile = Join-Path $ProjectRoot ".env"
}
if (-not (Test-Path $EnvFile)) { throw "No se encuentra .env en $EnvFile" }

$envVars = @{}
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$' -and -not $_.StartsWith('#')) {
    $envVars[$matches[1]] = $matches[2].Trim()
  }
}

$server = $envVars['MSSQL_SERVER']
$port = if ($envVars['MSSQL_PORT']) { $envVars['MSSQL_PORT'] } else { '1433' }
$database = $envVars['MSSQL_DATABASE']
$user = $envVars['MSSQL_USER']
$password = $envVars['MSSQL_PASSWORD']
$timeoutSec = if ($envVars['MSSQL_CONNECTION_TIMEOUT']) { [int]$envVars['MSSQL_CONNECTION_TIMEOUT'] } else { 15 }

if (-not $server) { throw 'Falta MSSQL_SERVER en .env' }

Write-Host "TCP $server`:$port ..."
$tnc = Test-NetConnection -ComputerName $server -Port $port -WarningAction SilentlyContinue
if (-not $tnc.TcpTestSucceeded) {
  Write-Host "FALLO: no hay ruta TCP al puerto $port (firewall, VPN o SQL no escuchando)."
  Write-Host "IP de salida de esta PC (solicitar whitelist en el servidor):"
  try {
    $udp = New-Object System.Net.Sockets.UdpClient
    $udp.Connect("8.8.8.8", 80)
    $local = $udp.Client.LocalEndPoint.Address.ToString()
    $udp.Close()
    Write-Host "  $local"
  } catch {
    Write-Host "  (no se pudo detectar)"
  }
  exit 2
}

Write-Host "OK TCP."

if (-not $database -or -not $user -or -not $password) {
  Write-Host "Faltan credenciales en .env para probar login SQL."
  exit 0
}

$encrypt = if ($envVars['MSSQL_ENCRYPT'] -eq 'false') { 'False' } else { 'True' }
$trust = if ($envVars['MSSQL_TRUST_SERVER_CERTIFICATE'] -eq 'false') { 'False' } else { 'True' }
$cs = "Server=$server,$port;Database=$database;User Id=$user;Password=$password;Encrypt=$encrypt;TrustServerCertificate=$trust;Connection Timeout=$timeoutSec;"
$conn = New-Object System.Data.SqlClient.SqlConnection($cs)
try {
  $conn.Open()
  $cmd = $conn.CreateCommand()
  $cmd.CommandText = "SELECT DB_NAME() AS db, SUSER_SNAME() AS login_user;"
  $r = $cmd.ExecuteReader()
  $r.Read() | Out-Null
  Write-Host "OK SQL: base=$($r.GetString(0)) usuario=$($r.GetString(1))"
  $r.Close()
  exit 0
} catch {
  Write-Host "FALLO login SQL: $($_.Exception.Message)"
  exit 3
} finally {
  if ($conn.State -eq 'Open') { $conn.Close() }
}
