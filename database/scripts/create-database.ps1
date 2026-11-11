# Crea la base de datos y aplica migraciones + seed (001-004)
# Uso:
#   .\create-database.ps1 -PgUser postgres -PgPassword "tu_clave"
#   .\create-database.ps1 -PgUser postgres
#     (solicita contraseña de forma segura en consola)

param(
  [string]$PgHost = "localhost",
  [int]$PgPort = 5432,
  [string]$PgUser = "postgres",
  [string]$PgPassword = "",
  [string]$DbName = "manizales_epic_race_2026"
)

$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$createdb = "C:\Program Files\PostgreSQL\16\bin\createdb.exe"

if (-not (Test-Path $psql)) {
  Write-Error "No se encontró psql en $psql. Ajuste la ruta a su instalación de PostgreSQL."
}

if (-not $PgPassword) {
  $secure = Read-Host "Contraseña de PostgreSQL para usuario '$PgUser'" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $PgPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

$env:PGPASSWORD = $PgPassword
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$migrations = @(
  (Join-Path $root "database\migrations\001_initial_schema.sql"),
  (Join-Path $root "database\seed\001_reference_data.sql"),
  (Join-Path $root "database\migrations\002_quota_enforcement.sql"),
  (Join-Path $root "database\migrations\003_registration_number.sql"),
  (Join-Path $root "database\migrations\004_integrity_admin_health_legal.sql")
)

$exists = & $psql -h $PgHost -p $PgPort -U $PgUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbName'"
if ($exists -ne "1") {
  Write-Host "Creando base de datos '$DbName'..."
  & $createdb -h $PgHost -p $PgPort -U $PgUser -E UTF8 $DbName
  if ($LASTEXITCODE -ne 0) { throw "createdb falló con código $LASTEXITCODE" }
} else {
  Write-Host "La base '$DbName' ya existe. Se aplicarán migraciones (pueden ser idempotentes en 002-004)."
}

$i = 0
foreach ($file in $migrations) {
  $i++
  if (-not (Test-Path $file)) { throw "No se encuentra: $file" }
  Write-Host "[$i/$($migrations.Count)] Aplicando $([IO.Path]::GetFileName($file))..."
  & $psql -h $PgHost -p $PgPort -U $PgUser -d $DbName -v ON_ERROR_STOP=1 -f $file
  if ($LASTEXITCODE -ne 0) { throw "Error al aplicar $file" }
}

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Write-Host "Listo: base '$DbName' configurada (001 + seed + 002-004)."
