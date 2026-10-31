# Changelog

All notable changes to **StratumBar** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.7] - 2026-10-29

### Fixed
- **Metric deduplication in buildQuery (Duplicate Labels Error Protection)**: introduced the getMetricKey function and preventive deduplication through a Set of keys/labels on candidateMetrics in buildQuery.ts. The possibility of sending Superset metrics with duplicate labels (Duplicate column/metric labels) is eliminated at the root, even when the comparison metric is already included among the primary metrics or is added back in Explore by concurrent browser sessions or cache.

## [0.4.6] - 2026-10-28

### Fixed
- **Native filters invisible to dataset Jinja (`buildQuery.ts`)**: the query object no longer contains `adhoc_filters`. Superset converts native filters into filters readable by `filter_values()` and `get_filters()` only when `adhoc_filters` is empty (`convert_legacy_filters_into_adhoc`); with the field set, virtual datasets with Jinja queries did not see the period and the Escludi Laboratorio filter, and the charts were empty or stuck on the current month. The chart filters and those of `extra_form_data` remain applied: `buildQueryContext` already converts them into `filters` and `extras`.

## [0.4.5] - 2026-10-26

### Changed
- **Non-Blocking Controls (Zero Required Parameters)**: Removed all `validateNonEmpty` constraints and set `clearable: true` and `validators: []` to guarantee full operational flexibility without blocks in the Superset Explore.

## [0.4.4] - 2026-10-26

### Fixed
- **Chronological Time Slots in SQL Query**: `buildQuery.ts` now automatically applies an adhoc SQL CASE orderby for dimensions containing "FASCIA" (e.g. `8-13`, `13-18`, `18-22`, `22-8`) across both `category` and `original` sort modes, ensuring SQL Server returns slot rows in true chronological order instead of alphanumeric string collation.

### Fixed
- **Flexible query controls and chart update unlock (`controlPanel.tsx`)**:
  - Removed the mandatory requirement from `x_axis` and `metrics` (`clearable: true, validators: []`), allowing the chart to be updated and edited in Explore without blocks or formal validation errors.
  - Explicitly made `comparison_metric` optional (`clearable: true, validators: []`) to avoid inheriting `validateNonEmpty` from `sharedControls.metric`.
  - In `buildQuery.ts`, `comparison_metric` is appended only when `time_comparison_mode === 'dual_metric'`.

## [0.4.3] - 2026-10-26
### Added
- **Dynamic decoding of time comparison aliases**: Automatic recognition and labeling in the legend for Tempo 1 vs Tempo 2 series, without cartesian duplication of rows.
- **Secondary trend alignment on dual Y-axis**: Preservation of the color mapping and compatibility with the isometric 3D rendering engine.


## [0.4.2] - 2026-10-25

### Fixed
- **Secondary series category matching (Dual Y-Axis)**: Fixed the misalignment between the format of the combined categories (` · `) and the row filter on the secondary metrics, restoring the correct calculation and tracking of the trends on the secondary Y axis.
- **Secondary series visibility in the legend**: Removed the exclusion of line-type series from the legend and introduced a dedicated `roundRect` icon to clearly identify the secondary metric.
- **Line color preservation in 3D Isometric**: Corrected the propagation of the configured color (`s.color` or `secondary_line_color`) in the volumetric 3D rendering engine.

## [0.4.1] - 2026-10-24

### Added
- **Native support for the PeriodCompare dashboard filter**: Integrated the hook to `extra_form_data.time_compare`. When a native time comparison filter is active on the dashboard, the query configuration automatically sets `time_offsets`, allowing Superset to extract the comparison period series without row multiplication on the database.

## [0.4.0] - 2026-10-19

