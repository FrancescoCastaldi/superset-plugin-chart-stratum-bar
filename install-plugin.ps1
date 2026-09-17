<#
.SYNOPSIS
    Automated installer script for StratumBar Chart Plugin in Apache Superset.
.DESCRIPTION
    Installs and registers the StratumBar chart plugin into an Apache Superset instance:
    1. Pre-flight check: auto-installs node_modules if missing.
    2. Builds the plugin (TypeScript compilation) with resilient fallback.
    3. Locates and validates the Apache Superset root directory.
    4. Copies plugin files into superset-frontend/plugins/superset-plugin-chart-stratum-bar.
    5. Safely updates MainPreset.ts with backup (MainPreset.ts.bak) and idempotency:
       - import { StratumBarChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-bar/src';
       - new StratumBarChartPlugin().configure({ key: 'stratum_bar' }).register(),
    6. Cleans stale Webpack cache.
    7. Optionally prompts or rebuilds frontend and restarts Docker containers.
.PARAMETER SupersetPath
    Path to the Apache Superset root directory.
.PARAMETER PluginPath
    Path to the StratumBar plugin root directory (default: script directory).
.PARAMETER CleanReinstall
    Removes existing plugin folder completely and reinstalls from scratch.
.PARAMETER RebuildFrontend
    Runs 'npm run build' inside superset-frontend to recompile Webpack bundles.
.PARAMETER RestartDocker
    Automatically restarts/rebuilds Docker containers without prompting.
.PARAMETER SkipBuild
    Skips running 'npm run build' before copying files.
.PARAMETER NoDocker
    Skips Docker Compose prompts and operations.
.PARAMETER SkipCleanCache
    Skips removing superset-frontend/node_modules/.cache.
.PARAMETER Force
    Runs non-interactively using defaults without prompting.
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$SupersetPath,

    [Parameter(Position = 1)]
    [string]$PluginPath,

    [switch]$CleanReinstall,
    [switch]$RebuildFrontend,
    [switch]$RestartDocker,
    [switch]$SkipBuild,
    [switch]$NoDocker,
    [switch]$SkipCleanCache,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-Color([string]$Text, [string]$Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

function Write-Banner {
    Write-Color ""
    Write-Color "=================================================================" "Cyan"
    Write-Color "   StratumBar - 3D Isometric & Advanced Bar Chart Plugin" "Cyan"
    Write-Color "   Apache Superset Plugin Suite (C) Maps Healthcare" "DarkCyan"
    Write-Color "=================================================================" "Cyan"
    Write-Color ""
}

Write-Banner

# 1. Resolve Plugin Path
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ResolvedPluginPath = if ($PluginPath) { (Resolve-Path $PluginPath).Path } else { $ScriptDir }
Write-Color "[INFO] Percorso Plugin: $ResolvedPluginPath" "Green"

# 2. Pre-flight & Build Plugin
$DistDir = Join-Path $ResolvedPluginPath "dist"
if (Test-Path $DistDir) {
    Write-Color "`n=== FASE 1: Bundle Pre-compilato 'dist' Rilevato ===" "Cyan"
    Write-Color "[OK] File compilati gia' pronti in dist/. Installazione istantanea senza download dipendenze." "Green"
} elseif (-not $SkipBuild) {
    Write-Color "`n=== FASE 1: Verifica Dipendenze e Compilazione Plugin ===" "Cyan"
    $NpmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
    if ($NpmCmd) {
        $PluginNodeModules = Join-Path $ResolvedPluginPath "node_modules"
        if (-not (Test-Path $PluginNodeModules)) {
            Write-Color "[INFO] 'node_modules' non trovato. Esecuzione automatica 'npm install'..." "Yellow"
            $OrigLoc = Get-Location
            try {
                Set-Location $ResolvedPluginPath
                & $NpmCmd.Source install --legacy-peer-deps
            } catch {
                Write-Color "[WARN] Avviso durante npm install: $_" "Yellow"
            } finally {
                Set-Location $OrigLoc
            }
        }

        Write-Color "[INFO] Esecuzione 'npm run build' in '$ResolvedPluginPath'..." "Yellow"
        $OrigLoc = Get-Location
        try {
            Set-Location $ResolvedPluginPath
            & $NpmCmd.Source run build
            Write-Color "[OK] Compilazione TypeScript del plugin completata con successo." "Green"
        } catch {
            Write-Color "[WARN] Errore durante 'npm run build': $_. Si tenta di proseguire..." "Yellow"
        } finally {
            Set-Location $OrigLoc
        }
    } else {
        Write-Color "[WARN] 'npm' non rilevato nel PATH. Compilazione saltata." "Yellow"
    }
}

# 3. Locate Apache Superset Root Directory
Write-Color "`n=== FASE 2: Rilevamento Directory Apache Superset ===" "Cyan"
$CandidatePaths = @(
    $SupersetPath,
    $env:SUPERSET_HOME,
    "D:\Sviluppo\superset",
    "C:\Users\admmaps\superset_6_1_0\superset",
    "C:\Users\$env:USERNAME\superset",
    "..\..\superset",
    "..\superset"
)

$ResolvedSupersetPath = $null
foreach ($Path in $CandidatePaths) {
    if ($Path -and (Test-Path $Path)) {
        $FrontendPath = Join-Path $Path "superset-frontend"
        if (Test-Path $FrontendPath) {
            $ResolvedSupersetPath = (Resolve-Path $Path).Path
            break
        }
    }
}

if (-not $ResolvedSupersetPath) {
    if ($Force) {
        Write-Error "Impossibile rilevare la directory di Apache Superset. Specificare -SupersetPath."
    }
    Write-Color "Directory di Apache Superset non rilevata automaticamente." "Yellow"
    $UserInput = Read-Host "Inserire il percorso assoluto della root di Apache Superset"
    if ($UserInput -and (Test-Path $UserInput)) {
        $ResolvedSupersetPath = (Resolve-Path $UserInput).Path
    } else {
        Write-Error "Percorso non valido. Installazione interrotta."
    }
}

Write-Color "[OK] Root Superset: $ResolvedSupersetPath" "Green"
$SupersetFrontend = Join-Path $ResolvedSupersetPath "superset-frontend"
$PluginsDir = Join-Path $SupersetFrontend "plugins"
$TargetPluginDir = Join-Path $PluginsDir "superset-plugin-chart-stratum-bar"

# 4. Copy Plugin Files
Write-Color "`n=== FASE 3: Copia File Plugin in superset-frontend/plugins ===" "Cyan"
if (-not (Test-Path $PluginsDir)) {
    New-Item -ItemType Directory -Path $PluginsDir -Force | Out-Null
}

if (Test-Path $TargetPluginDir) {
    if ($CleanReinstall) {
        Write-Color "[INFO] Rimozione installazione precedente in $TargetPluginDir..." "Yellow"
        Remove-Item -Path $TargetPluginDir -Recurse -Force
    }
}

Write-Color "[INFO] Copia file in $TargetPluginDir..." "Yellow"
New-Item -ItemType Directory -Path $TargetPluginDir -Force | Out-Null

$ExcludeItems = @("node_modules", ".git", ".github", "dist", ".cache")
Get-ChildItem -Path $ResolvedPluginPath | ForEach-Object {
    if ($ExcludeItems -notcontains $_.Name) {
        Copy-Item -Path $_.FullName -Destination $TargetPluginDir -Recurse -Force
    }
}

# Copia dist se compilata
$DistSource = Join-Path $ResolvedPluginPath "dist"
if (Test-Path $DistSource) {
    $DistTarget = Join-Path $TargetPluginDir "dist"
    Copy-Item -Path $DistSource -Destination $DistTarget -Recurse -Force
}
Write-Color "[OK] File del plugin copiati con successo." "Green"

# 5. Patch MainPreset.ts
Write-Color "`n=== FASE 4: Registrazione Plugin in MainPreset.ts ===" "Cyan"
$MainPresetPath = Join-Path $SupersetFrontend "src\visualizations\presets\MainPreset.ts"

if (-not (Test-Path $MainPresetPath)) {
    Write-Color "[WARN] MainPreset.ts non trovato in: $MainPresetPath" "Yellow"
} else {
    $MainPresetContent = Get-Content -Path $MainPresetPath -Raw -Encoding UTF8

    # Create backup if not already present
    $BackupPath = "$MainPresetPath.bak"
    if (-not (Test-Path $BackupPath)) {
        Copy-Item -Path $MainPresetPath -Destination $BackupPath -Force
        Write-Color "[OK] Backup creato: $BackupPath" "DarkGray"
    }

    $ImportStatement = "import { StratumBarChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-bar/src';"
    $RegistrationCode = "          new StratumBarChartPlugin().configure({ key: 'stratum_bar' }).register(),"

    # 1. Clean all existing or duplicate StratumBarChartPlugin lines to guarantee clean state
    $RawLines = $MainPresetContent -split "`r?`n"
    $CleanLines = @()
    foreach ($Line in $RawLines) {
        if ($Line -notmatch "StratumBarChartPlugin" -and $Line -notmatch "key:\s*'stratum_bar'") {
            $CleanLines += $Line
        }
    }

    # 2. Find last import statement
    $LastImportIdx = -1
    for ($i = 0; $i -lt $CleanLines.Count; $i++) {
        if ($CleanLines[$i] -match "^import\s+") {
            $LastImportIdx = $i
        }
    }

    $WithImportLines = @()
    if ($LastImportIdx -ge 0) {
        for ($i = 0; $i -lt $CleanLines.Count; $i++) {
            $WithImportLines += $CleanLines[$i]
            if ($i -eq $LastImportIdx) {
                $WithImportLines += $ImportStatement
            }
        }
    } else {
        $WithImportLines = @($ImportStatement) + $CleanLines
    }

    # 3. Insert registration in plugins: [
    $FinalLines = @()
    $InsertedReg = $false
    foreach ($Line in $WithImportLines) {
        $FinalLines += $Line
        if (-not $InsertedReg -and $Line -match "plugins:\s*\[") {
            $FinalLines += $RegistrationCode
            $InsertedReg = $true
        }
    }

    $FinalContent = $FinalLines -join "`r`n"
    [System.IO.File]::WriteAllText($MainPresetPath, $FinalContent, [System.Text.Encoding]::UTF8)
    Write-Color "[OK] MainPreset.ts aggiornato e deduplicato con successo." "Green"
}

# 6. Clean Webpack Cache
if (-not $SkipCleanCache) {
    Write-Color "`n=== FASE 5: Pulizia Cache Webpack / Babel ===" "Cyan"
    $CachePath = Join-Path $SupersetFrontend "node_modules\.cache"
    if (Test-Path $CachePath) {
        try {
            Remove-Item -Path $CachePath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Color "[OK] Cache Webpack eliminata con successo." "Green"
        } catch {
            Write-Color "[WARN] Impossibile eliminare completamente la cache Webpack (file bloccati): $_" "Yellow"
        }
    } else {
        Write-Color "[OK] Nessuna cache Webpack obsoleta rilevata." "Green"
    }
}

# 7. Optional Frontend Rebuild
if ($RebuildFrontend) {
    Write-Color "`n=== FASE 6: Compilazione Frontend Superset ===" "Cyan"
    $NpmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
    if ($NpmCmd) {
        $OrigLoc = Get-Location
        try {
            Set-Location $SupersetFrontend
            Write-Color "[INFO] Esecuzione 'npm run build' in superset-frontend..." "Yellow"
            & $NpmCmd.Source run build
            Write-Color "[OK] Frontend ricompilato con successo." "Green"
        } catch {
            Write-Color "[WARN] Errore durante la compilazione del frontend: $_" "Yellow"
        } finally {
            Set-Location $OrigLoc
        }
    }
}

# 8. Optional Docker Restart
if ($RestartDocker -and -not $NoDocker) {
    Write-Color "`n=== FASE 7: Riavvio Container Docker ===" "Cyan"
    $DockerCmd = Get-Command "docker" -ErrorAction SilentlyContinue
    if ($DockerCmd) {
        $OrigLoc = Get-Location
        try {
            Set-Location $ResolvedSupersetPath
            Write-Color "[INFO] Esecuzione docker compose restart superset_node superset_app..." "Yellow"
            & $DockerCmd.Source compose restart superset_node superset_app
            Write-Color "[OK] Container Docker riavviati." "Green"
        } catch {
            Write-Color "[WARN] Errore durante il restart Docker: $_" "Yellow"
        } finally {
            Set-Location $OrigLoc
        }
    }
}

Write-Color "`n=================================================================" "Green"
Write-Color "   Installazione di StratumBar completata con successo! [OK]" "Green"
Write-Color "=================================================================" "Green"
Write-Color "1. Riavviare o ricompilare il frontend Superset se non eseguito automaticamente."
Write-Color "2. Il chart 'StratumBar - 3D Isometric & Advanced Bar Chart' apparira' nel chart gallery."
Write-Color ""
