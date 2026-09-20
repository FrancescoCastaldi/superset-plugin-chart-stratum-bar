# Changelog

Tutte le modifiche degne di nota a **StratumBar** saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/) e questo progetto aderisce al [Semantic Versioning](https://semver.org/lang/it/).

## [0.2.1] - 2026-09-20

### Aggiunto
- **Design System & Estetica Avanzata Tangibile**:
  - **Glassmorphism Tooltip con Backdrop Blur**: tooltip interattivi con effetto vetro smerigliato (`backdrop-filter: blur(8px)`), bordi semi-trasparenti, font tabular-nums e badge delta allineati per metriche primarie vs target.
  - **Area Gradient Glowing**: gradiente luminoso e sfumato sotto la linea del secondo asse (`secondary_area_gradient`) per visualizzazione ibrida barre + trend.
  - **Color-Coded Axis Matching**: sincronizzazione cromatico-visiva automatica tra linea secondaria, asse destro, etichette numeriche e titolo.
  - **Dark Obsidian & Light Enterprise Mode**: supporto completo a temi chiari e scuri (`theme_mode: 'light' | 'dark'`) con contrasto ottimizzato WCAG.
  - **Texture e Pattern Geometrici Accessibili (W3C A11y Decals)**: pattern geometrici differenziati abilitabili per utenti daltonici (`enable_a11y_decal`).
- **Raffinamento Motore di Trasformazione Dati**:
  - Risolto conflitto nell'estrazione delle serie nei dataframe non pivotati: isolamento rigoroso delle metriche secondarie rispetto alle barre primarie.

## [0.2.0] - 2026-09-20

### Aggiunto
- **Supporto Completo Doppio Asse delle Ordinate (Dual Y-Axis)**:
  - Abilitazione del secondo asse Y indipendente a destra (o in alto se orientamento orizzontale) sia per il motore 2D che 3D Isometrico.
  - Assegnazione dinamica `yAxisIndex: 1` per le metriche secondarie tracciate.
  - Supporto per visualizzazione secondaria ibrida: **Linea smussata con indicatori (Line + Markers)** sovrapposta alle colonne/barre, oppure barre secondarie.
  - Formato numerico dedicato indipendente per il secondo asse (`y_axis_2_format`, es. percentuali `.2%` o valute) e titolo dedicato (`y_axis_2_title`).
- **Raggruppamento Multi-Dimensione e Breakdown Combinato**:
  - Estrazione e aggregazione contemporanea di metriche primarie e secondarie in `buildQuery.ts`.
  - Supporto al parametro `combine_category_breakdown`: visualizzazione unificata delle etichette sull'asse (`Categoria [Regime]`, es. *Cardiologia [SSN]* e *Cardiologia [Privato]*).
- **Test Suite Dedicata**:
  - Aggiunta suite di test unitari Jest [`test/dualAxis.test.ts`](file:///D:/Sviluppo/superset-plugins/superset-plugin-chart-stratum-bar/test/dualAxis.test.ts) (10/10 test passing).

---

## [0.1.0] - 2026-09-17

### Aggiunto
- **Inizializzazione Plugin**: Creazione del plugin `superset-plugin-chart-stratum-bar` compatibile con Apache Superset (versioni 3.x, 4.x, 6.x).
- **Doppio Motore di Rendering 2D/3D**:
  - Motore 3D Isometrico con proiezioni geometriche poligonali su canvas 2D, illuminazione direzionale a tre facce (frontale, laterale, top cap) e ombre a terra (ground shadows) a 60 fps con zero overhead WebGL.
  - Motore 2D Moderno con angoli arrotondati configurabili (`barBorderRadius`), gradienti cromatici e guide di scala trasparenti (**Track Background**).
- **Modulo Benchmark & Delta %**:
  - Supporto per target di riferimento fisso, media aritmetica, mediana o metrica target dinamica per categoria.
  - Calcolo e visualizzazione di badge di scostamento percentuale (`+X%` / `-Y%`) con polarità normale (verde per aumento, rosso per decremento) o invertita.
- **Toolbar Interattiva a Runtime**:
  - Switch rapido 2D / 3D.
  - Switch orientamento (Verticale / Orizzontale).
  - Switch raggruppamento (Barre affiancate o Impilate).
  - Slider interattivi per regolazione dell'angolo di inclinazione (Tilt) e della profondità (Depth) in modalità 3D.
  - Esportazione istantanea ad alta risoluzione in PNG e download dei dati aggregati in formato CSV.
- **Cross-Filtering**:
  - Integrazione nativa con il motore dei filtri di Superset (`setDataMask` ed extraFormData).
- **Suite di Installazione Resiliente**:
  - `install-plugin.ps1` conforme alla *Chart Plugins Golden Rule* con pre-flight automatico `npm install`, catena di fallback per la compilazione, backup `MainPreset.ts.bak` e registrazione idempotente.
  - `install.bat` per esecuzione immediata.
- **Test Suite**:
  - Unit test Jest per trasformazione props, partizionamento multi-serie, calcolo benchmark e renderers 2D/3D.
- **Demo Interattiva**:
  - File standalone `examples/interactive_preview.html` basato sul dataset reale di IDI IRCCS Slice 430 (*ADS - Richieste per canale di prenotazione e regime*).