### Added
- **Interactive Dev Studio Workbench**: Standalone Vite 6 and React 18 development workbench in `dev-studio/` with instant sub-50ms HMR on `http://localhost:5174/`. Includes realistic hospital benchmarks (IDI IRCCS Slice 430), regional commercial benchmarks, extreme axis-break test beds, live Explore controls sidebar, diagnostics drawer, and ECharts options modal.
- **Curated Executive BI Color Palettes**: Added `EXECUTIVE_PALETTE`, `HEALTHCARE_PALETTE`, and `SLATE_DARK_PALETTE` in `src/utils/colors.ts` with dedicated theme selector in Dev Studio.
- **Double-Click Dev Launcher**: Added `dev.bat` for Windows developers.

### Changed
- **Aesthetic Overhaul & Anti-Clipping**:
  - Expanded right grid margin in dual Y-axis mode to 92px/96px, completely eliminating clipping of secondary axis ticks, units, and benchmark line labels.
  - Centered category axis titles (`nameLocation: 'middle'`, `nameGap: 38/42`), resolving corner collisions with the secondary value axis zero.
  - Refined benchmark line badge with anti-clipping pill styling (`insideEndTop` alignment, high-contrast borders, background padding).
  - Polished secondary spline curvature (`smooth: 0.35`), added pearl-white center bullet points with colored borders, and softened area gradient opacity to 15% to maintain visibility of 3D bars underneath.
  - Enhanced 3D cylinder geometry from 12 rim segments to 32 points, achieving silky-smooth curved surfaces without faceted edges.
  - Upgraded value labels typography to Inter font family with enhanced high-contrast text border strokes.
- **Single Minified ESM Bundle via esbuild**: New `scripts/build.mjs` (`npm run build:esm`) bundles `src/index.ts` into `dist/index.esm.js` (ES2020 target, minified, linked source map without embedded sources since `src/` ships with the package). React, `@superset-ui/core`, `@superset-ui/chart-controls` and the modular `echarts/*` paths stay external so the host Superset build provides them. `StratumBarChart.css` is minified and injected at runtime so the bundle is self-contained, while the gallery PNGs stay external (`../src/images/*`) instead of being inlined as ~530 KB data URLs.
- **Build Chain**: `npm run build` keeps the `tsc || node ./node_modules/typescript/lib/tsc.js || npx tsc` fallback chain (grouped so it also works under `cmd.exe`), now emits declarations only and then runs `build:esm`. `main` and `module` both point to the bundle; the per-file JS and source maps are gone from `dist/`, which drops from 374,423 B to about 228 KB. `esbuild` ^0.25 added to `devDependencies`.
- **Modular ECharts Imports**: `StratumBarChart.tsx` imports `echarts/core` and registers only what the chart uses (`BarChart`, `CustomChart` for the isometric 3D bars, `LineChart` for secondary series, grid, tooltip, legend, mark line, mark point and aria components, Canvas and SVG renderers) instead of the full `echarts` package, so the host build can tree-shake the rest of ECharts.
- **Package Metadata**: `sideEffects` set to `["*.css"]` so bundlers can tree-shake every JS module while keeping the stylesheet import that Superset compiles from `src/`.
- **Stricter TypeScript**: `noUnusedLocals` and `noUnusedParameters` enabled; unused imports, unused form data destructuring and the dead `getColName`/`findRowKey` helpers in `transformProps.ts` were removed with no behavior change.

### Removed
- **Dead Type Packages `@types/lodash` and `@types/d3-format`**: neither `lodash` nor `d3-format` is imported anywhere in `src/` or `test/`.
- **One-off Codemod Scripts `refactor.js` and `refactor_transform.js`**: vestigial top-level scripts from an earlier refactor, not referenced by any npm script or installer.

## [0.3.20] - 2026-10-08

