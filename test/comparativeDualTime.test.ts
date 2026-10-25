import { buildSeriesRepresentation } from '../src/plugin/seriesBuilder';
import transformProps from '../src/plugin/transformProps';
import { ChartProps } from '@superset-ui/core';

describe('StratumBar Comparative Dual Time Mode', () => {
  const sampleData = [
    { REP: 'Cardiologia', accessi_corr: 120, accessi_conf: 100 },
    { REP: 'Ortopedia', accessi_corr: 80, accessi_conf: 90 },
    { REP: 'Pediatria', accessi_corr: 50, accessi_conf: 0 },
  ];

  it('builds two comparison series with Navy and Magenta colors and computes deltas', () => {
    const res = buildSeriesRepresentation({
      data: sampleData,
      isPivoted: false,
      actualXKey: 'REP',
      actualMetricKey: 'accessi_corr',
      primaryMetric: 'accessi_corr',
      metricList: ['accessi_corr'],
      secondaryMetricList: [],
      y_axis_2_format: ',.2f',
      getColor: () => '#0A224E',
      palette: ['#0A224E', '#E12B72'],
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
    expect(t1Series.color).toBe('#0A224E');
    expect(t1Series.data).toEqual([120, 80, 50]);

    expect(t2Series.name).toBe('Anno 2025');
    expect(t2Series.color).toBe('#E12B72');
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
});
