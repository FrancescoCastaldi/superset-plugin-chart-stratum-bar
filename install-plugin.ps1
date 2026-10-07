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
       - new StratumBarChartPlugin().configure({ key: 'stratum_bar' }),
       Legacy registration variants (`.register()` lines, odd indentation, duplicates)
       are normalized to the canonical form instead of adding new lines.
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
if (-not $PluginPath) {
    if (Test-Path (Join-Path (Get-Location).Path "package.json")) {
        $PluginPath = (Get-Location).Path
    } elseif ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot "package.json"))) {
        $PluginPath = $PSScriptRoot
    } else {
        $PluginPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    }
}
$ResolvedPluginPath = (Resolve-Path $PluginPath).Path
Write-Color "[INFO] Percorso Plugin (sorgente): $ResolvedPluginPath" "Green"

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
    "C:\Superset",
    "D:\Sviluppo\superset-6.1.0",
    "D:\Sviluppo\superset",
    "C:\Users\admmaps\superset_6_1_0\superset",
    "C:\Users\$env:USERNAME\superset",
    (Join-Path $ResolvedPluginPath "..\superset-6.1.0"),
    (Join-Path $ResolvedPluginPath "..\superset"),
    (Join-Path $ResolvedPluginPath "..\apache-superset"),
    (Join-Path $ResolvedPluginPath "..\..\superset")
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
    Write-Color "[INFO] Aggiornamento installazione esistente in $TargetPluginDir..." "Yellow"
    if ($CleanReinstall) {
        Remove-Item -Path $TargetPluginDir -Recurse -Force
    } else {
        $OldDist = Join-Path $TargetPluginDir "dist"
        $OldSrc = Join-Path $TargetPluginDir "src"
        if (Test-Path $OldDist) { Remove-Item -Path $OldDist -Recurse -Force -ErrorAction SilentlyContinue }
        if (Test-Path $OldSrc) { Remove-Item -Path $OldSrc -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

Write-Color "[INFO] Copia file in $TargetPluginDir..." "Yellow"
New-Item -ItemType Directory -Path $TargetPluginDir -Force | Out-Null

$ExcludeItems = @("node_modules", ".git", ".github", "dist", ".cache", "package-lock.json")
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
    $RawContent = [System.IO.File]::ReadAllText($MainPresetPath, [System.Text.Encoding]::UTF8)

    # Create backup if not already present
    $BackupPath = "$MainPresetPath.bak"
    if (-not (Test-Path $BackupPath)) {
        Copy-Item -Path $MainPresetPath -Destination $BackupPath -Force
        Write-Color "[OK] Backup creato: $BackupPath" "DarkGray"
    } else {
        Write-Color "[INFO] Backup preesistente mantenuto: $BackupPath" "DarkGray"
    }

    $NL = if ($RawContent.Contains("`r`n")) { "`r`n" } else { "`n" }
    $TargetImport = "import { StratumBarChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-bar/src';"
    $TargetRegister = "        new StratumBarChartPlugin().configure({ key: 'stratum_bar' }),"
    $ImportRegex = "from\s*['`"][^'`"]*superset-plugin-chart-stratum-bar"
    $RegisterRegex = 'new\s+StratumBarChartPlugin'

    $PresetLineList = [System.Collections.Generic.List[string]]($RawContent -split "\r?\n")

    # Verifica se il file e' gia' configurato NELLA FORMA CANONICA (riga-esatta):
    # le varianti legacy (riga con `.register()`, indentazioni anomale, duplicati)
    # non contano come configurazione valida e vengono normalizzate dal ramo else.
    $hasExactImport = ($PresetLineList -contains $TargetImport)
    $hasExactRegister = ($PresetLineList -contains $TargetRegister)
    $importCount = @($PresetLineList | Where-Object { $_ -match $ImportRegex }).Count
    $registerCount = @($PresetLineList | Where-Object { $_ -match $RegisterRegex }).Count

    if (-not $CleanReinstall -and $hasExactImport -and $hasExactRegister -and ($importCount -eq 1) -and ($registerCount -eq 1)) {
        Write-Color "[OK] MainPreset.ts e' gia' registrato correttamente (idempotente - nessuna modifica necessaria)." "Green"
    } else {
        Write-Color "[INFO] Normalizzazione import e registrazione in corso..." "Yellow"

        # Step A: rimozione import obsoleti o duplicati e reinserimento forma canonica
        $filteredLines = [System.Collections.Generic.List[string]]::new()
        $lastImportIdx = -1
        for ($i = 0; $i -lt $PresetLineList.Count; $i++) {
            $line = $PresetLineList[$i]
            if ($line -match $ImportRegex) { continue }
            if ($line.Trim().StartsWith("import ")) { $lastImportIdx = $filteredLines.Count }
            $filteredLines.Add($line)
        }
        if ($lastImportIdx -ge 0) {
            $filteredLines.Insert($lastImportIdx + 1, $TargetImport)
        } else {
            $filteredLines.Insert(0, $TargetImport)
        }

        # Step B: rimozione registrazioni legacy/duplicate e inserimento forma canonica in plugins: [
        $finalLines = [System.Collections.Generic.List[string]]::new()
        $pluginsIdx = -1
        for ($i = 0; $i -lt $filteredLines.Count; $i++) {
            $line = $filteredLines[$i]
            if ($line -match $RegisterRegex) { continue }
            $finalLines.Add($line)
            if ($line -match 'plugins\s*:\s*\[') { $pluginsIdx = $finalLines.Count }
        }
        if ($pluginsIdx -ge 0) {
            $finalLines.Insert($pluginsIdx, $TargetRegister)
        } else {
            $finalLines.Add($TargetRegister)
        }

        $NewContent = $finalLines -join $NL
        [System.IO.File]::WriteAllText($MainPresetPath, $NewContent, [System.Text.UTF8Encoding]::new($false))
        Write-Color "[OK] MainPreset.ts aggiornato, deduplicato e normalizzato con successo." "Green"
    }
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
            Write-Color "[INFO] Rilevamento servizi Docker Compose..." "Yellow"
            $ServicesOutput = (& $DockerCmd.Source compose config --services 2>$null)
            $NodeService = if ($ServicesOutput -and ($ServicesOutput -contains "superset-node")) { "superset-node" } elseif ($ServicesOutput -and ($ServicesOutput -contains "superset_node")) { "superset_node" } else { "superset-node" }
            $AppService = if ($ServicesOutput -and ($ServicesOutput -contains "superset")) { "superset" } elseif ($ServicesOutput -and ($ServicesOutput -contains "superset_app")) { "superset_app" } else { "superset" }
            
            Write-Color "[INFO] Esecuzione docker compose restart $NodeService $AppService..." "Yellow"
            & $DockerCmd.Source compose restart $NodeService $AppService
            Write-Color "[OK] Container Docker ($NodeService, $AppService) riavviati con successo." "Green"
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