### Changed
- **Renderer Decomposition (no visual change)**: `get3DBarOption` (`renderers3D.ts`) and `get2DBarOption` (`renderers2D.ts`) were split into pure, individually tested modules:
  - `utils/isometricGeometry.ts`: isometric depth offsets, ellipse sampling, stacked/grouped bar sizing and group offsets, 3D bar rectangle with minimum-length enforcement, pedestal / zero-footprint / prism-face points, cylinder body and cap points, axis-break cut-mark anchor and 3D value-label placement.
  - `utils/barLayout.ts`: 3D stack bases and axis ceiling, 2D value extent, signed bar border radius.
  - `utils/seriesScaffolding.ts`: building blocks shared by both series loops (selection/opacity, benchmark and axis-break mark lines, smart-annotation pins, secondary line series, axis arrangement).
  - `components/isometricShapes.ts`: theme-aware ECharts graphic elements of the 3D bars (pedestal, prism, cylinder, labels, cut mark).
- Public exports, control panel and `transformProps` output are unchanged.

### Added
- **Renderer Characterization Suite** (`test/rendererCharacterization.test.ts`): 17 representative 2D/3D inputs whose serialized ECharts options (including `renderItem` output on mock coordinate systems and formatter output) were frozen against v0.3.19 in `test/__fixtures__/rendererOptions.fixture.json`; the refactored renderers reproduce the fixture byte for byte.
- Unit tests for the extracted geometry, layout and scaffolding modules and for `plugin/seriesBuilder.ts` (single/multi metric, breakdown, combined labels, pivoted data, secondary metrics, sorting).

## [0.3.19] - 2026-10-07

### Fixed
- **Rigid idempotence of the registration in `MainPreset.ts`**: Rewrote the patch phase of `install-plugin.ps1` to align it with the suite standards: exact line-by-line check of the canonical form `new StratumBarChartPlugin().configure({ key: 'stratum_bar' }),` (standard 8-space indentation), normalization of legacy variants (`.register()` lines, anomalous indentation, duplicates) instead of duplication, preservation of the file's original line endings, and UTF-8 writing without BOM.

### Changed
- **Consistency of `dist/` and `package-lock.json`**: Regenerated `dist/` via `npm run build`, verifying a byte-for-byte match with the committed artifacts (`git status` clean on `dist/**`), and synced `package-lock.json` with the current devDependencies of `package.json`.

## [0.3.18] - 2026-10-05

### Fixed
- **Elastic and resilient dimension resolution (`transformPropsUtils.ts`)**:
  - Implemented exhaustive extraction of identification candidates for the selected columns (`column_name`, `sqlExpression`, `label`, `name`, `verbose_name`), fixing at the root the misalignment when Explore exposes labels with spaces (e.g. `Regime di Erogazione`) but the SQL query returns camelCase or space-free physical identifiers (e.g. `RegimeErogazione`).
  - Introduced multi-step matching in `findRowKey`: exact match, case-insensitive match and alphanumeric normalization without separators.
  - Added a dynamic categorical fallback for `actualBreakdownKey` that automatically assigns the remaining qualitative column present in the row when the configured name does not match literally.
  - Implemented automatic deduplication between the primary axis (`x_axis`) and the series (`groupby`): if the same dimension is entered both as axis and as breakdown, it is automatically excluded from the breakdown to prevent redundant series.

## [0.3.17] - 2026-10-02

### Changed
- **Query Configuration Ergonomics & UI Cleanup (`controlPanel.tsx`)**:
  - Made the essential fields `x_axis` (*X-Axis / Categoria Principale*) and `metrics` (*Metrica Principale*) mandatory with the `validateNonEmpty` validator, and disabled `clearable` to prevent accidental empty queries.
  - Definitively removed any ambiguity between `x_axis_group` and `groupby`: the split of the bars into colored series is now handled exclusively by `groupby` (*Serie / Breakdown per Colore*).
  - Made the `combine_category_breakdown` control (*Etichette Composte su Ascisse*) conditional and context-aware, visible only when at least one dimension is in Breakdown.
  - Set `sort_by` with default option `'original'` (*Ordine Originale / Query*) to strictly preserve the native ordering of datasets and SQL queries, allowing natural/chronological ordering on explicit request.

