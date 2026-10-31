import {
  ControlPanelConfig,
  ControlPanelsContainerProps,
  sharedControls,
} from '@superset-ui/chart-controls';

const t = (str: string) => str;

const config: ControlPanelConfig = {
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
              label: t('X-Axis / Categoria Principale'),
              description: t('Primary dimension for the X axis categories (e.g. month, department, channel)'),
              multi: false,
              clearable: true,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'groupby',
            config: {
              ...sharedControls.groupby,
              label: t('Series / breakdown by color'),
              description: t('Optional dimension to split the bars into distinct colored series (e.g. regime: private / public)'),
              multi: true,
              clearable: true,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'combine_category_breakdown',
            config: {
              type: 'CheckboxControl',
              label: t('Compound labels on the axis'),
              description: t('Show category and series together on the X axis instead of side-by-side bars'),
              default: false,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.groupby?.value && (controls.groupby.value as any[]).length > 0),
            },
          },
        ],
        [
          {
            name: 'metrics',
            config: {
              ...sharedControls.metrics,
              label: t('Main metric (bar value)'),
              description: t('Numeric metric that sets the bar height (e.g. number of requests, revenue)'),
              clearable: true,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'sort_by',
            config: {
              type: 'SelectControl',
              label: t('Criterio di Ordinamento (Sort By)'),
              description: t('Choose whether to sort by category or dimension (e.g. days Mon-Sun, months in order) or by metric value (e.g. top N rankings)'),
              choices: [
                ['original', t('Ordine Originale / Query')],
                ['category', t('Category / dimension (e.g. Mon-Sun, months, A-Z)')],
                ['metric', t('Metric value (e.g. top N, request volume)')],
              ],
              default: 'original',
              renderTrigger: false,
            },
          },
          {
            name: 'order_desc',
            config: {
              type: 'CheckboxControl',
              label: t('Descending sort'),
              description: t('When on: Z-A or the highest value on top. When off: A-Z or 1-7 in order, or the lowest value on top.'),
              default: false,
              renderTrigger: false,
            },
          },
        ],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: t('Time comparison (Time 1 vs Time 2)'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'time_comparison_mode',
            config: {
              type: 'SelectControl',
              label: t('Time comparison mode'),
              description: t('Choose how to feed the comparison: paired metrics (anti-Cartesian) or native Superset time offsets'),
              choices: [
                ['none', t('Off (single period)')],
                ['dual_metric', t('Paired metrics (e.g. richieste_corr vs richieste_conf)')],
                ['time_offsets', t('Time Offsets Nativi Superset (__1 year ago)')],
              ],
              default: 'none',
              renderTrigger: false,
            },
          },
        ],
        [
          {
            name: 'comparison_metric',
            config: {
              ...sharedControls.metric,
              label: t('Comparison period metric (Time 2)'),
              description: t('Select the metric of the second period to pair it with the main metric'),
              clearable: true,
              validators: [],
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.time_comparison_mode?.value === 'dual_metric',
            },
          },
        ],
        [
          {
            name: 'time1_label',
            config: {
              type: 'TextControl',
              label: t('Time 1 label (reference)'),
              description: t('Name shown for the main period. Supports dynamic tokens or an explicit name (e.g. October 2026, Current)'),
              default: 'Time 1 (reference)',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.time_comparison_mode?.value !== 'none',
            },
          },
          {
            name: 'time2_label',
            config: {
              type: 'TextControl',
              label: t('Time 2 label (comparison)'),
              description: t('Name shown for the comparison period (e.g. October 2025, Previous year)'),
              default: 'Time 2 (comparison)',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.time_comparison_mode?.value !== 'none',
            },
          },
        ],
        [
          {
            name: 'show_comparison_delta',
            config: {
              type: 'CheckboxControl',
              label: t('Show delta % and comparison deviations'),
              description: t('Calculates and shows in the tooltips and above the bars the percentage and absolute deviation between Time 1 and Time 2'),
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.time_comparison_mode?.value !== 'none',
            },
          },
          {
            name: 'comparison_delta_polarity',
            config: {
              type: 'SelectControl',
              label: t('Polarita Scostamento Comparativo'),
              description: t('Normale: incremento verde, decremento rosso. Invertito: incremento rosso (adatto per tempi di attesa o costi).'),
              choices: [
                ['normal', t('Normale (Verde = Crescita, Rosso = Calo)')],
                ['inverted', t('Invertita (Rosso = Crescita, Verde = Calo)')],
              ],
              default: 'normal',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.time_comparison_mode?.value !== 'none' && Boolean(controls?.show_comparison_delta?.value),
            },
          },
        ],
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
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '3d',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '3d',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '3d',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '3d',
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
                ['vertical', t('Vertical (columns)')],
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
              label: t('Value position'),
              description: t('Position and orientation of the numeric values on the bars (above, inside, slanted)'),
              choices: [
                ['top', t('Above the bar (top)')],
                ['inside', t('Inside the bar (inside)')],
                ['slanted', t('Di traverso (Inclinato 45°)')],
                ['outside', t('Esterno (Outside)')],
              ],
              default: 'top',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.showValue?.value),
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
                ['.2%', t('Percentage (12.34%)')],
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
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '2d',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '2d',
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
                ['bar', t('Secondary bar (bar)')],
              ],
              default: 'line',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.secondary_metrics?.value && (controls.secondary_metrics.value as any[]).length > 0),
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.secondary_metrics?.value && (controls.secondary_metrics.value as any[]).length > 0),
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
                ['.2%', t('Percentage (12.34%)')],
                [',.2f', t('Decimale 2 cifre (1,234.56)')],
                [',.0f', t('Intero (1,234)')],
                ['$,.2f', t('Valuta ($1,234.56)')],
                ['~s', t('Prefisso SI (1.2k, 3.4M)')],
              ],
              default: ',.2f',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.secondary_metrics?.value && (controls.secondary_metrics.value as any[]).length > 0),
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.secondary_metrics?.value && (controls.secondary_metrics.value as any[]).length > 0),
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.secondary_metrics?.value && (controls.secondary_metrics.value as any[]).length > 0) &&
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.secondary_metrics?.value && (controls.secondary_metrics.value as any[]).length > 0) &&
                controls?.secondary_series_type?.value === 'line',
            },
          },
        ],
      ],
    },
    {
      label: t('Analisi Avanzata (Target & Annotazioni)'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'show_smart_annotations',
            config: {
              type: 'CheckboxControl',
              label: t('Smart Annotations (Max/Min Highlight)'),
              description: t('Automatically highlights the highest and lowest peaks in the chart with dynamic labels (🏆/📉).'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'showBenchmark',
            config: {
              type: 'CheckboxControl',
              label: t('Show threshold line (target)'),
              description: t('Draws a horizontal reference line to compare the values.'),
              default: false,
              renderTrigger: true,
            },
          },
          {
            name: 'benchmarkType',
            config: {
              type: 'SelectControl',
              label: t('Tipo di Calcolo Target'),
              description: t('How to compute the threshold: fixed manual value, average, median or dynamic metric.'),
              choices: [
                ['fixed_value', t('Fixed value')],
                ['average', t('Average of values')],
                ['median', t('Median of values')],
                ['target_metric', t('Target metric')],
              ],
              default: 'fixed_value',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.showBenchmark?.value),
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.showBenchmark?.value) && controls?.benchmarkType?.value === 'fixed_value',
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.showBenchmark?.value) && controls?.benchmarkType?.value === 'target_metric',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.showBenchmark?.value),
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.showBenchmark?.value && controls?.showDeltaBadge?.value),
            },
          },
        ],
      ],
    },
    {
      label: t('✂️ Broken axis & outlier handling (axis break)'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'enable_axis_break',
            config: {
              type: 'CheckboxControl',
              label: t('Enable broken axis / outlier capping'),
              description: t('Cuts the scale of the anomalous outlier bars, preserving the proportions and readability of the smaller bars, and keeping the real absolute value on top'),
              default: false,
              renderTrigger: true,
            },
          },
          {
            name: 'axis_break_mode',
            config: {
              type: 'SelectControl',
              label: t('Threshold calculation mode'),
              description: t('Metodo per determinare il punto di taglio: Automatico (rileva skewness), Percentile 90, Percentile 95, o Manuale'),
              choices: [
                ['auto', t('Automatico Smart (Auto Outlier Detection)')],
                ['p90', t('Percentile 90 (P90)')],
                ['p95', t('Percentile 95 (P95)')],
                ['manual', t('Fixed manual threshold')],
              ],
              default: 'auto',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enable_axis_break?.value),
            },
          },
        ],
        [
          {
            name: 'axis_break_threshold',
            config: {
              type: 'TextControl',
              label: t('Manual cut threshold'),
              description: t('Maximum scale value above which the bars are cut, with the marker //'),
              default: 150,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.enable_axis_break?.value) && controls?.axis_break_mode?.value === 'manual',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.show_legend?.value),
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
        ],
        [
          {
            name: 'toolbar_show_axis_break',
            config: {
              type: 'CheckboxControl',
              label: t('Broken axis toolbar button (✂️)'),
              description: t('Shows the "✂️ Broken axis" button on the toolbar at runtime'),
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
          {
            name: 'toolbar_show_export',
            config: {
              type: 'CheckboxControl',
              label: t('Export Buttons (PNG / CSV)'),
              description: t('Show high-resolution PNG image and CSV aggregated data export buttons'),
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
