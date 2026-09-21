import { get2DBarOption } from '../src/components/renderers2D';
import { get3DBarOption } from '../src/components/renderers3D';
import { StratumBarTransformedProps } from '../src/types';

describe('StratumBar 2D & 3D Renderers', () => {
  const baseProps: StratumBarTransformedProps = {
    width: 800,
    height: 500,
    categories: ['Sportello', 'Web', 'Cup'],
    series: [
      {
        name: 'Convenzionato',
        key: 'Convenzionato',
        color: '#3b82f6',
        data: [150, 280, 90],
        items: [
          { category: 'Sportello', value: 150, deltaPercent: 15 },
          { category: 'Web', value: 280, deltaPercent: 40 },
          { category: 'Cup', value: 90, deltaPercent: -10 },
        ],
      },
    ],
    benchmark: { value: 100, label: 'Benchmark (100)' },
    viewMode: '2d',
    orientation: 'vertical',
    stacking: 'none',
    barShape3D: 'prism',
    depth3D: 20,
    tilt3D: 25,
    shadow3D: true,
    barBorderRadius: 6,
    showTrackBackground: true,
    showBenchmark: true,
    showDeltaBadge: true,
    deltaPolarity: 'normal',
    showValue: true,
    valuePosition: 'top',
    numberFormat: ',.0f',
    colorScheme: ['#3b82f6', '#10b981'],
    showLegend: true,
    legendOrientation: 'top',
    emitFilter: true,
    enableToolbar: true,
    formData: {} as any,
  };

  it('get2DBarOption should produce valid ECharts option with track background and markLine', () => {
    const option = get2DBarOption(baseProps);

    expect(option).toBeDefined();
    expect(option.xAxis).toBeDefined();
    expect(option.yAxis).toBeDefined();
    // Series should have track background + main series
    expect(option.series.length).toBeGreaterThanOrEqual(2);
    // MarkLine should be attached to the primary series
    const mainSeries = option.series.find((s: any) => s.name === 'Convenzionato');
    expect(mainSeries).toBeDefined();
    expect(mainSeries.markLine).toBeDefined();
    expect(mainSeries.markLine.data[0].yAxis).toBe(100);
  });

  it('get3DBarOption should produce custom series with isometric renderItem and benchmark', () => {
    const props3D: StratumBarTransformedProps = {
      ...baseProps,
      viewMode: '3d',
    };

    const option = get3DBarOption(props3D);

    expect(option).toBeDefined();
    expect(option.series.length).toBeGreaterThanOrEqual(1);

    const customSeries = option.series[0];
    expect(customSeries.type).toBe('custom');
    expect(typeof customSeries.renderItem).toBe('function');
    expect(customSeries.data[0].value).toEqual([0, 150]); // [categoryIndex, val]
    expect(customSeries.encode).toEqual({ x: 0, y: 1 });
    expect(option.yAxis.max).toBeGreaterThanOrEqual(280);

    // Option should have markLine for 3D benchmark
    const markLineSeries = option.series.find((s: any) => s.markLine !== undefined);
    expect(markLineSeries).toBeDefined();
    expect(markLineSeries.markLine.data[0].yAxis).toBe(100);
  });

  it('get3DBarOption should handle horizontal orientation with proper value scale and data mapping', () => {
    const horizontalProps: StratumBarTransformedProps = {
      ...baseProps,
      viewMode: '3d',
      orientation: 'horizontal',
    };

    const option = get3DBarOption(horizontalProps);
    expect(option.yAxis.type).toBe('category');
    expect(option.xAxis.type).toBe('value');
    expect(option.xAxis.max).toBeGreaterThanOrEqual(280);

    const customSeries = option.series[0];
    expect(customSeries.data[0].value).toEqual([150, 0]); // [val, categoryIndex]
    expect(customSeries.encode).toEqual({ x: 0, y: 1 });
  });

  it('get3DBarOption should produce cylinder geometry when barShape3D is cylinder', () => {
    const cylinderProps: StratumBarTransformedProps = {
      ...baseProps,
      viewMode: '3d',
      barShape3D: 'cylinder',
    };

    const option = get3DBarOption(cylinderProps);
    const customSeries = option.series[0];
    expect(customSeries.type).toBe('custom');

    const mockApi = {
      value: (dim: number) => (dim === 0 ? 0 : 150),
      coord: ([x, y]: [number, number]) => [100 + x, 200 - y],
      size: ([dx, dy]: [number, number]) => [50 * dx, 50 * dy],
    };

    const rendered = customSeries.renderItem({}, mockApi);
    expect(rendered).toBeDefined();
    expect(rendered.type).toBe('group');
    expect(rendered.children.length).toBeGreaterThanOrEqual(3);
  });
});