## [0.3.16] - 2026-10-02

### Added
- **Smart Annotations (Max/Min Highlight)**: Added automatic dynamic annotations (`🏆` for Max, `📉` for Min) to ECharts series using `markPoint`, both in 2D and 3D mode.

### Changed
- **Control Panel Simplification**: Completely revamped the `controlPanel.tsx` UI. Removed confusing and overly technical configurations (`custom_colors_json`, `renderer`, `x_axis_group`, `combine_category_breakdown`).
- **Benchmark Discovery**: Surfaced the pre-existing Target/Benchmark configuration from the hidden legacy sections to a prominent "Analisi Avanzata (Target & Annotazioni)" tab.
- **3D Render Optimization (`renderers3D.ts`)**: Upgraded the material rendering on 3D prisms. The front face now uses a linear gradient (`adjustColorBrightness`) to simulate a specular highlight and glossy volume (glass/metal effect).
- **2D Aesthetics**: Adjusted corner radii in 2D mode for a cleaner, modern look.

## [0.3.15] - 2026-09-30

### Added
- **Natural & Chronological Category Sorting Engine (`src/utils/sortingUtils.ts`)**:
  - Implemented `sortCategories` and `getCategoryRank` for intelligent dimension sorting when `sort_by === 'category'`.
  - Added native awareness for hospital and business time slots (`8–13`, `13–18`, `18–22`, `22–8`, `08-13`, `08:00 - 13:00`), handling en-dashes (`–`), hyphens (`-`), slashes, and leading zeros.
  - Automatically sorts time slots chronologically from left to right: `8–13` (Mattina) ➔ `13–18` (Pomeriggio) ➔ `18–22` (Sera) ➔ `22–8` (Notte).
  - Added support for Italian and English day names (`Lunedì` .. `Domenica`), month names (`Gennaio` .. `Dicembre`), numbered prefixes (`1 - Lunedì`), and natural alphanumeric collation (`2` < `10`, ISO dates).
  - Comprehensive unit test suite in `test/sortingUtils.test.ts`.

### Changed
- **Series Representation Sorting Integration (`seriesBuilder.ts` & `transformProps.ts`)**:
  - Integrated `sortCategories` in `buildSeriesRepresentation`, ensuring that `repCategories` and associated series data arrays are arranged in chronological order before passing them to Apache ECharts.
  - Passed `sortBy` and `isOrderDesc` from `transformProps.ts` into `buildSeriesRepresentation`.

## [0.3.14] - 2026-09-30

### Added
- **Configurable Universal Sorting (`controlPanel.tsx` & `types.ts`)**:
  - Added `sort_by` control (`'category'` vs `'metric'`) in Explore Query section, allowing the user to explicitly choose whether to sort by Category Dimension (e.g. Days of the week Lun-Dom, chronological Months, time slots, A-Z) or by Metric Value (Top N rankings).
  - Added `order_desc` checkbox control (`Sort Descending`) to toggle ascending vs descending order across both category and metric sorting modes.
  - Added `SortByMode` type and `sort_by` field to `StratumBarFormData` in `types.ts`.

### Changed
- **Deterministic SQL OrderBy Generation (`buildQuery.ts`)**:
  - Refactored `buildQuery.ts` ordering engine to dynamically translate `sort_by` and `order_desc` into SQL `ORDER BY` expressions:
    - `sort_by === 'category'`: generates `ORDER BY [CategoryColumn] ASC` (or `DESC` if `order_desc: true`), perfectly preserving chronological months and Monday-Sunday calendar sequences.
    - `sort_by === 'metric'`: generates `ORDER BY [Metric] DESC` (or `ASC` if `order_desc: false`), providing true Top N or Bottom N volume rankings.

## [0.3.13] - 2026-09-30

