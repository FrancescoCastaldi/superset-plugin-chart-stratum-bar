/**
 * Serializes an ECharts option produced by the StratumBar renderers into a
 * plain JSON structure that can be compared structurally across refactors.
 *
 * Functions cannot be compared directly, so they are replaced by a marker and
 * their observable behaviour is captured by invoking them on deterministic
 * probe inputs:
 * - custom series `renderItem` is executed for every data point against two
 *   mock coordinate systems (a regular one and a compressed one that triggers
 *   the minimum-size enforcement branches);
 * - label / markPoint / axis formatters are executed on representative values;
 * - the tooltip formatter is executed on a synthetic axis-trigger payload.
 */

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export function serialize(value: any): Json {
  if (typeof value === 'function') return '[Function]';
  if (value === undefined) return null;
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
    return value;
  }
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(serialize);
  const out: { [k: string]: Json } = {};
  Object.keys(value).forEach(k => {
    if (value[k] !== undefined) out[k] = serialize(value[k]);
  });
  return out;
}

function makeApi(datum: any, isVertical: boolean, valueScale: number) {
  const value = Array.isArray(datum?.value) ? datum.value : [];
  return {
    value: (dim: number) => value[dim],
    coord: ([a, b]: [number, number]) =>
      isVertical
        ? [80 + a * 110, 400 - b * valueScale]
        : [60 + a * valueScale, 50 + b * 90],
    size: ([dx, dy]: [number, number]) => [dx * 110, dy * 90],
  };
}

function safeCall(fn: () => any): Json {
  try {
    return serialize(fn());
  } catch (e: any) {
    return { error: String(e?.message ?? e) };
  }
}

const AXIS_PROBES = [0, 7.5, 950, -1200, 12500, 2500000, 0.123];

function probeAxis(axis: any): Json {
  const axes = Array.isArray(axis) ? axis : [axis];
  return axes.map(a => {
    const fmt = a?.axisLabel?.formatter;
    return typeof fmt === 'function' ? AXIS_PROBES.map(v => safeCall(() => fmt(v))) : null;
  });
}

function probeSeries(s: any, isVertical: boolean): Json {
  const out: { [k: string]: Json } = {};
  const data: any[] = Array.isArray(s.data) ? s.data : [];

  if (typeof s.renderItem === 'function') {
    out.renderItem = [1.1, 0.01].map(scale =>
      data.map((d, dataIndex) =>
        safeCall(() => s.renderItem({ dataIndex }, makeApi(d, isVertical, scale))),
      ),
    );
  }

  const labelFmt = s.label?.formatter;
  if (typeof labelFmt === 'function') {
    out.labelFormatter = data.map(d =>
      safeCall(() =>
        labelFmt({ data: d, value: d && typeof d === 'object' && !Array.isArray(d) ? d.value : d }),
      ),
    );
  }

  const markPointFmt = s.markPoint?.label?.formatter;
  if (typeof markPointFmt === 'function') {
    out.markPointFormatter = ['max', 'min'].map(type => safeCall(() => markPointFmt({ type })));
  }

  return out;
}

function probeTooltip(option: any, categories: string[]): Json {
  const fmt = option.tooltip?.formatter;
  if (typeof fmt !== 'function') return null;
  return categories.map((cat, dataIndex) => {
    const params = option.series.map((s: any, seriesIndex: number) => {
      const datum = Array.isArray(s.data) ? s.data[dataIndex] : undefined;
      return {
        seriesName: s.name,
        seriesIndex,
        seriesType: s.type,
        dataIndex,
        name: cat,
        axisValueLabel: s.type === 'custom' ? undefined : cat,
        data: datum,
        value: datum && typeof datum === 'object' && !Array.isArray(datum) ? datum.value : datum,
        color: '#123456',
      };
    });
    return safeCall(() => fmt(params));
  });
}

export function probeOption(option: any, props: { categories: string[]; orientation: string }): Json {
  const isVertical = props.orientation === 'vertical';
  return {
    option: serialize(option),
    probes: {
      xAxis: probeAxis(option.xAxis),
      yAxis: probeAxis(option.yAxis),
      series: option.series.map((s: any) => probeSeries(s, isVertical)),
      tooltip: probeTooltip(option, props.categories),
    },
  };
}
