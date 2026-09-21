import transformProps from '../src/plugin/transformProps';
import { ChartProps } from '@superset-ui/core';

describe('StratumBar transformProps', () => {
  const sampleData = [
    { CANALE: 'Sportello', REGIME: 'Convenzionato', richieste: 12500 },
    { CANALE: 'Sportello', REGIME: 'Privato', richieste: 4200 },
    { CANALE: 'Call Center', REGIME: 'Convenzionato', richieste: 8900 },
    { CANALE: 'Call Center', REGIME: 'Privato', richieste: 3100 },
    { CANALE: 'Portale Web', REGIME: 'Convenzionato', richieste: 14200 },
    { CANALE: 'Portale Web', REGIME: 'Privato', richieste: 6800 },
  ];

  it('should transform data with breakdown dimension (REGIME) into multi-series', () => {
    const chartProps: Partial<ChartProps> = {
      width: 800,
      height: 500,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'CANALE',
        groupby: ['CANALE', 'REGIME'],
        metrics: ['richieste'],
        orientation: 'vertical',
        stacking: 'none',
        viewMode: '3d',
      },
      queriesData: [
        {
          data: sampleData,
        },
      ],
    };

    const transformed = transformProps(chartProps as ChartProps);

    expect(transformed.categories).toEqual(['Sportello', 'Call Center', 'Portale Web']);
    expect(transformed.series.length).toBe(2);
    expect(transformed.series[0].name).toBe('Convenzionato');
    expect(transformed.series[1].name).toBe('Privato');
    expect(transformed.series[0].data).toEqual([12500, 8900, 14200]);
    expect(transformed.series[1].data).toEqual([4200, 3100, 6800]);
    expect(transformed.viewMode).toBe('3d');
  });

  it('should calculate fixed benchmark and delta percentage badges', () => {
    const chartProps: Partial<ChartProps> = {
      width: 600,
      height: 400,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'CANALE',
        groupby: ['CANALE'],
        metrics: ['richieste'],
        showBenchmark: true,
        benchmarkType: 'fixed_value',
        benchmarkValue: 10000,
      },
      queriesData: [
        {
          data: [
            { CANALE: 'Sportello', richieste: 12000 },
            { CANALE: 'Call Center', richieste: 8000 },
          ],
        },
      ],
    };

    const transformed = transformProps(chartProps as ChartProps);

    expect(transformed.benchmark).toBeDefined();
    expect(transformed.benchmark?.value).toBe(10000);

    const series = transformed.series[0];
    // Sportello: (12000 - 10000) / 10000 * 100 = +20%
    expect(series.items[0].deltaPercent).toBe(20);
    // Call Center: (8000 - 10000) / 10000 * 100 = -20%
    expect(series.items[1].deltaPercent).toBe(-20);
  });

  it('should calculate dynamic average benchmark across series data', () => {
    const chartProps: Partial<ChartProps> = {
      width: 600,
      height: 400,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'CANALE',
        groupby: ['CANALE'],
        metrics: ['richieste'],
        showBenchmark: true,
        benchmarkType: 'average',
      },
      queriesData: [
        {
          data: [
            { CANALE: 'A', richieste: 100 },
            { CANALE: 'B', richieste: 200 },
            { CANALE: 'C', richieste: 300 },
          ],
        },
      ],
    };

    const transformed = transformProps(chartProps as ChartProps);
    expect(transformed.benchmark?.value).toBe(200);
  });

  it('should trigger cross filter callback when onCrossFilter is called', () => {
    const setDataMaskMock = jest.fn();
    const chartProps: any = {
      width: 500,
      height: 400,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'CANALE',
        groupby: ['CANALE'],
        metrics: ['richieste'],
        emit_filter: true,
      },
      queriesData: [{ data: [{ CANALE: 'Online', richieste: 500 }] }],
      hooks: {
        setDataMask: setDataMaskMock,
      },
    };

    const transformed = transformProps(chartProps);
    transformed.onCrossFilter?.('Online');

    expect(setDataMaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        extraFormData: {
          filters: [{ col: 'CANALE', op: 'IN', val: ['Online'] }],
        },
      }),
    );
  });

  it('should support x_axis_group with separate x_axis (grouped booking channels on X-axis)', () => {
    const chartProps: any = {
      width: 800,
      height: 500,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '70__table',
        x_axis_group: 'CANALE',
        x_axis: 'REGIME',
        metrics: ['richieste'],
        orientation: 'vertical',
      },
      queriesData: [
        {
          data: sampleData,
        },
      ],
    };

    const transformed = transformProps(chartProps);
    // Categories should be the group dimension: CANALE
    expect(transformed.categories).toEqual(['Sportello', 'Call Center', 'Portale Web']);
    // Series should be the secondary dimension: REGIME
    expect(transformed.series.length).toBe(2);
    expect(transformed.series[0].name).toBe('Convenzionato');
    expect(transformed.series[1].name).toBe('Privato');
    expect(transformed.canCombineBreakdown).toBe(true);
  });

  it('should support multi-column x_axis: [CANALE, REGIME]', () => {
    const chartProps: any = {
      width: 800,
      height: 500,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '70__table',
        x_axis: ['CANALE', 'REGIME'],
        metrics: ['richieste'],
        orientation: 'vertical',
      },
      queriesData: [
        {
          data: sampleData,
        },
      ],
    };

    const transformed = transformProps(chartProps);
    expect(transformed.categories).toEqual(['Sportello', 'Call Center', 'Portale Web']);
    expect(transformed.series.length).toBe(2);
    expect(transformed.series[0].name).toBe('Convenzionato');
    expect(transformed.series[1].name).toBe('Privato');
  });

  it('should prioritize dashboard label_colors for series matching keys', () => {
    const chartProps: any = {
      width: 500,
      height: 400,
      rawFormData: {
        label_colors: {
          SSN: '#3a6a9b',
          Convenzioni: '#1c3d5e',
          'Libera professione': '#7aa8cf',
          Solventi: '#bcd5ea',
        },
      },
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'CANALE',
        groupby: ['CANALE', 'REGIME'],
        metrics: ['richieste'],
      },
      queriesData: [
        {
          data: [
            { CANALE: 'App', REGIME: 'Convenzioni', richieste: 10 },
            { CANALE: 'App', REGIME: 'SSN', richieste: 100 },
          ],
        },
      ],
    };

    const transformed = transformProps(chartProps);
    const convSeries = transformed.series.find(s => s.name === 'Convenzioni');
    const ssnSeries = transformed.series.find(s => s.name === 'SSN');

    expect(convSeries?.color).toBe('#1c3d5e');
    expect(ssnSeries?.color).toBe('#3a6a9b');
  });

  it('should prioritize custom_colors_json over dashboard label_colors', () => {
    const chartProps: any = {
      width: 500,
      height: 400,
      rawFormData: {
        label_colors: {
          SSN: '#3a6a9b',
        },
      },
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'CANALE',
        groupby: ['CANALE', 'REGIME'],
        metrics: ['richieste'],
        custom_colors_json: JSON.stringify({ SSN: '#ff0000' }),
      },
      queriesData: [
        {
          data: [{ CANALE: 'App', REGIME: 'SSN', richieste: 100 }],
        },
      ],
    };

    const transformed = transformProps(chartProps);
    const ssnSeries = transformed.series.find(s => s.name === 'SSN');
    expect(ssnSeries?.color).toBe('#ff0000');
  });

  it('should toggle off (clear) cross-filter when clicked item is already selected', () => {
    const setDataMaskMock = jest.fn();
    const chartProps: any = {
      width: 500,
      height: 400,
      filterState: {
        selectedValues: ['App · SSN'],
      },
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis_group: 'CANALE',
        x_axis: 'REGIME',
        metrics: ['richieste'],
        emit_filter: true,
      },
      queriesData: [{ data: [{ CANALE: 'App', REGIME: 'SSN', richieste: 100 }] }],
      hooks: {
        setDataMask: setDataMaskMock,
      },
    };

    const transformed = transformProps(chartProps);
    // Clicking already selected category should toggle off (clear)
    transformed.onCrossFilter?.('App · SSN');

    expect(setDataMaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        extraFormData: {
          filters: [],
        },
        filterState: {
          value: null,
          selectedValues: null,
        },
      }),
    );
  });
});