### Fixed
- **Query Metric Ordering Injection (`buildQuery.ts`)**:
  - Implemented explicit `orderby` injection into `QueryObject` based on `fd.order_desc !== false` and `sortMetric` (`fd.timeseries_limit_metric` or primary resolved metric).
  - Enables true Top-N query generation (e.g. `ORDER BY [Metric] DESC` with `row_limit: 10`) instead of default unordered or arbitrary table sampling.
- **Horizontal Bar Top-to-Bottom Inverted Y-Axis (`echartsUtils.ts`)**:
  - Added `inverse: !isVertical` to `getCategoryAxisConfig` on category axes.
  - Ensures Top 1 categories rank naturally at the top of horizontal bar charts, flowing downwards to rank N, eliminating inverted display orders.
- **ECharts Series-Bar Label Position Fix (`renderers2D.ts`)**:
  - Replaced unsupported callback function in `label.position` with standard string position (`position: valuePosition === 'inside' || stacking !== 'none' ? 'inside' : (isVertical ? 'top' : 'right')`).
  - Completely fixes label collapse / overlap at the origin/base of the bars, rendering values cleanly to the right of horizontal bars with proper padding (`distance: 8`) and high-contrast text stroke.

## [0.3.12] - 2026-09-29

### Fixed
- **X-Axis Single Dimension Enforcement & Unhashable Type Fix (`controlPanel.tsx` & `buildQuery.ts`)**:
  - Set `multi: false` for `x_axis` control in `controlPanel.tsx` to match Superset core standards, preventing dimensions from being serialized as an array of strings in chart formData.
  - Added defensive sanitization in `buildQuery.ts` ensuring `formData.x_axis` and `formData.x_axis_group` are unwrapped to scalar strings before invoking `buildQueryContext`, completely eliminating backend `TypeError: unhashable type: 'list'` (Issue 1011 / DB engine error) across Dashboards and Explore views.

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
- **Broken Axis & Outlier Management (Axis Break / Outlier Pinning `//`)**:
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

### Fixed
- **Legend colors not matching the bars**: the ECharts legend used the internal colors generated by the engine instead of those explicitly assigned per series (dashboard `label_colors`, manual JSON map, palette). Added `data: legendData` to the legend configuration with `itemStyle.color` based on the `color` field of each series (both 2D and 3D).
- **Invisible values in stacked mode**: the labels were positioned at `'top'` (outside the bar) for all series, making them invisible or overlapping in the intermediate segments. Set `position: 'inside'` when `stacking !== 'none'` and added automatic suppression for segments below 1.5% of the maximum value.
- **Text overflow in horizontal mode**: the label values at the right end of the bar went outside the chart area. Dynamically increased the right grid padding (`grid.right`) to 60px (without dual axis) and 90px (with dual axis) in horizontal mode.

## [0.2.8] - 2026-09-21

### Fixed
- **Visibility and stacking context of the 3D settings micro popover (`⚙️ 3D`)**:
  - Fixed the issue where the 3D settings popup was invisible or slipped behind the ECharts canvas.
  - Set `overflow: visible` on the toolbar containers `.stratum-bar-toolbar` and `.stratum-bar-toolbar-right`, confining horizontal scrolling to `.stratum-bar-toolbar-left`, so that the fixed bar height would not cut off dropdown menus or open popovers.
  - Assigned `z-index: 1000` to the toolbar, `z-index: 999999 !important` to the `.stratum-bar-popover` popover with `pointer-events: auto`, and `z-index: 1` to the `.stratum-bar-canvas-container` canvas container.
  - Added a `handleClickOutside` listener to close the popover smoothly and naturally when clicking anywhere outside the page or the chart.

## [0.2.7] - 2026-09-21

### Added
- **Full responsiveness to native dashboard filters (`buildQuery.ts`)**:
  - Explicit and resilient merging and preservation of all native filters (`extra_form_data.filters`) and ad-hoc filters (`extra_form_data.adhoc_filters`), ensuring that changes of period, site, branch, clinic or channel instantly update the query and the chart data.
  - Synchronization of `series_columns` with the breakdown dimension for the automatic update of the dashboard context.
