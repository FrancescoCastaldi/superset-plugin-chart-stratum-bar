import { buildSeriesRepresentation } from '../src/plugin/seriesBuilder';
import transformProps from '../src/plugin/transformProps';
import { ChartProps } from '@superset-ui/core';

describe('StratumBar Comparative Dual Time Mode', () => {
  const sampleData = [
    { REP: 'Cardiologia', accessi_corr: 120, accessi_conf: 100 },
    { REP: 'Ortopedia', accessi_corr: 80, accessi_conf: 90 },
    { REP: 'Pediatria', accessi_corr: 50, accessi_conf: 0 },
  ];

  it('builds two comparison series with Navy and Azure Blue colors and computes deltas', () => {
    const res = buildSeriesRepresentation({
      data: sampleData,
      isPivoted: false,
      actualXKey: 'REP',
      actualMetricKey: 'accessi_corr',
      primaryMetric: 'accessi_corr',
      metricList: ['accessi_corr'],
      secondaryMetricList: [],
      y_axis_2_format: ',.2f',
      getColor: () => undefined,
      palette: ['#1c3d5e', '#7aa8cf'],
      formatter: (v: number) => String(v),
      resolvedXAxis: 'REP',
      secFormatter: (v: number) => String(v),
      secondary_line_color: '#ea580c',
      secondary_series_type: 'line',
      secPalette: [],
      combineFlag: false,
      sampleRow: sampleData[0],
      potentialPivotedKeys: [],
      timeComparisonMode: 'dual_metric',
      comparisonMetric: 'accessi_conf',
      time1Label: 'Anno 2026',
      time2Label: 'Anno 2025',
    });

    expect(res.series).toHaveLength(2);
    const [t1Series, t2Series] = res.series;

    expect(t1Series.name).toBe('Anno 2026');
    expect(t1Series.color).toBe('#1c3d5e');
    expect(t1Series.data).toEqual([120, 80, 50]);

    expect(t2Series.name).toBe('Anno 2025');
    expect(t2Series.color).toBe('#7aa8cf');
    expect(t2Series.data).toEqual([100, 90, 0]);

    // Check Cardiologia delta: 120 vs 100 => delta +20, deltaPercent +20%
    const cardioT1 = t1Series.items[0];
    expect(cardioT1.delta).toBe(20);
    expect(cardioT1.deltaPercent).toBe(20);
    expect(cardioT1.isNewBaseline).toBe(false);

    // Check Ortopedia delta: 80 vs 90 => delta -10
    const ortoT1 = t1Series.items[1];
    expect(ortoT1.delta).toBe(-10);
    expect(ortoT1.deltaPercent).toBeCloseTo(-11.11, 1);

    // Check Pediatria zero baseline: 50 vs 0 => isNewBaseline true, deltaPercent null
    const pediaT1 = t1Series.items[2];
    expect(pediaT1.delta).toBe(50);
    expect(pediaT1.isNewBaseline).toBe(true);
    expect(pediaT1.deltaPercent).toBeNull();
  });

  it('propagates comparative configuration through transformProps', () => {
    const chartProps = {
      width: 800,
      height: 400,
      formData: {
        x_axis: 'REP',
        metrics: ['accessi_corr'],
        time_comparison_mode: 'dual_metric',
        comparison_metric: 'accessi_conf',
        time_1_label: 'Corrente',
        time_2_label: 'Precedente',
        show_comparison_delta: true,
        comparison_delta_polarity: 'normal',
      },
      queriesData: [
        {
          data: sampleData,
        },
      ],
      hooks: {},
    } as unknown as ChartProps;

    const transformed = transformProps(chartProps);

    expect(transformed.timeComparisonMode).toBe('dual_metric');
    expect(transformed.time1Label).toBe('Corrente');
    expect(transformed.time2Label).toBe('Precedente');
    expect(transformed.showComparisonDelta).toBe(true);
    expect(transformed.series).toHaveLength(2);
    expect(transformed.series[0].name).toBe('Corrente');
    expect(transformed.series[1].name).toBe('Precedente');
  });

  describe('native time offsets', () => {
    const offset = '2007-01-01 : 2008-01-01';
    const offsetData = [
      { state: 'CA', sum__num: 110, [`sum__num__${offset}`]: 100 },
      { state: 'NY', sum__num: 40, [`sum__num__${offset}`]: 60 },
    ];
    const run = (formData: Record<string, unknown>) =>
      transformProps({
        width: 800,
        height: 500,
        formData: {
          viz_type: 'stratum_bar',
          datasource: '1__table',
          x_axis: 'state',
          metrics: ['sum__num'],
          ...formData,
        },
        queriesData: [{ data: offsetData }],
      } as unknown as ChartProps);

    it('turns the offset column into the comparison series, named after the two periods', () => {
      const props = run({
        time_comparison_mode: 'time_offsets',
        extra_form_data: { time_range: '2008-01-01 : 2009-01-01', time_compare: [offset] },
      });
      expect(props.series).toHaveLength(2);
      expect(props.series[0].name).toBe('Periodo corrente · 01/01/2008 al 31/12/2008');
      expect(props.series[0].data).toEqual([110, 40]);
      expect(props.series[1].name).toBe('Periodo di confronto · 01/01/2007 al 31/12/2007');
      expect(props.series[1].data).toEqual([100, 60]);
      expect(props.series[0].items[0].delta).toBe(10);
    });

    it('names the periods after the calendar names and readable ranges', () => {
      const props = run({
        time_comparison_mode: 'time_offsets',
        extra_form_data: {
          time_range: '2008-01-01 : 2008-04-01',
          time_compare: [offset],
          custom_form_data: [{ period_labels: { reference: 'This year', comparison: 'Last year' }, period_text: { reference: '1 Jan - 31 Mar 2008', comparison: '1 Jan - 31 Mar 2007' } }],
        },
      });
      expect(props.series.map((s: any) => s.name)).toEqual([
        'This year · 1 Jan - 31 Mar 2008',
        'Last year · 1 Jan - 31 Mar 2007',
      ]);
    });

    it('still shows the comparison period, marked as empty, when it has no data', () => {
      const props = transformProps({
        width: 800,
        height: 500,
        formData: {
          viz_type: 'stratum_bar',
          datasource: '1__table',
          x_axis: 'state',
          metrics: ['sum__num'],
          time_comparison_mode: 'time_offsets',
          extra_form_data: {
            time_range: '2008-01-01 : 2008-04-01',
            time_compare: ['2008-04-01 : 2008-07-01'],
            custom_form_data: [{ period_labels: { reference: 'Q1', comparison: 'Q2' }, period_text: { reference: '1 Jan - 31 Mar 2008', comparison: '1 Apr - 30 Jun 2008' }, locale: 'it' }],
          },
        },
        queriesData: [{ data: [{ state: 'CA', sum__num: 110, 'sum__num__2008-04-01 : 2008-07-01': null }, { state: 'NY', sum__num: 40, 'sum__num__2008-04-01 : 2008-07-01': null }] }],
      } as unknown as ChartProps);
      expect(props.series).toHaveLength(2);
      expect(props.series[1].name).toBe('Q2 · 1 Apr - 30 Jun 2008 · nessun dato');
    });

    it('uses the labels typed in the control panel', () => {
      const props = run({ time_comparison_mode: 'time_offsets', time_1_label: 'This year', time_2_label: 'Last year' });
      expect(props.series.map((s: any) => s.name)).toEqual(['This year', 'Last year']);
    });

    it('reads the comparison mode from rawFormData when a dashboard camel-cases formData', () => {
      const props = transformProps({
        width: 800,
        height: 500,
        formData: { viz_type: 'stratum_bar', datasource: '1__table', xAxis: 'state', metrics: ['sum__num'], timeComparisonMode: 'time_offsets' },
        rawFormData: { viz_type: 'stratum_bar', x_axis: 'state', metrics: ['sum__num'], time_comparison_mode: 'time_offsets' },
        queriesData: [{ data: offsetData }],
      } as unknown as ChartProps);
      expect(props.series).toHaveLength(2);
      expect(props.series[1].data).toEqual([100, 60]);
    });

    it('leaves the offset column alone when the comparison is off', () => {
      const props = run({ time_comparison_mode: 'none' });
      expect(props.series.map((s: any) => s.name)).not.toContain(offset);
    });
  });
});
