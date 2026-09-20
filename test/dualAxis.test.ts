import transformProps from '../src/plugin/transformProps';
import { get2DBarOption } from '../src/components/renderers2D';
import { get3DBarOption } from '../src/components/renderers3D';
import { ChartProps } from '@superset-ui/core';

describe('StratumBar Dual Y-Axis & Combined Breakdown', () => {
  const hospitalData = [
    { REPARTO: 'Cardiologia', REGIME: 'SSN', ricoveri: 450, degenza_media: 6.2 },
    { REPARTO: 'Cardiologia', REGIME: 'Privato', ricoveri: 120, degenza_media: 4.1 },
    { REPARTO: 'Ortopedia', REGIME: 'SSN', ricoveri: 380, degenza_media: 5.5 },
    { REPARTO: 'Ortopedia', REGIME: 'Privato', ricoveri: 190, degenza_media: 3.8 },
  ];

  it('should correctly assign yAxisIndex: 1 for secondary_metrics', () => {
    const chartProps: Partial<ChartProps> = {
      width: 800,
      height: 500,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'REPARTO',
        groupby: ['REPARTO', 'REGIME'],
        metrics: ['ricoveri'],
        secondary_metrics: ['degenza_media'],
        secondary_series_type: 'line',
        y_axis_title: 'Numero Ricoveri',
        y_axis_2_title: 'Degenza Media (gg)',
        y_axis_2_format: ',.1f',
        orientation: 'vertical',
      },
      queriesData: [
        {
          data: hospitalData,
        },
      ],
    };

    const transformed = transformProps(chartProps as ChartProps);

    expect(transformed.hasDualYAxis).toBe(true);
    expect(transformed.yAxis2Title).toBe('Degenza Media (gg)');

    // Primary bar series (SSN and Privato) should have yAxisIndex: 0
    const primarySeries = transformed.series.filter(s => s.yAxisIndex === 0);
    expect(primarySeries.length).toBe(2);
    expect(primarySeries[0].seriesType).toBe('bar');
    expect(primarySeries[1].seriesType).toBe('bar');

    // Secondary series (degenza_media) should have yAxisIndex: 1 and seriesType: 'line'
    const secSeries = transformed.series.filter(s => s.yAxisIndex === 1);
    expect(secSeries.length).toBe(1);
    expect(secSeries[0].name).toBe('degenza_media');
    expect(secSeries[0].seriesType).toBe('line');
    expect(secSeries[0].yAxisIndex).toBe(1);

    // Degenza media per Cardiologia (average of 6.2 and 4.1 = 5.15) and Ortopedia (average of 5.5 and 3.8 = 4.65)
    expect(secSeries[0].data[0]).toBeCloseTo(5.15);
    expect(secSeries[0].data[1]).toBeCloseTo(4.65);
  });

  it('should render dual yAxis in get2DBarOption and get3DBarOption', () => {
    const chartProps: Partial<ChartProps> = {
      width: 800,
      height: 500,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'REPARTO',
        groupby: ['REPARTO'],
        metrics: ['ricoveri'],
        secondary_metrics: ['degenza_media'],
        secondary_series_type: 'line',
        y_axis_title: 'Ricoveri',
        y_axis_2_title: 'Giorni Degenza',
      },
      queriesData: [
        {
          data: hospitalData,
        },
      ],
    };

    const transformed = transformProps(chartProps as ChartProps);
    const option2D = get2DBarOption(transformed);
    const option3D = get3DBarOption(transformed);

    // In 2D, yAxis should be an array of 2 value axes
    expect(Array.isArray(option2D.yAxis)).toBe(true);
    expect(option2D.yAxis.length).toBe(2);
    expect(option2D.yAxis[0].name).toBe('Ricoveri');
    expect(option2D.yAxis[1].name).toBe('Giorni Degenza');
    expect(option2D.yAxis[1].position).toBe('right');

    // In 3D, yAxis should also be an array of 2 axes
    expect(Array.isArray(option3D.yAxis)).toBe(true);
    expect(option3D.yAxis.length).toBe(2);
    expect(option3D.yAxis[1].position).toBe('right');
  });

  it('should combine category and breakdown on axis when combine_category_breakdown is true', () => {
    const chartProps: Partial<ChartProps> = {
      width: 800,
      height: 500,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'REPARTO',
        groupby: ['REPARTO', 'REGIME'],
        metrics: ['ricoveri'],
        combine_category_breakdown: true,
      },
      queriesData: [
        {
          data: hospitalData,
        },
      ],
    };

    const transformed = transformProps(chartProps as ChartProps);

    expect(transformed.categories).toEqual([
      'Cardiologia [SSN]',
      'Cardiologia [Privato]',
      'Ortopedia [SSN]',
      'Ortopedia [Privato]',
    ]);
  });

  it('should propagate aesthetic styling options (dark theme, glowing area gradient, custom line color, A11y decal)', () => {
    const chartProps: Partial<ChartProps> = {
      width: 800,
      height: 500,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'REPARTO',
        groupby: ['REPARTO'],
        metrics: ['ricoveri'],
        secondary_metrics: ['degenza_media'],
        secondary_area_gradient: true,
        secondary_line_width: 4,
        secondary_line_color: '#f59e0b',
        theme_mode: 'dark',
        enable_a11y_decal: true,
      },
      queriesData: [
        {
          data: hospitalData,
        },
      ],
    };

    const transformed = transformProps(chartProps as ChartProps);
    expect(transformed.themeMode).toBe('dark');
    expect(transformed.secondaryAreaGradient).toBe(true);
    expect(transformed.secondaryLineWidth).toBe(4);
    expect(transformed.secondaryLineColor).toBe('#f59e0b');
    expect(transformed.enableA11yDecal).toBe(true);

    const option2D = get2DBarOption(transformed);
    const option3D = get3DBarOption(transformed);

    // Verify A11y decal enabled
    expect(option2D.aria).toEqual({ enabled: true, decal: { show: true } });
    expect(option3D.aria).toEqual({ enabled: true, decal: { show: true } });

    // Verify secondary axis title styling matches line color in 2D and 3D
    const secAxis2D = (option2D.yAxis as any[])[1];
    expect(secAxis2D.nameTextStyle.color).toBe('#f59e0b');

    const secAxis3D = (option3D.yAxis as any[])[1];
    expect(secAxis3D.nameTextStyle.color).toBe('#f59e0b');

    // Verify secondary series areaStyle exists for glowing gradient
    const secSeries2D = (option2D.series as any[]).find((s: any) => s.name === 'degenza_media');
    expect(secSeries2D.areaStyle).toBeDefined();
    expect(secSeries2D.lineStyle.width).toBe(4);
    expect(secSeries2D.lineStyle.color).toBe('#f59e0b');
  });
});

