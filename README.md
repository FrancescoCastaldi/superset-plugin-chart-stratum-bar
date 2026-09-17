# StratumBar — 3D Isometric & Advanced Bar Chart Plugin for Apache Superset

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Superset Version](https://img.shields.io/badge/Apache%20Superset-3.x%20|%204.x%20|%206.x-green.svg)](https://superset.apache.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![ECharts](https://img.shields.io/badge/Apache%20ECharts-5.5.0-red.svg)](https://echarts.apache.org/)

**StratumBar** è un plugin di visualizzazione ad alte prestazioni per Apache Superset che espande le capacità del bar chart classico (`echarts_timeseries_bar`) introducendo un **doppio motore di rendering (2D Moderno e 3D Isometrico Volumetrico)**, linee guida di **Benchmark Target**, calcolo automatico di **Badge di Scostamento Percentuale (Delta %)**, e una **Toolbar di Controllo a Runtime** per manipolare la visualizzazione in tempo reale.

---

## 📸 Anteprima Grafica

![StratumBar 3D Preview](./src/images/thumbnail.png)

---

## 🌟 Funzionalità Chiave

### 1. 🧊 Doppio Motore di Rendering: 2D & 3D Isometrico
- **3D Isometrico Volumetrico**: Barre tridimensionali renderizzate tramite coordinate isometriche vettoriali con 3 facce distinte (frontale, laterale destra, cappuccio superiore) e illuminazione direzionale graduata.
- **Zero WebGL Overhead**: Funziona a 60 fps su canvas 2D nativo di Apache ECharts, eliminando il rischio di crash da memoria WebGL o perdita di contesto su dashboard dense.
- **Ombre Portate Ambientali (Ground Shadows)**: Ombre morbide proiettate alla base di ciascuna colonna 3D per conferire profondità e realismo.
- **2D Moderno**: Barre con angoli arrotondati configurabili (`barBorderRadius`), gradienti verticali/orizzontali e supporto opzionale per guide di scala di fondo (**Track Background**).

### 2. 🎯 Benchmark Target & Scostamento Percentuale (Delta %)
- **Linee Guida di Riferimento**: Imposta un benchmark target fisso o dinamico (calcolato automaticamente come **Media** o **Mediana** della serie corrente, oppure tramite una **Metrica Target** dedicata).
- **Badge Delta % Intelligenti**: Calcolo istantaneo della variazione percentuale `((valore - target) / target) * 100` visualizzato direttamente nei tooltip e nei dettagli delle metriche.
- **Polarità del Delta**:
  - *Normale*: l'incremento è positivo (verde), il calo è negativo (rosso).
  - *Invertito*: l'incremento è negativo/critico (rosso, es. tempi di attesa o costi), il calo è favorevole (verde).

### 3. 🎛️ Toolbar Interattiva a Runtime
Toolbar flottante o integrata nella testata del grafico che consente agli utenti della dashboard di:
- Alternare istantaneamente la modalità **2D** e **3D**.
- Cambiare l'orientamento da **Verticale** (colonne) a **Orizzontale** (barre).
- Commutare tra barre **Raggruppate** (side-by-side) e **Impilate** (stacked).
- Regolare in tempo reale **Inclinazione (Tilt)** e **Profondità (Depth)** in modalità 3D.
- Esportare l'immagine renderizzata in **PNG** ad alta risoluzione o scaricare i dati aggregati in formato **CSV**.

### 4. 🔄 Cross-Filtering Nativo Superset
- Cliccando su qualsiasi barra o colonna 3D, viene emesso il filtro interattivo nativo Superset (`setDataMask` / `onAddFilter`) sincronizzando tutte le tabelle, heatmap e KPI della dashboard.

---

## 🚀 Installazione Rapida in Apache Superset

### Metodo Automatico (PowerShell)

Dalla cartella del plugin, eseguire lo script di installazione unificato:

```powershell
.\install-plugin.ps1 -SupersetPath "D:\Sviluppo\superset"
```

Lo script esegue automaticamente:
1. Pre-flight check: verifica e installa le dipendenze mancanti (`npm install`).
2. Compilazione TypeScript del plugin (`npm run build`).
3. Copia dei file in `superset-frontend/plugins/superset-plugin-chart-stratum-bar`.
4. Creazione del backup `MainPreset.ts.bak` e registrazione di `StratumBarChartPlugin` con chiave `stratum_bar`.
5. Pulizia della cache Webpack/Babel.

### Metodo Batch (Doppio Clic)
È sufficiente fare doppio clic su `install.bat`.

---

## 🛠️ Configurazione nel Pannello Explore di Superset

| Sezione | Controllo | Descrizione |
|:---|:---|:---|
| **Query** | `X-Axis / Category` | Dimensione principale (es. `CANALE`, `REPARTO`, `MESE`). |
| **Query** | `Breakdown Dimension` | Dimensione secondaria di suddivisione (es. `REGIME`: Convenzionato / Privato). |
| **Query** | `Metrics` | Metrica da misurare (es. `Richieste`, `Fatturato`). |
| **Query** | `Target Metric` | Metrica opzionale usata come target di riferimento per ciascuna categoria. |
| **3D Options** | `Default View Mode` | Modalità predefinita (`3d` o `2d`). |
| **3D Options** | `3D Depth` & `Tilt` | Profondità dell'estrusione (px) e angolo di inclinazione (gradi). |
| **3D Options** | `3D Ground Shadows` | Abilita ombre ambientali sul piano d'appoggio. |
| **Layout** | `Orientation` | Orientamento `vertical` (colonne) o `horizontal` (barre). |
| **Layout** | `Stacking` | Raggruppate (`none`) o Impilate (`stack`). |
| **Benchmark** | `Show Benchmark` | Attiva linea guida di target. |
| **Benchmark** | `Benchmark Type` | Tipo di calcolo: `fixed_value`, `average`, `median`, `target_metric`. |
| **Benchmark** | `Show Delta %` | Mostra badge percentuali di scostamento nei tooltip. |

---

## 🧪 Esecuzione dei Test Unitari

Il plugin include una suite di test Jest completa:

```bash
npm test
```

I test validano:
- Raggruppamento multi-serie con dimensioni di breakdown (es. `REGIME` e `CANALE`).
- Calcolo esatto dei benchmark (fisso, media, mediana).
- Calcolo matematico dei badge Delta % positivi e negativi.
- Generazione opzioni ECharts per rendering 2D e 3D isometrico.
- Corretta emissione degli eventi di cross-filtering.

---

## 🌐 Demo Standalone Interattiva

Per testare immediatamente il rendering 2D e 3D con il dataset reale di IDI Slice 430:
1. Aprire con qualsiasi browser web il file:
   `examples/interactive_preview.html`
2. Utilizzare la toolbar per passare da 2D a 3D, inclinare le barre, attivare lo stacking e visualizzare i badge Delta %.
