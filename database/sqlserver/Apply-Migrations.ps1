# Aplica migraciones T-SQL (separadas por lineas GO)
param(
  [string]$Server = $(if ($env:MSSQL_SERVER) { $env:MSSQL_SERVER } else { "localhost" }),
  [string]$Database = $(if ($env:MSSQL_DATABASE) { $env:MSSQL_DATABASE } else { "manizales_epic_race_2026" }),
  [string]$User = $(if ($env:MSSQL_USER) { $env:MSSQL_USER } else { "" }),
  [string]$Password = $(if ($env:MSSQL_PASSWORD) { $env:MSSQL_PASSWORD } else { "" }),
  [string]$Root = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

$ErrorActionPreference = "Stop"
if (-not $Password) {
  $secure = Read-Host "Contrasena SQL Server para '$User'" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

$cs = "Server=$Server,1433;Database=$Database;User Id=$User;Password=$Password;Encrypt=True;TrustServerCertificate=True;"
$files = @(
  "001_initial_schema.sql",
  "002_triggers_quota_number.sql",
  "003_seed_reference_data.sql"
)

function Invoke-SqlBatch([string]$Text, [System.Data.SqlClient.SqlConnection]$Connection) {
  $batches = [regex]::Split($Text, '^\s*GO\s*$', [System.Text.RegularExpressions.RegexOptions]::Multiline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  foreach ($batch in $batches) {
    $sql = $batch.Trim()
    if (-not $sql) { continue }
    $cmd = $Connection.CreateCommand()
    $cmd.CommandText = $sql
    $cmd.CommandTimeout = 120
    [void]$cmd.ExecuteNonQuery()
  }
}

$conn = New-Object System.Data.SqlClient.SqlConnection($cs)
$conn.Open()
try {
  foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (-not (Test-Path $path)) { throw "No existe: $path" }
    Write-Host "Aplicando $file..."
    $content = Get-Content -Path $path -Raw -Encoding UTF8
    Invoke-SqlBatch -Text $content -Connection $conn
  }
  Write-Host "Listo: migraciones SQL Server aplicadas en $Database."
} finally {
  $conn.Close()
}
