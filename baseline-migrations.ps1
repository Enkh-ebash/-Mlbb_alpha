# Run this ONCE, from the mlbb_play project root. It does not touch any
# data — it only records, for each service, "here is the SQL that would
# create the current schema from nothing" and marks it as already applied.
#
# Uses `docker compose run --rm` (fresh one-off containers) so it works even
# while the real service containers are stuck restarting on P3005. The
# "resolve" step bind-mounts the migrations folder we just wrote on the
# host, because a fresh `run` container only has what was baked into the
# image at the last build — it can't see files created on the host after
# that build without an explicit mount.

$services = @(
  "auth-service",
  "matchmaking-service",
  "elo-service",
  "match-service",
  "team-service",
  "hero-service"
)

foreach ($svc in $services) {
    Write-Host "=== $svc ===" -ForegroundColor Cyan

    $migDir = "services\$svc\prisma\migrations\0_init"
    New-Item -ItemType Directory -Force -Path $migDir | Out-Null

    docker compose run --rm --no-deps --entrypoint sh $svc -c `
        "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script" `
        | Out-File -FilePath "$migDir\migration.sql" -Encoding utf8

    if (-not (Test-Path "$migDir\migration.sql") -or (Get-Item "$migDir\migration.sql").Length -eq 0) {
        Write-Host "  FAILED to generate migration.sql for $svc — check the error above." -ForegroundColor Red
        continue
    }

    $hostMigrationsPath = Join-Path $PWD.Path "services\$svc\prisma\migrations"

    $resolveOutput = docker compose run --rm --no-deps --entrypoint sh `
        -v "${hostMigrationsPath}:/app/prisma/migrations" `
        $svc -c "npx prisma migrate resolve --applied 0_init" 2>&1
    $resolveOutput | ForEach-Object { Write-Host $_ }

    $alreadyApplied = ($resolveOutput -join "`n") -match "already recorded as applied"

    if ($LASTEXITCODE -ne 0 -and -not $alreadyApplied) {
        Write-Host "  FAILED to resolve $svc (exit $LASTEXITCODE) - check the error above." -ForegroundColor Red
        continue
    }

    Write-Host "  OK: $svc baselined" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. Now run: docker compose build" -ForegroundColor Yellow
Write-Host "Then:          docker compose up" -ForegroundColor Yellow
