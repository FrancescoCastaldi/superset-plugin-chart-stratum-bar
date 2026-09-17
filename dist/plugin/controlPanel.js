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
                            multi: false,
                            clearable: false,
                        },
                    },
                ],
                [
                    {
                        name: 'groupby',
                        config: {
                            ...sharedControls.groupby,
                            label: t('Breakdown Dimension (Series)'),
                            description: t('Optional secondary dimension to break bars into series (e.g., Regime: Privato / SSN)'),
                            multi: true,
                        },
                    },
                ],
                [
                    {
                        name: 'metrics',
                        config: {
                            ...sharedControls.metrics,
                            label: t('Metrics'),
                            description: t('Metrics to measure bar height (e.g., Numero Richieste, Fatturato)'),
                        },
                    },
                ],
                [
                    {
                        name: 'target_metric',
                        config: {
                            ...sharedControls.metric,
                            label: t('Target / Benchmark Metric (Optional)'),
                            description: t('Dynamic target metric used to compute benchmark reference lines and delta % per category'),
                            clearable: true,
                        },
                    },
                ],
                ['adhoc_filters'],
                ['row_limit'],
            ],
        },
        {
            label: t('3D Isometric & Volumetric Options'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'viewMode',
                        config: {
                            type: 'SelectControl',
                            label: t('Default View Mode'),
                            description: t('Initial visualization mode (switchable at runtime via the toolbar)'),
                            choices: [
                                ['3d', t('3D Isometrico Volumetrico')],
                                ['2d', t('2D Moderno (Curved & Track)')],
                            ],
                            default: '3d',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'barShape3D',
                        config: {
                            type: 'SelectControl',
                            label: t('3D Bar Shape'),
                            description: t('Geometric shape for 3D rendering: Rectangular Prism or Cylinder'),
                            choices: [
                                ['prism', t('Prisma Rettangolare (Prism)')],
                                ['cylinder', t('Cilindrico (Cylinder)')],
                            ],
                            default: 'prism',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'depth3D',
                        config: {
                            type: 'SliderControl',
                            label: t('3D Depth (px)'),
                            description: t('Isometric extrusion depth of the 3D bars'),
                            min: 5,
                            max: 50,
                            step: 1,
                            default: 20,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'tilt3D',
                        config: {
                            type: 'SliderControl',
                            label: t('3D Tilt Angle (deg)'),
                            description: t('Projection angle of the top and side facets'),
                            min: 15,
                            max: 60,
                            step: 1,
                            default: 25,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'shadow3D',
                        config: {
                            type: 'CheckboxControl',
                            label: t('3D Ground Shadows'),
                            description: t('Render soft ambient ground shadow beneath each 3D bar'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'enableToolbar',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Enable Interactive Runtime Toolbar'),
                            description: t('Show 2D/3D toggle, orientation switch, stacking switch and PNG/CSV exports above the chart'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        {
            label: t('Layout, Stacking & 2D Styling'),
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
                            label: t('Stacking Mode'),
                            description: t('Display series side-by-side or stacked on top of each other'),
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
                        name: 'barBorderRadius',
                        config: {
                            type: 'SliderControl',
                            label: t('Bar Border Radius (2D Mode)'),
                            description: t('Rounded corners for 2D bars'),
                            min: 0,
                            max: 20,
                            step: 1,
                            default: 6,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'showTrackBackground',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Show Track Background (2D Mode)'),
                            description: t('Render subtle background rail behind each bar to indicate maximum scale'),
                            default: false,
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
                            description: t('Display formatted metric values directly on or above bars'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'valuePosition',
                        config: {
                            type: 'SelectControl',
                            label: t('Value Position'),
                            description: t('Where to position the bar value labels'),
                            choices: [
                                ['top', t('Sopra (Top)')],
                                ['inside', t('All’interno (Inside)')],
                                ['outside', t('Esterno (Outside)')],
                            ],
                            default: 'top',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'numberFormat',
                        config: {
                            type: 'SelectControl',
                            freeForm: true,
                            label: t('Number Format'),
                            description: t('D3 format string for numbers (e.g. ,.0f, .2%, $, etc.)'),
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
                    {
                        name: 'color_scheme',
                        config: {
                            type: 'ColorSchemeControl',
                            label: t('Color Scheme'),
                            description: t('Color palette for bars and series'),
                            renderTrigger: true,
                            default: 'supersetColors',
                        },
                    },
                ],
            ],
        },
        {
            label: t('Benchmark Target & Delta % Badges'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'showBenchmark',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Show Benchmark Reference Line'),
                            description: t('Draw a highlighted target benchmark reference line across the chart'),
                            default: false,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'benchmarkType',
                        config: {
                            type: 'SelectControl',
                            label: t('Benchmark Calculation Type'),
                            description: t('How the benchmark value is determined: fixed number, mean average, median, or target metric'),
                            choices: [
                                ['fixed_value', t('Valore Fisso (Fixed Value)')],
                                ['average', t('Media dei Valori (Average)')],
                                ['median', t('Mediana dei Valori (Median)')],
                                ['target_metric', t('Metrica Target (Target Metric)')],
                            ],
                            default: 'fixed_value',
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'benchmarkValue',
                        config: {
                            type: 'TextControl',
                            label: t('Fixed Benchmark Value'),
                            description: t('Numeric target value when Benchmark Calculation is Fixed Value'),
                            default: 100,
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'showDeltaBadge',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Show Delta % Badges'),
                            description: t('Calculate and display percentage deviation badges (+/- %) against benchmark in tooltips and headers'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
                [
                    {
                        name: 'deltaPolarity',
                        config: {
                            type: 'SelectControl',
                            label: t('Delta Polarity'),
                            description: t('Normal: positive is green, negative is red. Inverted: positive is red (e.g. for wait times, cancellations)'),
                            choices: [
                                ['normal', t('Normale (Verde = Positivo, Rosso = Negativo)')],
                                ['inverted', t('Invertito (Rosso = Incremento, es. Tempi/Costi)')],
                            ],
                            default: 'normal',
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
        {
            label: t('Axes, Legend & Cross-Filtering'),
            expanded: false,
            controlSetRows: [
                [
                    {
                        name: 'x_axis_title',
                        config: {
                            type: 'TextControl',
                            label: t('X-Axis Title'),
                            description: t('Custom label displayed at the end of the X axis'),
                            default: '',
                            renderTrigger: true,
                        },
                    },
                    {
                        name: 'y_axis_title',
                        config: {
                            type: 'TextControl',
                            label: t('Y-Axis Title'),
                            description: t('Custom label displayed at the top of the Y axis'),
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
                        },
                    },
                ],
                [
                    {
                        name: 'emit_filter',
                        config: {
                            type: 'CheckboxControl',
                            label: t('Enable Cross-Filtering (Dashboard)'),
                            description: t('Clicking a bar emits a filter event across all linked dashboard charts'),
                            default: true,
                            renderTrigger: true,
                        },
                    },
                ],
            ],
        },
    ],
};
export default config;
//# sourceMappingURL=controlPanel.js.map