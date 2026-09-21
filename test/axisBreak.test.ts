import { calculateAxisBreak, transformValueForAxisBreak } from '../src/utils/axisBreakUtils';
import { get2DBarOption } from '../src/components/renderers2D';
import { get3DBarOption } from '../src/components/renderers3D';
import { StratumBarTransformedProps } from '../src/types';

describe('Axis Break & Outlier Pinning (//)', () => {
  it('calculateAxisBreak auto mode detects outlier and sets reasonable cutoff', () => {
    // Typical real-world skew: App: 1331, others: 8, 7, 73, 25
    const series = [
      {
        data: [1331, 8, 7, 73, 25],
      },
    ];

    const result = calculateAxisBreak(series, false, 5, {
      enabled: true,
      mode: 'auto',
    });

    expect(result.enabled).toBe(true);
    expect(result.hasOutliers).toBe(true);
    expect(result.maxOriginalVal).toBe(1331);
    // second highest is 73, cutoff should be around 73 * 1.25 = 92
    expect(result.effectiveCutoff).toBe(92);
    expect(result.displayMax).toBeGreaterThan(result.effectiveCutoff);
    expect(result.displayMax).toBeLessThan(200); // 1331 is capped within 200, allowing 8, 7, 73 to be clearly visible!
  });

  it('calculateAxisBreak manual mode respects user-defined threshold', () => {
    const series = [{ data: [500, 50, 40] }];
    const result = calculateAxisBreak(series, false, 3, {
      enabled: true,
      mode: 'manual',
      threshold: 100,
    });

    expect(result.enabled).toBe(true);
    expect(result.effectiveCutoff).toBe(100);
    expect(result.hasOutliers).toBe(true);
    expect(result.displayMax).toBe(120);
  });

  it('calculateAxisBreak returns disabled if no outliers exist', () => {
    const series = [{ data: [100, 95, 105, 90] }];
    const result = calculateAxisBreak(series, false, 4, {
      enabled: true,
      mode: 'auto',
    });

    expect(result.enabled).toBe(false);
    expect(result.hasOutliers).toBe(false);
  });

  it('transformValueForAxisBreak preserves normal bars and caps outliers with isCapped flag', () => {
    const breakConfig = {
      enabled: true,
      effectiveCutoff: 100,
      maxOriginalVal: 1000,
      hasOutliers: true,
      displayMax: 120,
      compressionRatio: 0.015,
    };

    // Normal bar below cutoff
    const normal = transformValueForAxisBreak(50, breakConfig);
    expect(normal.isCapped).toBe(false);
    expect(normal.visualVal).toBe(50);
    expect(normal.originalVal).toBe(50);

    // Outlier bar above cutoff
    const outlier = transformValueForAxisBreak(1000, breakConfig);
    expect(outlier.isCapped).toBe(true);
    expect(outlier.originalVal).toBe(1000);
    expect(outlier.visualVal).toBeGreaterThan(100);
    expect(outlier.visualVal).toBeLessThanOrEqual(120);
  });

  it('get2DBarOption renders // and real number on capped bar labels', () => {
    const props: StratumBarTransformedProps = {
      width: 800,
      height: 500,
      categories: ['App', 'Call Center', 'Cassa'],
      series: [
        {
          name: 'Prenotazioni',
          key: 'Prenotazioni',
          color: '#3b82f6',
          data: [1331, 20, 15],
          items: [],
        },
      ],
      viewMode: '2d',
      orientation: 'vertical',
      stacking: 'none',
      barShape3D: 'prism',
      depth3D: 20,
      tilt3D: 25,
      shadow3D: true,
      barBorderRadius: 6,
      showTrackBackground: false,
      showBenchmark: false,
      showDeltaBadge: false,
      deltaPolarity: 'normal',
      showValue: true,
      valuePosition: 'top',
      numberFormat: ',.0f',
      colorScheme: ['#3b82f6'],
      showLegend: false,
      legendOrientation: 'top',
      emitFilter: false,
      enableToolbar: true,
      enableAxisBreak: true,
      axisBreakMode: 'auto',
      formData: {} as any,
    };

    const option = get2DBarOption(props);
    const mainSeries = option.series.find((s: any) => s.name === 'Prenotazioni');
    expect(mainSeries).toBeDefined();

    // Bar 0 (1331) should be capped
    const data0 = mainSeries.data[0];
    expect(data0.isCapped).toBe(true);
    expect(data0.originalVal).toBe(1331);
    expect(data0.value).toBeLessThan(100); // Scaled down!

    // Bar 1 (20) should not be capped
    const data1 = mainSeries.data[1];
    expect(data1.isCapped).toBe(false);
    expect(data1.value).toBe(20);

    // Label formatter test
    const label0 = mainSeries.label.formatter({ data: data0, value: data0.value });
    expect(label0).toContain('//');
    expect(label0).toContain('1331'); // Real number preserved!

    const label1 = mainSeries.label.formatter({ data: data1, value: data1.value });
    expect(label1).not.toContain('//');
    expect(label1).toBe('20');
  });

  it('get3DBarOption renders // indicator and real label in 3D custom series', () => {
    const props: StratumBarTransformedProps = {
      width: 800,
      height: 500,
      categories: ['App', 'Web', 'Cup'],
      series: [
        {
          name: 'Prenotazioni',
          key: 'Prenotazioni',
          color: '#3b82f6',
          data: [1331, 20, 15],
          items: [],
        },
      ],
      viewMode: '3d',
      orientation: 'vertical',
      stacking: 'none',
      barShape3D: 'prism',
      depth3D: 20,
      tilt3D: 25,
      shadow3D: true,
      barBorderRadius: 6,
      showTrackBackground: false,
      showBenchmark: false,
      showDeltaBadge: false,
      deltaPolarity: 'normal',
      showValue: true,
      valuePosition: 'top',
      numberFormat: ',.0f',
      colorScheme: ['#3b82f6'],
      showLegend: false,
      legendOrientation: 'top',
      emitFilter: false,
      enableToolbar: true,
      enableAxisBreak: true,
      axisBreakMode: 'auto',
      formData: {} as any,
    };

    const option = get3DBarOption(props);
    const customSeries = option.series[0];
    expect(customSeries.type).toBe('custom');

    // Check custom series data
    expect(customSeries.data[0].isCapped).toBe(true);
    expect(customSeries.data[0].originalVal).toBe(1331);

    // Render item for index 0 (the capped bar)
    const mockApi0 = {
      value: (dim: number) => (dim === 0 ? 0 : customSeries.data[0].value[1]),
      coord: ([x, y]: [number, number]) => [100 + x * 50, 400 - y * 2],
      size: ([dx, dy]: [number, number]) => [50 * dx, 50 * dy],
    };

    const rendered0 = customSeries.renderItem({}, mockApi0);
    expect(rendered0).toBeDefined();

    // Check for // break element in children
    const breakElement = rendered0.children.find((c: any) => c.type === 'text' && c.style?.text === '//');
    expect(breakElement).toBeDefined();

    // Check label element in children
    const labelElement = rendered0.children.find((c: any) => c.type === 'text' && c.style?.text?.startsWith('//') && c.style?.text?.includes('1331'));
    expect(labelElement).toBeDefined();
  });

  it('calculateAxisBreak auto mode detects multiple outliers', () => {
    // Two dominant outliers (1331 and 1200) vs normal values (73, 25, 8, 7)
    const series = [{ data: [1331, 1200, 73, 25, 8, 7] }];
    const result = calculateAxisBreak(series, false, 6, {
      enabled: true,
      mode: 'auto',
    });

    expect(result.enabled).toBe(true);
    expect(result.hasOutliers).toBe(true);
    // Cutoff should cap both 1331 and 1200 above 73 (73 * 1.25 = 92)
    expect(result.effectiveCutoff).toBe(92);
    expect(result.displayMax).toBeGreaterThan(result.effectiveCutoff);
    expect(result.displayMax).toBeLessThan(200);
  });

  it('get2DBarOption includes visual broken axis mark line when enabled', () => {
    const props: StratumBarTransformedProps = {
      width: 800,
      height: 500,
      categories: ['A', 'B', 'C'],
      series: [
        {
          name: 'Metric',
          key: 'Metric',
          data: [1331, 20, 15],
          items: [],
        },
      ],
      viewMode: '2d',
      orientation: 'vertical',
      stacking: 'none',
      barShape3D: 'prism',
      depth3D: 20,
      tilt3D: 25,
      shadow3D: true,
      barBorderRadius: 6,
      showTrackBackground: false,
      showBenchmark: false,
      showDeltaBadge: false,
      deltaPolarity: 'normal',
      showValue: true,
      valuePosition: 'top',
      numberFormat: ',.0f',
      colorScheme: ['#3b82f6'],
      showLegend: false,
      legendOrientation: 'top',
      emitFilter: false,
      enableToolbar: true,
      enableAxisBreak: true,
      axisBreakMode: 'auto',
      formData: {} as any,
    };

    const option = get2DBarOption(props);
    const mainSeries = option.series.find((s: any) => s.name === 'Metric');
    expect(mainSeries).toBeDefined();
    expect(mainSeries.markLine).toBeDefined();
    expect(mainSeries.markLine.data.length).toBeGreaterThanOrEqual(1);

    const breakLine = mainSeries.markLine.data.find((d: any) => d.label?.formatter?.includes('// Taglio Asse'));
    expect(breakLine).toBeDefined();
    expect(breakLine.yAxis).toBe(25); // 20 * 1.25
  });

  it('get2DBarOption handles stacked mode max calculation correctly', () => {
    const props: StratumBarTransformedProps = {
      width: 800,
      height: 500,
      categories: ['Cat 1', 'Cat 2'],
      series: [
        { name: 'Seg A', key: 'Seg A', data: [100, 50], items: [] },
        { name: 'Seg B', key: 'Seg B', data: [100, 50], items: [] },
      ],
      viewMode: '2d',
      orientation: 'vertical',
      stacking: 'stack',
      barShape3D: 'prism',
      depth3D: 20,
      tilt3D: 25,
      shadow3D: true,
      barBorderRadius: 6,
      showTrackBackground: false,
      showBenchmark: false,
      showDeltaBadge: false,
      deltaPolarity: 'normal',
      showValue: true,
      valuePosition: 'inside',
      numberFormat: ',.0f',
      colorScheme: ['#3b82f6', '#10b981'],
      showLegend: false,
      legendOrientation: 'top',
      emitFilter: false,
      enableToolbar: true,
      enableAxisBreak: false,
      formData: {} as any,
    };

    const option = get2DBarOption(props);
    const series0 = option.series.find((s: any) => s.name === 'Seg A');
    expect(series0).toBeDefined();
    expect(series0.stack).toBe('stratum_stack');
  });
});