- **Advanced cross-filtering with toggle deselection and visual dimming**:
  - Full support for cross-filter interaction: on clicking a bar, the chart emits native filters on `CANALE` and `REGIME` via `setDataMask` to all the charts of the dashboard.
  - Implemented two-way toggle deselection: clicking again on the bar or category already selected automatically removes the filter, bringing all the charts back to the global state.
  - Immediate visual feedback: unselected bars are faded (`opacity: 0.28`), highlighting the active bar or category in 2D and 3D.
- **Dynamic color palette management (Dashboard, JSON and CSS)**:
  - **Full inheritance from the dashboard (`label_colors`)**: absolute priority to the colors defined in the dashboard (`json_metadata.label_colors`, e.g. `SSN: #3a6a9b`, `Convenzioni: #1c3d5e`, `Libera professione: #7aa8cf`, `Solventi: #bcd5ea`), with support for exact and case-insensitive matching and for splitting composite labels (`Canale · Regime`).
  - **Manual JSON mapping (`custom_colors_json`)**: new control in the backend/Explore to override or manually define a JSON color map (`{"SSN": "#3a6a9b", ...}`).
  - **Direct customization via CSS**: support for CSS custom properties on the container (e.g. `--color-ssn`, `--stratum-color-ssn`) to apply custom styles and palettes directly from the dashboard CSS panel.
  - **Rendering engine choice (`renderer`)**: option to select `Canvas` (default, maximum performance at 60fps) or `SVG` (vector, allows direct overriding of styles from the DOM via CSS).

## [0.2.6] - 2026-09-21

### Fixed
- **Backend query dimensions alignment (`groupby: columns`)**:
  - Fixed a critical precedence problem in the Superset query builder: when `groupby` is present in `baseQueryObject` from `formData`, the Superset backend could ignore `columns` and group only by `groupby`, omitting the X-axis dimensions (e.g. `CANALE`) from the SQL query.
  - Explicitly synchronized `groupby: columns` in the query object returned by `buildQuery.ts`, ensuring that all dimensions (`x_axis`, `x_axis_group`, `groupby`) are always present both in the `SELECT` clause and in the database `GROUP BY`.

## [0.2.5] - 2026-09-21

### Added
- **Explicit X-axis grouping control (`x_axis_group`)**:
  - Added the dedicated control `X-Axis Group Dimension (Raggruppamento Ascisse)` in *Query Configuration* to allow the immediate configuration of aggregated dimensions on the X axis (e.g. Canale di Prenotazione grouped with Regime).
  - Support for multiple selection on `x_axis` (`multi: true`), which allows freely selecting several dimensions directly on the X axis.
- **Flexible grouping on the X axis**:
  - Moved the `combine_category_breakdown` control ("Etichette Raggruppate su Ascisse - Compound Labels") directly into the primary *Query Configuration* section.
  - Highly readable display with a dot separator (`Canale · Regime`, e.g. `App · SSN`, `Call center · Convenzioni`), keeping the colors consistent per series and the legend of the individual regimes.
  - Robust summing aggregation for multiple or duplicate rows in the category/series matrix.
  - Two-dimension cross-filtering support for composite labels (`CANALE` + `REGIME`).

## [0.2.4] - 2026-09-21

