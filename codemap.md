# Codemap: StratumBar Specialized Bar Chart Plugin

Mappa architetturale e funzionale di dettaglio per il repository `superset-plugin-chart-stratum-bar`.

---

## 🎯 Responsabilita del Modulo

Plugin di Apache Superset per visualizzazioni a barre avanzate:
- Motore di rendering duale: 2D Curved Moderno e 3D Isometrico Volumetrico (senza overhead WebGL).
- Calcolo automatico scostamenti percentuali (Delta %) e linee di benchmark dinamiche (Fixed, Media, Mediana, Target Metric).
- Asse secondario duale sincronizzato con trend spline continuo e sfumatura d'area soffusa.
- Gestione automatica outlier estremi con taglio d'asse (Axis Break).
- Dev Studio interattivo Vite + React 18 su porta 5174 per testing e sviluppo visuale in tempo reale.

---

## 🌳 Albero & Componenti

| Percorso | Ruolo Tecnico |
|:---|:---|
| `src/components/renderers2D.ts` | Configurazione ECharts per barre 2D, angoli arrotondati, gradienti e track background |
| `src/components/renderers3D.ts` | Orchestrazione renderItem custom ECharts per proiezioni 3D isometriche |
| `src/components/isometricShapes.ts` | Elementi grafici vettoriali 3D (piedistalli, prismi, cilindri, ombre, etichette) |
| `src/utils/isometricGeometry.ts` | Matematica geometrica pura per estrusione 3D, ellissi a 32 punti e slot raggruppati |
| `src/utils/seriesScaffolding.ts` | Costruzione serie lineari, benchmark pill badge, smart annotations e assi combinati |
| `src/utils/echartsUtils.ts` | Configurazione griglia, padding dinamico anti-clipping, assi e tooltip avanzati |
| `src/utils/colors.ts` | Palette executive, clinico-sanitarie e calcolo luminosita esadecimale |
| `src/utils/axisBreakUtils.ts` | Rilevamento automatico outlier ed applicazione soglie di compressione visiva |
| `dev-studio/` | Workbench standalone Vite 6 + React 18 per collaudo visuale live su `http://localhost:5174/` |
| `dev-studio/src/mockData/` | Dataset reali aziendali (benchmark IDI IRCCS 430, sales regionali, spike outlier) |
| `dev-studio/src/components/` | Sidebar Explore Controls, Diagnostics Drawer, ECharts Options Modal |
| `dev.bat` | Script batch Windows con doppio clic per lancio istantaneo del Dev Studio |
| `test/` | Suite di 10 test Jest con 118 test unitari e test di caratterizzazione ECharts |

---

## 🔄 Integrazione con i Moduli Genitori

Questo modulo funzionale e registrato in Apache Superset tramite `src/plugin/index.ts` e referenziato nei preset di dashboard della Stratum Suite.
