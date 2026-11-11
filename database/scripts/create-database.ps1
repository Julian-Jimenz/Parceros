# Crea la base de datos y aplica migraciones + seed
# Uso: .\create-database.ps1 -PgUser postgres -PgPassword "tu_clave"

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

$env:PGPASSWORD = $PgPassword
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$migration = Join-Path $root "database\migrations\001_initial_schema.sql"
$seed = Join-Path $root "database\seed\001_reference_data.sql"

Write-Host "Creando base de datos '$DbName' si no existe..."
& $createdb -h $PgHost -p $PgPort -U $PgUser $DbName 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "La base ya existe o createdb falló (código $LASTEXITCODE); continuando con migraciones..."
}

Write-Host "Aplicando esquema..."
& $psql -h $PgHost -p $PgPort -U $PgUser -d $DbName -f $migration
if ($LASTEXITCODE -ne 0) { throw "Error al aplicar migración" }

Write-Host "Aplicando seed..."
& $psql -h $PgHost -p $PgPort -U $PgUser -d $DbName -f $seed
if ($LASTEXITCODE -ne 0) { throw "Error al aplicar seed" }

Write-Host "Listo: base '$DbName' configurada."