### Optimized & Fixed
- **BI dashboard frontend: compact, responsive toolbar and zero clutter**:
  - **Single-Line Executive Pill Bar (36px)**: height reduced from 70-100px to a fixed 36px, with a glassmorphism effect (`backdrop-filter: blur(10px)`) and an integrated dark/light theme, freeing up to 80% of the vertical space for the ECharts canvas.
  - **Micro-pills with glowing status dots**: replaced long text buttons with elegant micro-pills with a glowing dot (`● Asse 2`, `● Combina [Dim]`, `● Target`), a segmented `2D / 3D` switch and compact `↕ Colonne / ↔ Barre` and `☷ Impila` switches.
  - **Collapsible 3D popover**: removed the bulky static sliders from the main toolbar and integrated them into a smooth collapsible `⚙️ 3D` popover that opens only when needed.
  - **Minimal export**: ultra-compact iconic micro-buttons `📷` and `📊`.
- **Superset backend ("k-end"): complete progressive disclosure**:
  - **No duplicates**: removed the duplicate `enableToolbar` control.
  - **Dynamic visibility (`visibility`)**:
    - 3D controls visible only in `3d` mode.
    - 2D controls (corner radius, track) visible only in `2d` mode.
    - Second axis controls visible only when `secondary_metrics` are present.
    - Benchmark controls visible only when `showBenchmark` is enabled.
    - Toolbar checkboxes visible only when `enableToolbar` is enabled.
  - **Metrics reorganized**: placement of `secondary_metrics` in the *Query Configuration* section for an intuitive and unified data configuration.

## [0.2.3] - 2026-09-21

### Optimized & Fixed
- **Docker Compose and Superset frontend compatibility, 100% reliable**:
  - Removed the superfluous and unimported dependencies (`classnames`, `d3-format`, `lodash`) from `package.json`, eliminating any potential conflict or mismatch in the lockfile integrity checks during `npm ci` in the Docker containers (`superset-node`).
  - Automatic correction of the service mapping in `install-plugin.ps1`: dynamic resolution of `superset-node` and `superset` (instead of the legacy underscore names `superset_node` / `superset_app`).
  - Automatic cleanup and alignment of the precompiled `dist/`, `src/` and `assets/` files when updating existing Apache Superset instances, avoiding leftovers or Webpack/Babel cache conflicts.
- **Official visual showcase**:
  - Added the high-resolution preview image `assets/stratumbar_preview.jpg`, included in the master documentation.

## [0.2.2] - 2026-09-20

### Added
- **Universal agnostic architecture and toolbar configurable from the backend**:
  - **No domain assumptions or hardcoding**: the breakdown dimension is no longer fixed, but detected and injected dynamically (`breakdownDimName`), automatically adapting texts, buttons and grouping logic to any dataset (e.g. Reparto, Canale, Fornitore, Regione).
  - **Granular Explore / backend ("k-end") control panel**:
    - New section *Barra degli Strumenti Runtime (Interactive Toolbar)* with a master `enableToolbar` toggle and individual controls to enable or disable each button at runtime (`toolbar_show_view_mode`, `toolbar_show_orientation`, `toolbar_show_stacking`, `toolbar_show_dual_axis`, `toolbar_show_breakdown_toggle`, `toolbar_show_benchmark`, `toolbar_show_export`).
    - Dashboard authors can disable the toolbar or limit the runtime toggles for end viewers.
  - **60fps client-side responsiveness in StratumBarChart**:
    - Double computation and representation cache (`standardCategories`/`standardSeries` and `combinedCategories`/`combinedSeries`) in `transformProps.ts` for instant client-side switching.
    - Reactive buttons for Dual Y-Axis (`ON/OFF`), Combine Dimension (`ON/OFF`) and Target (`ON/OFF`), shown only if the respective features are configured in the chart.
  - **Dedicated test suite**: added unit test in `test/dualAxis.test.ts` (12/12 tests passing).

## [0.2.1] - 2026-09-20

