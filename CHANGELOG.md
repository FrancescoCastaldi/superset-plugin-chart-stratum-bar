# Changelog

Tutte le modifiche degne di nota a **StratumBar** saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/) e questo progetto aderisce al [Semantic Versioning](https://semver.org/lang/it/).

## [0.3.11] - 2026-09-29

### Fixed
- **Metric and Dimension Key Resolution (`seriesBuilder.ts` & `transformPropsUtils.ts`)**:
  - Replaced strict `resolvedXAxis` row lookups with priority cascade (`actualXKey ?? resolvedXAxis ?? Object.values(row)[0]`), ensuring category data is 100% matched even when custom adhoc SQL aliases or non-standard casings are used.
  - Implemented case-insensitive and numeric column fallback for metric values, preventing false-positive empty series states (*"Nessun dato disponibile da visualizzare nel grafico StratumBar"*).
- **Signed Bar Auto Bicolor Conditioning (`renderers2D.ts`)**:
  - Implemented automatic bi-color gradient rendering for single-metric signed series containing negative values (`minVal < 0`): positive bars ($\ge 0$) rendered in vibrant green (`#1e8e3e`), negative bars ($< 0$) rendered in vivid red (`#d93025`).
  - Added full support for `numberFormat` (including signed percentages `+,.1f%`) in 2D bar labels via `@superset-ui/core`'s `getNumberFormatter`.

## [0.3.10] - 2026-09-29

### Added
- **Bi-Directional Bar Rendering & Negative Value Support (`minVal`)**:
  - Enhanced `renderers2D.ts` and `echartsUtils.ts` to compute both `maxVal` and `minVal`, properly passing `min` to ECharts `getValueAxisConfig` when datasets include negative numbers (e.g. negative percentage variations, drops, contraction deltas).
  - Added smart bi-directional bar borderRadius: inverted rounding to bottom/left for negative bars to gracefully reflect outward direction.
  - Implemented dynamic label position callback: positive values sit atop/right of bars, while negative values sit below/left.

## [0.3.9] - 2026-09-29

### Fixed
- **Explore Control Panel Required Validations & Duplicate Controls**:
  - Removed duplicate `metrics` row declaration in `controlPanel.tsx` Query configuration.
  - Made category dimensions (`x_axis`, `x_axis_group`, `groupby`) and primary metrics fully flexible and clearable (`clearable: true, validators: []`), eliminating blocking red error icons (`❗`) and allow explore queries without artificial constraints.
- **Metric Schema Backward Compatibility**:
  - Added robust fallback between `metrics` (multi-array) and `metric` (single string/object) in both `buildQuery.ts` and `transformProps.ts`, preventing blank renderings when switching from legacy single-metric charts.
  - Updated `StratumBarFormData` interface in `types.ts` to include optional `metric` property.

## [0.3.8] - 2026-09-21

### Added
- **2D Axis Break Cutoff Threshold MarkLine (`// Taglio Asse`)**:
  - In 2D mode, when Axis Break is active, a dedicated styled markLine with dash pattern `[4, 4]` and pill badge label `// Taglio Asse: <val>` is drawn across the value axis at `effectiveCutoff`.
  - Seamlessly integrates with benchmark lines, allowing both benchmark target lines and broken axis cutoff indicators to coexist harmoniously on the value axis.

### Fixed
- **Multi-Outlier Cluster Auto-Detection (`calculateAxisBreak`)**:
  - Enhanced `'auto'` mode algorithm to locate the primary discontinuity breakpoint across the sorted upper distribution using relative gap detection (`curr / prev >= 2.0` and `curr > median * 2.5`).
  - Correctly caps multiple extreme outliers simultaneously (e.g. `1331` and `1200` vs `73`, `25`, `8`, `7`), preventing secondary outliers from escaping capping.
- **2D Stacked Category Sum Maximum (`renderers2D.ts`)**:
  - Fixed `maxVal` calculation in stacked 2D mode to compute cumulative category sums (`sum += v`) across contributing primary series, rather than individual series values, ensuring accurate axis headroom and track background scaling.

## [0.3.7] - 2026-09-21

### Added
- **Asse Spezzato & Gestione Outlier (Axis Break / Outlier Pinning `//`)**:
  - **Visual Outlier Capping**: automatically caps disproportionately high values (e.g. 1331 vs 8, 7, 73) so the chart's primary scale accommodates the minor bars with full visual contrast and readable proportions.
  - **Preserved Real Numbers**: values displayed on top of the bars and in interactive tooltips remain the authentic absolute values (e.g. `// 1.331`), with a clear double slash prefix (`//`) indicating the capped scale break.
  - **Universal Support**: completely generic and customer-agnostic, functioning across 2D Curved Modern & 3D Isometric, Horizontal & Vertical orientations, and Grouped & Stacked bars.
  - **3D Visual Break Indicator**: rendered an authentic `//` break symbol across capped 3D prisms and cylinders.
  - **Interactive Runtime Toolbar Pill (`✂️ Asse Spezzato`)**: live 1-click toggle button on the chart toolbar with glowing indicator dot for instant client-side switching.
  - **Superset Explore Control Panel**: added dedicated section `✂️ Asse Spezzato & Gestione Outlier (Axis Break)` with options for Auto detection, P90, P95, or custom manual numeric threshold.

## [0.3.6] - 2026-09-21

### Fixed
- **Stacked Mode "Sopra (Top)" Label Position**: when `valuePosition = 'top'` in stacked 3D mode, all segment labels were incorrectly forced inside (`isInside = true` for all stacked segments). Now only the **topmost non-zero segment** per category places its value label **above the 3D cap**, while lower segments correctly render their value centered inside their own block with white high-contrast text. Precomputed `topSeriesIdxPerCat[]` array tracks the topmost contributing series per category for O(1) lookup during renderItem.
- **"Di traverso" in Stacked Mode**: slanted labels on the topmost segment are now angled 45° above the cap, while lower segments get inside-centered 45° rotated labels.

## [0.3.5] - 2026-09-21

### Added
- **Configurable Data Label Position & Rotation (`Posizione Valori: Sopra / Dentro / Di traverso`)**:
  - **Sopra (Top)**: values are placed cleanly above the bar / 3D top cap (or outside to the right in horizontal mode).
  - **Dentro (Inside)**: values are centered inside the front face/body of the bar with high-contrast white typography and drop stroke halo (`lineWidth: 2.5`).
  - **Di traverso (Slanted 45°)**: values are angled at 45° (`rotate: 45` in 2D, `rotation: Math.PI / 4` with coordinate origin in 3D custom series) to prevent horizontal collision and allow long numbers on narrow bars.
  - **Interactive Chart Toolbar Pill**: added dynamic `🏷️ Valori: Sopra | Dentro | Di traverso` cycle button on the chart toolbar for instant 1-click toggling at 60 FPS.
  - **3D Mini Settings Popover**: added dedicated segmented selector (`Sopra`, `Dentro`, `Di traverso`) inside the `⚙️ 3D` settings modal.
  - **Explore Control Panel Persistence**: added `Posizione Valori` dropdown control in Superset Explore view (`top`, `inside`, `slanted`, `outside`).
  - **Dynamic Headroom Scaling**: expanded value axis headroom (`axisMax * 1.25`) when `slanted` is selected, ensuring angled labels never overflow or clip against the chart ceiling.

## [0.3.4] - 2026-09-21

### Fixed
- **Architectural 3D Base Pedestals (Basamento / Pedana 3D)**: added solid isometric 3D base pedestals under each category group (`seriesIdx === 0`) with isometric top surface, front bevel lip, and right side depth. Columns now stand firmly on an architectural foundation instead of floating in empty void.
- **Minimum Visual Dimension for Small Values**: enforced a minimum visual height (`minBarHeight = 6px`) and width (`minBarWidth = 6px`) for non-zero values (e.g., 2, 5, 6) relative to dominant bars (e.g., 1331). Columns maintain solid 3D facet geometry instead of collapsing into flat, distorted paper wafers.
- **Zero-Value Treatment**: 0-value series now render a subtle, neat recessed footprint slot with dashed borders on the pedestal surface instead of drawing deformed 0-height prisms and colliding floating "0" text labels.
- **3D Ground Shadows**: reoriented ground shadows to cast downward/forward onto the pedestal surface (`z2: 1`) with dark/light mode opacity.
- **Category Axis Baseline Harmony**: refined `axisLine` width and `axisLabel.margin` in `echartsUtils.ts` for clean alignment beneath 3D pedestals.

## [0.3.3] - 2026-09-21

### Fixed
- **Rendering Engine Switch Reaction (`Canvas` vs `SVG`)**: in `StratumBarChart.tsx`, switching between Canvas and SVG in the control panel failed to take effect because the existing ECharts instance was never disposed upon renderer change. Added dynamic detection of renderer changes with automatic disposal and reinitialization (`echarts.init`) using the selected engine.
- **3D Geometry Shape: Cylinder (`renderers3D.ts`)**: selecting `Cilindrico (Cylinder)` previously had no effect and rendered the same rectangular prism. Implemented full 3D cylinder geometry:
  - **Vertical Cylinder**: elliptical top cap with specular highlights, rounded cylindrical body with metallic specular gradient, and elliptical base drop shadow.
  - **Horizontal Cylinder**: vertical elliptical end cap on the right edge, horizontal cylindrical body with specular gradient along the crest, and bottom drop shadow.
- **Interactive 3D Geometry Toggle**: added live `Forma 3D: Prisma / Cilindro` toggle directly inside the `⚙️ 3D` settings popover on the chart toolbar, allowing instant 60fps switching without re-opening the explore panel.

## [0.3.2] - 2026-09-21

### Fixed
- **3D Horizontal Bar Coordinate & Dimension Mapping (`renderers3D.ts`)**: in horizontal 3D mode, series data was mapped as `[i, v]` (`[categoryIndex, value]`) on custom series, causing ECharts to interpret category indices (0, 1, 2, 3) as values along the primary X-axis. As a result, the X-axis auto-scaled to ~3.2 and clamped all bars to 100% width across the canvas. Data values are now mapped dynamically as `isVertical ? [i, v] : [v, i]`, with `categoryIndex = isVertical ? api.value(0) : api.value(1)` and `val = isVertical ? api.value(1) : api.value(0)`.
- **Value Axis Dynamic Max Scale**: computed `axisMax = Math.ceil(maxVal * 1.15)` across stacked and grouped bars (including benchmark targets), ensuring proper headroom for 3D extrusion facets and labels in both horizontal (X-axis) and vertical (Y-axis) modes.
- **Horizontal Tooltip & Line Series Alignment**: passed `isVertical` to `getTooltipFormatter` to extract `it.value[0]` correctly in horizontal 3D custom series, preventing category indices from appearing in tooltips. Sliced and aligned horizontal line series data to `[val, categoryIndex]`.

## [0.3.1] - 2026-09-21

### Fixed
- **3D Stacked Bar Labels**: in 3D stacked view, value labels were overlapping or displaying poorly on small segments. Labels are now cleanly positioned inside the facet with high-contrast text and border stroke. Tiny/micro segments (<14px) are suppressed to prevent visual clutter.
- **3D Stacked Y-Axis Scale**: calculated total accumulated stacked sum across series and provided explicit `max` scale constraint to `valueAxis` in ECharts, ensuring stacked 3D columns don't overflow the top boundary of the canvas.

## [0.3.0] - 2026-09-21

### Changed
- **Major Refactoring & Optimization**: completely reorganized the codebase to extract shared utilities (`utils/colors.ts`, `utils/echartsUtils.ts`, `plugin/transformPropsUtils.ts`).
- **Eliminated Code Duplication**: extracted shared axis, legend, tooltip, and grid configurations into a common builder, eliminating duplication between `renderers2D.ts` and `renderers3D.ts`.
- **Improved Maintainability**: broke down `transformProps.ts` into smaller, testable functions for dimension resolution, color resolution, and benchmark computation.
- **Color Handling Robustness**: centralized color handling (`adjustColorBrightness`, `hexToRgba`) to prevent inconsistencies between 2D and 3D views.

## [0.2.9] - 2026-09-21

### Risolto
- **Colori Legenda Non Corrispondenti alle Barre**: la legenda ECharts usava i colori interni generati dal motore invece di quelli esplicitamente assegnati per serie (`label_colors` dashboard, mappa JSON manuale, palette). Aggiunto `data: legendData` alla configurazione della legenda con `itemStyle.color` basato sul campo `color` di ogni serie (sia 2D che 3D).
- **Valori Invisibili in Modalità Impilata (Stacked)**: i label erano posizionati a `'top'` (fuori dalla barra) per tutte le serie, rendendoli invisibili o sovrapposti nei segmenti intermedi. Impostato `position: 'inside'` quando `stacking !== 'none'` e aggiunta soppressione automatica per segmenti inferiori all'1,5% del valore massimo.
- **Overflow Testo in Modalità Orizzontale**: i valori etichetta all'estremità destra della barra uscivano dall'area del grafico. Aumentato dinamicamente il padding destro della griglia (`grid.right`) a 60px (senza doppio asse) e 90px (con doppio asse) in modalità orizzontale.

## [0.2.8] - 2026-09-21

### Risolto
- **Visibilità e Stacking Context del Micro Popover Impostazioni 3D (`⚙️ 3D`)**:
  - Risolto il problema per cui il popup delle impostazioni 3D risultava invisibile o scivolava in secondo piano dietro il canvas di ECharts.
  - Impostato `overflow: visible` sul contenitore della toolbar `.stratum-bar-toolbar` e `.stratum-bar-toolbar-right`, confinando lo scorrimento orizzontale a `.stratum-bar-toolbar-left` per evitare che l'altezza fissa della barra tagliasse i menu a tendina o i popover aperti.
  - Assegnato `z-index: 1000` alla toolbar, `z-index: 999999 !important` al popover `.stratum-bar-popover` con `pointer-events: auto` e `z-index: 1` al container canvas `.stratum-bar-canvas-container`.
  - Aggiunto listener `handleClickOutside` per chiudere in modo fluido e naturale il popover al click in qualsiasi punto esterno della pagina o del grafico.

## [0.2.7] - 2026-09-21

### Aggiunto
- **Reattività Completa ai Filtri Nativi della Dashboard (`buildQuery.ts`)**:
  - Unione e conservazione esplicita e resiliente di tutti i filtri nativi (`extra_form_data.filters`) e dei filtri ad-hoc (`extra_form_data.adhoc_filters`), garantendo che cambi di periodo, sede, branca, ambulatorio o canale aggiornino istantaneamente la query e i dati del grafico.
  - Sincronizzazione di `series_columns` con la dimensione di breakdown per l'aggiornamento automatico del contesto dashboard.
- **Cross-Filtering Avanzato con Deselezione Toggle e Dimming Visivo**:
  - Supporto completo per interazione cross-filter: al click su una barra, il grafico emette filtri nativi su `CANALE` e `REGIME` via `setDataMask` verso tutti i grafici della dashboard.
  - Implementata la deselezione toggle a due vie: cliccando nuovamente sulla barra o categoria già selezionata, il filtro viene rimosso automaticamente riportando tutti i grafici allo stato globale.
  - Feedback visivo immediato: le barre non selezionate vengono sfumate (`opacity: 0.28`) evidenziando la barra o categoria attiva in 2D e 3D.
- **Gestione Dinamica della Palette Colori (Dashboard, JSON e CSS)**:
  - **Ereditarietà Totale da Dashboard (`label_colors`)**: prioritizzazione assoluta dei colori definiti nella dashboard (`json_metadata.label_colors`, es. `SSN: #3a6a9b`, `Convenzioni: #1c3d5e`, `Libera professione: #7aa8cf`, `Solventi: #bcd5ea`), con supporto per corrispondenza esatta, case-insensitive e scomposizione di etichette composte (`Canale · Regime`).
  - **Mappatura Manuale JSON (`custom_colors_json`)**: nuovo controllo in backend/Explore per sovrascrivere o definire a mano una mappa colori JSON (`{"SSN": "#3a6a9b", ...}`).
  - **Personalizzazione Diretta via CSS**: supporto a variabili CSS custom property sul contenitore (es. `--color-ssn`, `--stratum-color-ssn`) per applicare stili e palette personalizzate direttamente dal pannello CSS della dashboard.
  - **Scelta Engine di Rendering (`renderer`)**: opzione per selezionare `Canvas` (default, massime prestazioni 60fps) oppure `SVG` (vettoriale, permette sovrascrittura diretta degli stili dal DOM tramite CSS).

## [0.2.6] - 2026-09-21

### Risolto
- **Allineamento Dimensioni Query Backend (`groupby: columns`)**:
  - Risolto problema critico di precedenza nel query builder di Superset: quando `groupby` è presente in `baseQueryObject` da `formData`, il backend Superset poteva ignorare `columns` e raggruppare esclusivamente per `groupby`, omettendo le dimensioni dell'asse X (es. `CANALE`) dalla query SQL.
  - Sincronizzato esplicitamente `groupby: columns` nell'oggetto di query ritornato da `buildQuery.ts`, garantendo che tutte le dimensioni (`x_axis`, `x_axis_group`, `groupby`) siano sempre presenti sia nella clausola `SELECT` che nel `GROUP BY` del database.

## [0.2.5] - 2026-09-21

### Aggiunto
- **Controllo Esplicito Raggruppamento Ascisse (`x_axis_group`)**:
  - Aggiunto il controllo dedicato `X-Axis Group Dimension (Raggruppamento Ascisse)` in *Query Configuration* per consentire la configurazione immediata di dimensioni aggregate sulle ascisse (es. Canale di Prenotazione raggruppato con Regime).
  - Supporto per selezione multipla su `x_axis` (`multi: true`) che permette di selezionare liberamente più dimensioni direttamente sull'asse X.
- **Raggruppamento Flessibile su Ascisse**:
  - Spostamento del controllo `combine_category_breakdown` ("Etichette Raggruppate su Ascisse - Compound Labels") direttamente nella sezione primaria *Query Configuration*.
  - Visualizzazione ad alta leggibilità con separatore puntato (`Canale · Regime`, es. `App · SSN`, `Call center · Convenzioni`) mantenendo la colorazione coerente per serie e la legenda dei singoli regimi.
  - Aggregazione robusta a sommatoria per righe multiple o duplicate nella matrice categoria/serie.
  - Supporto cross-filtering a due dimensioni per etichette composte (`CANALE` + `REGIME`).

## [0.2.4] - 2026-09-21

### Ottimizzato & Risolto
- **Frontend BI Dashboard: Toolbar Compatta, Responsive & Zero Accozzaglia**:
  - **Single-Line Executive Pill Bar (36px)**: altezza ridotta da 70-100px a 36px fissi con sfumatura glassmorphism (`backdrop-filter: blur(10px)`) e tema scuro/chiaro integrato, liberando fino all'80% di spazio verticale per il canvas ECharts.
  - **Micro-Pills con Glowing Status Dots**: sostituzione di bottoni lunghi e testuali con micro-pillole eleganti a punto luminoso (`● Asse 2`, `● Combina [Dim]`, `● Target`), commutatore segmentato `2D / 3D` e switch compatti `↕ Colonne / ↔ Barre` e `☷ Impila`.
  - **Popover 3D a Scomparsa**: rimossi gli slider statici ingombranti dalla toolbar principale, integrati in un popover a scomparsa fluida `⚙️ 3D` attivabile solo al bisogno.
  - **Esportazione Minimale**: micro-pulsanti iconici `📷` e `📊` ultra-compatti.
- **Backend Superset ("k-end"): Progressive Disclosure Completa**:
  - **Zero Duplicati**: rimosso il controllo duplicato `enableToolbar`.
  - **Visibilità Dinamica (`visibility`)**:
    - Controlli 3D visibili solo in modalità `3d`.
    - Controlli 2D (raggio angoli, track) visibili solo in modalità `2d`.
    - Controlli del secondo asse visibili solo in presenza di `secondary_metrics`.
    - Controlli del benchmark visibili solo con `showBenchmark` abilitato.
    - Checkbox della toolbar visibili solo con `enableToolbar` abilitato.
  - **Metriche Riorganizzate**: posizionamento di `secondary_metrics` nella sezione *Query Configuration* per una configurazione dati intuitiva e unificata.

## [0.2.3] - 2026-09-21

### Ottimizzato & Risolto
- **Compatibilità Docker Compose & Frontend Superset 100% Affidabile**:
  - Rimozione delle dipendenze superflue e non importate (`classnames`, `d3-format`, `lodash`) da `package.json`, eliminando qualsiasi potenziale conflitto o discrepanza nei controlli di integrità del lockfile durante `npm ci` nei container Docker (`superset-node`).
  - Correzione automatica del mapping dei servizi in `install-plugin.ps1`: risoluzione dinamica di `superset-node` e `superset` (rispetto ai nomi legacy con underscore `superset_node` / `superset_app`).
  - Pulizia e allineamento automatico dei file pre-compilati `dist/`, `src/` e `assets/` all'aggiornamento di istanze Apache Superset già esistenti, evitando residui o conflitti di cache Webpack/Babel.
- **Showcase Visivo Ufficiale**:
  - Aggiunta dell'immagine di anteprima ad alta risoluzione in `assets/stratumbar_preview.jpg` integrata nella documentazione master.

## [0.2.2] - 2026-09-20

### Aggiunto
- **Universal Agnostic Architecture & Toolbar Configurable dal Backend**:
  - **Nessuna Assunzione o Hardcoding di Dominio**: la dimensione di scomposizione non e' piu' fissa, ma rilevata e iniettata dinamicamente (`breakdownDimName`), adattando automaticamente testi, bottoni e logica di raggruppamento a qualsiasi dataset (es. Reparto, Canale, Fornitore, Regione).
  - **Pannello di Controllo Esplora / Backend ("k-end") Granulare**:
    - Nuova sezione *Barra degli Strumenti Runtime (Interactive Toolbar)* con toggle master `enableToolbar` e controlli individuali per abilitare/disabilitare ciascun pulsante a runtime (`toolbar_show_view_mode`, `toolbar_show_orientation`, `toolbar_show_stacking`, `toolbar_show_dual_axis`, `toolbar_show_breakdown_toggle`, `toolbar_show_benchmark`, `toolbar_show_export`).
    - Possibilita' per gli autori di dashboard di disattivare la toolbar o limitare i toggle a runtime per visualizzatori finali.
  - **Reattivita' 60fps Client-Side in StratumBarChart**:
    - Doppio calcolo e cache di rappresentazione (`standardCategories`/`standardSeries` e `combinedCategories`/`combinedSeries`) in `transformProps.ts` per switch istantaneo client-side.
    - Pulsanti reattivi per Doppio Asse Y (`ON/OFF`), Combina Dimensione (`ON/OFF`) e Target (`ON/OFF`), mostrati unicamente se le rispettive funzionalita' sono configurate nel grafico.
  - **Test Suite Dedicata**: aggiunto test unitario in `test/dualAxis.test.ts` (12/12 test passing).

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
