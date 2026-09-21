import { sharedControls, } from '@superset-ui/chart-controls';
const t = (str) => str;
const config = {
    controlPanelSections: [
        {
            label: t('Query Configuration'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'x_axis',
                        config: {
                            ...sharedControls.groupby,
                            label: t('X-Axis / Category Dimension'),
                            description: t('Primary category dimension (e.g., Canale di Prenotazione, Reparto, Mese)'),
                            multi: true,
                            clearable: false,
                        },
                    },
                ],
                [
                    {
                        name: 'x_axis_group',
                        config: {
                            ...sharedControls.groupby,
                            label: t('X-Axis Group Dimension (Raggruppamento Ascisse)'),
                            description: t('Dimensione opzionale per raggruppare le ascisse (es. Canale di Prenotazione raggruppato con Regime)'),
                            multi: false,
                            clearable: true,
                        },
                    },
                ],
                [
                    {
                        name: 'groupby',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Breakdown Dimension (Series / Colori)'),
                            description: t('Optional secondary dimension to break bars into series (e.g., Regime: Privato / SSN)'),
                            multi: true,
                        },
                    },
                ],
                [
                    {
                        name: 'combine_category_breakdown',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Etichette Raggruppate su Ascisse (Compound Labels)'),
                            description: t('Concatena le dimensioni direttamente sulle etichette dell\'asse X (es. Canale · Regime: App · SSN, Call center · Convenzioni)'),
                            default: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'metrics',
                        config: {
                            ...sharedControls.metrics,
                            label: t('Primary Metrics (Left Axis)'),
                            description: t('Metrics to measure primary bar height (e.g., Numero Richieste, Fatturato)'),
                        },
                    },
                ],
                [
                    {
                        name: 'metrics',
                        config: {
                            ...sharedControls.metrics,
                            label: t('Primary Metrics (Left Axis)'),
                            description: t('Metrics to measure primary bar height (e.g., Numero Richieste, Fatturato)'),
                        },
                    },
                ],
                ['adhoc_filters'],
                ['row_limit'],
            ],
        },
        {
            label: t('Chart Mode & Visual Engine'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'viewMode',
                        config: {
                            type: 'SelectControl',
                            label: t('View Mode'),
                            description: t('Visualization engine: 3D Isometric or Modern 2D Curved (can also be switched at runtime)'),
                            choices: [
                                ['3d', t('3D Isometrico Volumetrico')],
                                ['2d', t('2D Moderno (Curved & Track)')],
                            ],
                            default: '3d',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'theme_mode',
                        config: {
                            type: 'SelectControl',
                            label: t('Color Theme'),
                            description: t('Visual color theme: Light Enterprise or Dark Obsidian'),
                            choices: [
                                ['light', t('Light Enterprise')],
                                ['dark', t('Dark Obsidian')],
                            ],
                            default: 'light',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'color_scheme',
                        config: {
                            type: 'ColorSchemeControl',
                            label: t('Color Palette'),
                            description: t('Color palette applied to primary bars and grouped series'),
                            renderTrigger: true,
                            default: 'supersetColors',
                        },
                    },
                    {
                        name: 'enable_a11y_decal',
                        config: {
                            type: 'CheckboxControl',
                            label: t('A11y Pattern Decals'),
                            description: t('Enable accessible geometric texture decals for color-blind viewers (W3C A11y)'),
                            default: false,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'custom_colors_json',
                        config: {
                            type: 'TextAreaControl',
                            language: 'json',
                            label: t('Mappa Colori Personalizzata (JSON)'),
                            description: t('Mappa manuale dei colori in formato JSON (es. {"SSN": "#3a6a9b", "Convenzioni": "#1c3d5e", "Solventi": "#bcd5ea"}). Ha massima priorità su palette e dashboard.'),
                            default: '',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'renderer',
                        config: {
                            type: 'SelectControl',
                            label: t('Rendering Engine'),
                            description: t('Canvas (consigliato per 3D ad alte prestazioni) oppure SVG (permette stilizzazione diretta da CSS di dashboard)'),
                            choices: [
                                ['canvas', t('Canvas (Default - Prestazioni 60fps)')],
                                ['svg', t('SVG (Vettoriale - Stilizzabile via CSS)')],
                            ],
                            default: 'canvas',
                            renderTrigger: true,
                        },
                    },
                ],
                // 3D Specific Controls (Only visible when viewMode === '3d')
                [
                    {
                        name: 'barShape3D',
                        config: {
                            type: 'SelectControl',
                            label: t('3D Geometry Shape'),
                            description: t('Geometric shape for 3D rendering: Rectangular Prism or Cylinder'),
                            choices: [
                                ['prism', t('Prisma Rettangolare (Prism)')],
                                ['cylinder', t('Cilindrico (Cylinder)')],
                            ],
                            default: 'prism',
                            renderTrigger: true,
                            visibility: ({ controls }) => controls?.viewMode?.value === '3d',
                        },
                    },
                    {
                        name: 'shadow3D',
                        config: {
                            type: 'CheckboxControl',
                            label: t('3D Ground Shadows'),
                            description: t('Render soft ambient drop shadow beneath each 3D column'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => controls?.viewMode?.value === '3d',
                        },
                    },
                ],
                [
                    {
                        name: 'depth3D',
                        config: {
                            type: 'SliderControl',
                            label: t('3D Depth (px)'),
                            description: t('Isometric extrusion depth of 3D columns in pixels'),
                            min: 5,
                            max: 50,
                            step: 1,
                            default: 20,
                            renderTrigger: true,
                            visibility: ({ controls }) => controls?.viewMode?.value === '3d',
                        },
                    },
                    {
                        name: 'tilt3D',
                        config: {
                            type: 'SliderControl',
                            label: t('3D Tilt Angle (deg)'),
                            description: t('Projection angle of top and side column facets'),
                            min: 15,
                            max: 60,
                            step: 1,
                            default: 25,
                            renderTrigger: true,
                            visibility: ({ controls }) => controls?.viewMode?.value === '3d',
                        },
                    },
                ],
            ],
        },
        {
            label: t('Layout, Labels & 2D Options'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'orientation',
                        config: {
                            type: 'SelectControl',
                            label: t('Orientation'),
                            description: t('Vertical columns or Horizontal bars'),
                            choices: [
                                ['vertical', t('Verticale (Colonne)')],
                                ['horizontal', t('Orizzontale (Barre)')],
                            ],
                            default: 'vertical',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'stacking',
                        config: {
                            type: 'SelectControl',
                            label: t('Series Stacking'),
                            description: t('Display series side-by-side (Grouped) or stacked on top of each other'),
                            choices: [
                                ['none', t('Raggruppate (Grouped)')],
                                ['stack', t('Impilate (Stacked)')],
                            ],
                            default: 'none',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'showValue',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Show Values on Bars'),
                            description: t('Display formatted metric numbers directly on or above bars'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'valuePosition',
                        config: {
                            type: 'SelectControl',
                            label: t('Posizione Valori'),
                            description: t('Posizione e orientamento dei valori numerici sulle barre (Sopra, Dentro, Di traverso)'),
                            choices: [
                                ['top', t('Sopra la barra (Top)')],
                                ['inside', t('Dentro la barra (Inside)')],
                                ['slanted', t('Di traverso (Inclinato 45°)')],
                                ['outside', t('Esterno (Outside)')],
                            ],
                            default: 'top',
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.showValue?.value),
                        },
                    },
                ],
                [
                    {
                        name: 'numberFormat',
                        config: {
                            type: 'SelectControl',
                            freeForm: true,
                            label: t('Primary Number Format'),
                            description: t('D3 format string for primary metrics (e.g. ,.0f, .2%, $, etc.)'),
                            choices: [
                                [',.0f', t('Intero con separatore (1,234)')],
                                [',.2f', t('Decimale 2 cifre (1,234.56)')],
                                ['.2%', t('Percentuale (12.34%)')],
                                ['~s', t('Prefisso SI (1.2k, 3.4M)')],
                            ],
                            default: ',.0f',
                            renderTrigger: true,
                        },
                    },
                ],
                // 2D Specific Options
                [
                    {
                        name: 'barBorderRadius',
                        config: {
                            type: 'SliderControl',
                            label: t('Bar Corner Radius (2D)'),
                            description: t('Rounded corners for 2D bars'),
                            min: 0,
                            max: 20,
                            step: 1,
                            default: 6,
                            renderTrigger: true,
                            visibility: ({ controls }) => controls?.viewMode?.value === '2d',
                        },
                    },
                    {
                        name: 'showTrackBackground',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Track Background (2D)'),
                            description: t('Render subtle background track guide behind each bar indicating maximum scale'),
                            default: false,
                            renderTrigger: true,
                            visibility: ({ controls }) => controls?.viewMode?.value === '2d',
                        },
                    },
                ],
            ],
        },
        {
            label: t('Dual Y-Axis (Secondary Metrics)'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'secondary_metrics',
                        config: {
                            ...sharedControls.metrics,
                            label: t('Secondary Metrics (Right Axis)'),
                            description: t('Optional metrics plotted on the independent right secondary Y-axis (e.g., Tasso %, Degenza Media, Costo Unitario)'),
                            multi: true,
                            validators: [],
                        },
                    },
                ],
                [
                    {
                        name: 'secondary_series_type',
                        config: {
                            type: 'SelectControl',
                            label: t('Secondary Visualization'),
                            description: t('How to render secondary metrics: Smooth Line with markers or Secondary Bars'),
                            choices: [
                                ['line', t('Linea con Indicatori (Line + Markers)')],
                                ['bar', t('Barra Secondaria (Bar)')],
                            ],
                            default: 'line',
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.secondary_metrics?.value && controls.secondary_metrics.value.length > 0),
                        },
                    },
                ],
                [
                    {
                        name: 'y_axis_2_title',
                        config: {
                            type: 'TextControl',
                            label: t('Right Axis Title'),
                            description: t('Custom label displayed on the right secondary Y-axis'),
                            default: '',
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.secondary_metrics?.value && controls.secondary_metrics.value.length > 0),
                        },
                    },
                    {
                        name: 'y_axis_2_format',
                        config: {
                            type: 'SelectControl',
                            freeForm: true,
                            label: t('Right Axis Number Format'),
                            description: t('D3 format string for right Y-axis (e.g. .2% for rates/percentages, ,.2f for currency)'),
                            choices: [
                                ['.2%', t('Percentuale (12.34%)')],
                                [',.2f', t('Decimale 2 cifre (1,234.56)')],
                                [',.0f', t('Intero (1,234)')],
                                ['$,.2f', t('Valuta ($1,234.56)')],
                                ['~s', t('Prefisso SI (1.2k, 3.4M)')],
                            ],
                            default: ',.2f',
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.secondary_metrics?.value && controls.secondary_metrics.value.length > 0),
                        },
                    },
                ],
                [
                    {
                        name: 'secondary_line_color',
                        config: {
                            type: 'TextControl',
                            label: t('Secondary Color'),
                            description: t('Hex color code for the secondary line and right axis (e.g. #ea580c, #f59e0b, #ec4899)'),
                            default: '#ea580c',
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.secondary_metrics?.value && controls.secondary_metrics.value.length > 0),
                        },
                    },
                    {
                        name: 'secondary_line_width',
                        config: {
                            type: 'SelectControl',
                            label: t('Line Thickness'),
                            description: t('Thickness in pixels of the secondary trend line'),
                            choices: [
                                [2, '2px (Sottile)'],
                                [3, '3px (Standard Moderno)'],
                                [4, '4px (Marcato)'],
                            ],
                            default: 3,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.secondary_metrics?.value && controls.secondary_metrics.value.length > 0) &&
                                controls?.secondary_series_type?.value === 'line',
                        },
                    },
                ],
                [
                    {
                        name: 'secondary_area_gradient',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Glowing Area Gradient'),
                            description: t('Render a subtle, glowing color gradient beneath the secondary trend line'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.secondary_metrics?.value && controls.secondary_metrics.value.length > 0) &&
                                controls?.secondary_series_type?.value === 'line',
                        },
                    },
                ],
            ],
        },
        {
            label: t('Benchmark Target & Delta %'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'showBenchmark',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Enable Benchmark Reference Line'),
                            description: t('Draw a highlighted reference benchmark line across the chart'),
                            default: false,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'benchmarkType',
                        config: {
                            type: 'SelectControl',
                            label: t('Benchmark Calculation Type'),
                            description: t('How the benchmark target is computed: fixed number, mean average, median, or target metric'),
                            choices: [
                                ['fixed_value', t('Valore Fisso (Fixed Value)')],
                                ['average', t('Media dei Valori (Average)')],
                                ['median', t('Mediana dei Valori (Median)')],
                                ['target_metric', t('Metrica Target (Target Metric)')],
                            ],
                            default: 'fixed_value',
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.showBenchmark?.value),
                        },
                    },
                ],
                [
                    {
                        name: 'benchmarkValue',
                        config: {
                            type: 'TextControl',
                            label: t('Fixed Target Value'),
                            description: t('Numeric benchmark target when Calculation Type is Fixed Value'),
                            default: 100,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.showBenchmark?.value) && controls?.benchmarkType?.value === 'fixed_value',
                        },
                    },
                    {
                        name: 'target_metric',
                        config: {
                            ...sharedControls.metric,
                            label: t('Dynamic Target Metric'),
                            description: t('Dynamic benchmark target metric (e.g. Budget, Target) used for reference line and delta %'),
                            clearable: true,
                            validators: [],
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.showBenchmark?.value) && controls?.benchmarkType?.value === 'target_metric',
                        },
                    },
                    {
                        name: 'showDeltaBadge',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Show Delta % Badges'),
                            description: t('Calculate and display real-time percentage deviation badges (+/- %) against target'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.showBenchmark?.value),
                        },
                    },
                ],
                [
                    {
                        name: 'deltaPolarity',
                        config: {
                            type: 'SelectControl',
                            label: t('Delta Polarity'),
                            description: t('Normal: positive is green. Inverted: positive is red (essential for wait times, delays, costs)'),
                            choices: [
                                ['normal', t('Normale (Verde = Positivo, Rosso = Negativo)')],
                                ['inverted', t('Invertito (Rosso = Incremento, es. Tempi/Costi)')],
                            ],
                            default: 'normal',
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.showBenchmark?.value && controls?.showDeltaBadge?.value),
                        },
                    },
                ],
            ],
        },
        {
            label: t('Axes & Dashboard Interactivity'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'x_axis_title',
                        config: {
                            type: 'TextControl',
                            label: t('X-Axis Title'),
                            description: t('Custom label displayed at the bottom of the X axis'),
                            default: '',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'y_axis_title',
                        config: {
                            type: 'TextControl',
                            label: t('Left Y-Axis Title'),
                            description: t('Custom label displayed at the top of the primary Y axis'),
                            default: '',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'show_legend',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Show Legend'),
                            description: t('Display series legend'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'legendOrientation',
                        config: {
                            type: 'SelectControl',
                            label: t('Legend Position'),
                            choices: [
                                ['top', t('In alto (Top)')],
                                ['bottom', t('In basso (Bottom)')],
                                ['right', t('A destra (Right)')],
                            ],
                            default: 'top',
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.show_legend?.value),
                        },
                    },
                ],
                [
                    {
                        name: 'emit_filter',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Cross-Filtering (setDataMask)'),
                            description: t('Clicking a bar emits native filter events across all companion dashboard charts'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        {
            label: t('Runtime Dashboard Toolbar'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'enableToolbar',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Enable Runtime Interactive Toolbar'),
                            description: t('Display the sleek, non-intrusive floating toolbar above the chart in dashboard view'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'toolbar_show_view_mode',
                        config: {
                            type: 'CheckboxControl',
                            label: t('2D / 3D Switcher'),
                            description: t('Allow viewers to switch between 2D Modern and 3D Isometric at runtime'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.enableToolbar?.value),
                        },
                    },
                    {
                        name: 'toolbar_show_orientation',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Orientation Toggle (↕ / ↔)'),
                            description: t('Allow viewers to rotate chart between vertical columns and horizontal bars'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.enableToolbar?.value),
                        },
                    },
                ],
                [
                    {
                        name: 'toolbar_show_stacking',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Stacking Toggle'),
                            description: t('Allow viewers to toggle between grouped (side-by-side) and stacked bars'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.enableToolbar?.value),
                        },
                    },
                    {
                        name: 'toolbar_show_dual_axis',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Dual Y-Axis Toggle'),
                            description: t('Allow viewers to toggle the secondary Y-axis on/off at runtime'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.enableToolbar?.value),
                        },
                    },
                ],
                [
                    {
                        name: 'toolbar_show_breakdown_toggle',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Combine Breakdown Dimension Toggle'),
                            description: t('Allow viewers to combine or separate the breakdown dimension on the X-axis at runtime'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.enableToolbar?.value),
                        },
                    },
                    {
                        name: 'toolbar_show_benchmark',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Target / Benchmark Toggle'),
                            description: t('Allow viewers to toggle the benchmark reference line at runtime'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.enableToolbar?.value),
                        },
                    },
                ],
                [
                    {
                        name: 'toolbar_show_export',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Export Buttons (PNG / CSV)'),
                            description: t('Show high-resolution PNG image and CSV aggregated data export buttons'),
                            default: true,
                            renderTrigger: true,
                            visibility: ({ controls }) => Boolean(controls?.enableToolbar?.value),
                        },
                    },
                ],
            ],
        },
    ],
};
export default config;
//# sourceMappingURL=controlPanel.js.map