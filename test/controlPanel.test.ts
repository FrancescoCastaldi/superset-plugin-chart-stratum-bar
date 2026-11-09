import config from '../src/plugin/controlPanel';

describe('StratumBar controlPanel configuration (R3)', () => {
  it('defines 9 control panel sections with proper tabOverride assignments', () => {
    expect(config.controlPanelSections).toHaveLength(9);

    const dataSections = config.controlPanelSections.filter(
      (section: any) => section && section.tabOverride === 'data',
    );
    const customizeSections = config.controlPanelSections.filter(
      (section: any) => section && section.tabOverride === 'customize',
    );

    expect(dataSections.map((s: any) => s.label)).toEqual([
      'Dati',
      'Confronto tra due periodi',
      'Secondo asse (metriche aggiuntive)',
    ]);

    expect(customizeSections.map((s: any) => s.label)).toEqual([
      'Aspetto e motore di disegno',
      'Layout, etichette e valori',
      'Soglia e annotazioni',
      'Asse spezzato (valori anomali)',
      'Assi, legenda e interattività',
      'Barra degli strumenti (in dashboard)',
    ]);
  });

  it('configures metrics control with multi-metric guidance in Dati section', () => {
    const datiSection = config.controlPanelSections.find((s: any) => s && s.label === 'Dati') as any;
    expect(datiSection).toBeDefined();

    const flatControls = datiSection.controlSetRows.flat();
    const metricsControl = flatControls.find((c: any) => c && c.name === 'metrics');
    expect(metricsControl).toBeDefined();
    expect(metricsControl.config.label).toBe('Metriche (altezza delle barre)');
    expect(metricsControl.config.description).toContain('Supporta una o più metriche');
  });

  it('configures standard shifts including 3 months ago and 1 week ago in comparison_shift', () => {
    const comparisonSection = config.controlPanelSections.find(
      (s: any) => s && s.label === 'Confronto tra due periodi',
    ) as any;
    expect(comparisonSection).toBeDefined();

    const flatControls = comparisonSection.controlSetRows.flat();
    const shiftControl = flatControls.find((c: any) => c && c.name === 'comparison_shift');
    expect(shiftControl).toBeDefined();

    const choiceValues = shiftControl.config.choices.map((choice: [string, string]) => choice[0]);
    expect(choiceValues).toContain('1 year ago');
    expect(choiceValues).toContain('3 months ago');
    expect(choiceValues).toContain('1 month ago');
    expect(choiceValues).toContain('52 weeks ago');
    expect(choiceValues).toContain('28 days ago');
    expect(choiceValues).toContain('1 week ago');
  });

  it('refines tooltips for time_comparison_mode, comparison_metric, sort_by, and show_comparison_delta', () => {
    const datiSection = config.controlPanelSections.find((s: any) => s && s.label === 'Dati') as any;
    const comparisonSection = config.controlPanelSections.find(
      (s: any) => s && s.label === 'Confronto tra due periodi',
    ) as any;

    const datiControls = datiSection.controlSetRows.flat();
    const compControls = comparisonSection.controlSetRows.flat();

    const sortBy = datiControls.find((c: any) => c && c.name === 'sort_by');
    expect(sortBy.config.description).toContain('sulla prima metrica');

    const mode = compControls.find((c: any) => c && c.name === 'time_comparison_mode');
    expect(mode.config.description).toContain('confronti multi-metrica');

    const compMetric = compControls.find((c: any) => c && c.name === 'comparison_metric');
    expect(compMetric.config.description).toContain('confronti multi-metrica');

    const delta = compControls.find((c: any) => c && c.name === 'show_comparison_delta');
    expect(delta.config.description).toContain('ciascuna coppia');
  });

  it('preserves all control name identifiers for backward compatibility', () => {
    const allControlNames: string[] = [];
    config.controlPanelSections.forEach((section: any) => {
      if (section && section.controlSetRows) {
        section.controlSetRows.forEach((row: any[]) => {
          row.forEach(ctrl => {
            if (typeof ctrl === 'string') {
              allControlNames.push(ctrl);
            } else if (ctrl && ctrl.name) {
              allControlNames.push(ctrl.name);
            }
          });
        });
      }
    });

    const expectedNames = [
      'x_axis',
      'groupby',
      'combine_category_breakdown',
      'metrics',
      'sort_by',
      'order_desc',
      'adhoc_filters',
      'row_limit',
      'time_comparison_mode',
      'comparison_shift',
      'comparison_metric',
      'time1_label',
      'time2_label',
      'show_comparison_delta',
      'comparison_delta_polarity',
      'viewMode',
      'theme_mode',
      'color_scheme',
      'enable_a11y_decal',
      'barShape3D',
      'shadow3D',
      'depth3D',
      'tilt3D',
      'orientation',
      'stacking',
      'showValue',
      'valuePosition',
      'numberFormat',
      'barBorderRadius',
      'showTrackBackground',
      'secondary_metrics',
      'secondary_series_type',
      'y_axis_2_title',
      'y_axis_2_format',
      'secondary_line_color',
      'secondary_line_width',
      'secondary_area_gradient',
      'show_smart_annotations',
      'showBenchmark',
      'benchmarkType',
      'benchmarkValue',
      'target_metric',
      'showDeltaBadge',
      'deltaPolarity',
      'enable_axis_break',
      'axis_break_mode',
      'axis_break_threshold',
      'x_axis_title',
      'y_axis_title',
      'show_legend',
      'legendOrientation',
      'emit_filter',
      'enableToolbar',
      'toolbar_show_view_mode',
      'toolbar_show_orientation',
      'toolbar_show_stacking',
      'toolbar_show_dual_axis',
      'toolbar_show_breakdown_toggle',
      'toolbar_show_benchmark',
      'toolbar_show_axis_break',
      'toolbar_show_export',
    ];

    expectedNames.forEach(name => {
      expect(allControlNames).toContain(name);
    });
  });
});
