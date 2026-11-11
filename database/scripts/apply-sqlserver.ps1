# Aplica scripts SQL Server leyendo .env (no imprime contrasena)
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
$encrypt = if ($envVars['MSSQL_ENCRYPT'] -eq 'false') { 'False' } else { 'True' }
$trust = if ($envVars['MSSQL_TRUST_SERVER_CERTIFICATE'] -eq 'false') { 'False' } else { 'True' }

if (-not $server -or -not $database -or -not $user -or -not $password) {
  throw 'Faltan MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER o MSSQL_PASSWORD en .env'
}

function New-SqlConnection([string]$db) {
  $cs = "Server=$server,$port;Database=$db;User Id=$user;Password=$password;Encrypt=$encrypt;TrustServerCertificate=$trust;Connection Timeout=30;"
  $conn = New-Object System.Data.SqlClient.SqlConnection($cs)
  $conn.Open()
  return $conn
}

function Invoke-SqlBatches([System.Data.SqlClient.SqlConnection]$conn, [string]$filePath) {
  $sql = Get-Content $filePath -Raw -Encoding UTF8
  $batches = [regex]::Split($sql, '(?m)^\s*GO\s*$')
  $i = 0
  foreach ($batch in $batches) {
    $batch = $batch.Trim()
    if (-not $batch) { continue }
    $i++
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $batch
    $cmd.CommandTimeout = 120
    try {
      [void]$cmd.ExecuteNonQuery()
    } catch {
      throw "Error en $([IO.Path]::GetFileName($filePath)) batch $i : $($_.Exception.Message)"
    }
  }
}

Write-Host "Verificando base '$database'..."
try {
  $conn = New-SqlConnection $database
} catch {
  Write-Host "No se pudo conectar a la base. Intentando crear en master..."
  $master = New-SqlConnection 'master'
  $cmd = $master.CreateCommand()
  $cmd.CommandText = @"
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'$database')
  CREATE DATABASE [$database];
"@
  [void]$cmd.ExecuteNonQuery()
  $master.Close()
  $conn = New-SqlConnection $database
}

$files = @(
  (Join-Path $ProjectRoot 'database\sqlserver\001_initial_schema.sql'),
  (Join-Path $ProjectRoot 'database\sqlserver\002_missing_tables_and_logic.sql'),
  (Join-Path $ProjectRoot 'database\sqlserver\001_reference_data.sql')
)

foreach ($f in $files) {
  if (-not (Test-Path $f)) { throw "Falta archivo: $f" }
  Write-Host "Aplicando $([IO.Path]::GetFileName($f))..."
  Invoke-SqlBatches $conn $f
}

$check = $conn.CreateCommand()
$check.CommandText = "SELECT COUNT(*) FROM dbo.event_settings; SELECT COUNT(*) FROM dbo.categories;"
$reader = $check.ExecuteReader()
$reader.Read() | Out-Null
$settings = $reader.GetInt32(0)
$reader.NextResult() | Out-Null
$reader.Read() | Out-Null
$cats = $reader.GetInt32(0)
$reader.Close()
$conn.Close()

Write-Host "Listo. event_settings=$settings categorias=$cats"