### Added
- **Design System & advanced tangible aesthetics**:
  - **Glassmorphism tooltip with backdrop blur**: interactive tooltips with a frosted glass effect (`backdrop-filter: blur(8px)`), semi-transparent borders, tabular-nums font and delta badges aligned for primary metrics vs target.
  - **Glowing area gradient**: a luminous, faded gradient under the second-axis line (`secondary_area_gradient`) for a hybrid bars + trend view.
  - **Color-coded axis matching**: automatic color and visual synchronization between the secondary line, right axis, numeric labels and title.
  - **Dark Obsidian & Light Enterprise Mode**: full support for light and dark themes (`theme_mode: 'light' | 'dark'`) with WCAG-optimized contrast.
  - **Accessible textures and geometric patterns (W3C A11y Decals)**: distinct geometric patterns that can be enabled for colorblind users (`enable_a11y_decal`).
- **Refinement of the data transformation engine**:
  - Fixed a conflict in series extraction from non-pivoted dataframes: strict isolation of the secondary metrics from the primary bars.

## [0.2.0] - 2026-09-20

### Added
- **Full dual Y-axis support (Dual Y-Axis)**:
  - Enabled the independent second Y axis on the right (or at the top with horizontal orientation) for both the 2D and the 3D Isometric engine.
  - Dynamic assignment of `yAxisIndex: 1` for the tracked secondary metrics.
  - Support for a hybrid secondary view: **smoothed line with markers (Line + Markers)** overlaid on the columns/bars, or secondary bars.
  - Dedicated, independent number format for the second axis (`y_axis_2_format`, e.g. percentages `.2%` or currencies) and a dedicated title (`y_axis_2_title`).
- **Multi-dimension grouping and combined breakdown**:
  - Simultaneous extraction and aggregation of primary and secondary metrics in `buildQuery.ts`.
  - Support for the `combine_category_breakdown` parameter: unified display of the labels on the axis (`Categoria [Regime]`, e.g. *Cardiologia [SSN]* and *Cardiologia [Privato]*).
- **Dedicated test suite**:
  - Added Jest unit test suite [`test/dualAxis.test.ts`](file:///D:/Sviluppo/superset-plugins/superset-plugin-chart-stratum-bar/test/dualAxis.test.ts) (10/10 tests passing).

---

## [0.1.0] - 2026-09-17

### Added
- **Plugin initialization**: creation of the `superset-plugin-chart-stratum-bar` plugin compatible with Apache Superset (versions 3.x, 4.x, 6.x).
- **Dual 2D/3D rendering engine**:
  - 3D Isometric engine with polygonal geometric projections on a 2D canvas, three-face directional lighting (front, side, top cap) and ground shadows at 60 fps with zero WebGL overhead.
  - Modern 2D engine with configurable rounded corners (`barBorderRadius`), color gradients and transparent scale guides (**Track Background**).
- **Benchmark & Delta % module**:
  - Support for a fixed reference target, arithmetic mean, median or a dynamic target metric per category.
  - Calculation and display of percentage deviation badges (`+X%` / `-Y%`) with normal polarity (green for increase, red for decrease) or inverted polarity.
- **Interactive runtime toolbar**:
  - Quick 2D / 3D switch.
  - Orientation switch (Vertical / Horizontal).
  - Grouping switch (side-by-side or stacked bars).
  - Interactive sliders to adjust the tilt angle (Tilt) and the depth (Depth) in 3D mode.
  - Instant high-resolution export to PNG and download of the aggregated data in CSV format.
- **Cross-Filtering**:
  - Native integration with the Superset filter engine (`setDataMask` and extraFormData).
- **Resilient installation suite**:
  - `install-plugin.ps1` compliant with the *Chart Plugins Golden Rule*, with an automatic `npm install` pre-flight, a fallback chain for the build, a `MainPreset.ts.bak` backup and idempotent registration.
  - `install.bat` for immediate execution.
- **Test suite**:
  - Jest unit tests for props transformation, multi-series partitioning, benchmark calculation and 2D/3D renderers.
- **Interactive demo**:
  - Standalone file `examples/interactive_preview.html` based on the real IDI IRCCS Slice 430 dataset (*ADS - Richieste per canale di prenotazione e regime*).
