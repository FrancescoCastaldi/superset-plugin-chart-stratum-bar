import { DataRecord } from '@superset-ui/core';
import { StratumBarSeries, StratumBarSeriesItem } from '../types';
import { sortCategories } from '../utils/sortingUtils';

export interface BuildRepresentationOptions {
  data: DataRecord[];
  isPivoted: boolean;
  actualXKey: string;
  actualBreakdownKey?: string;
  actualMetricKey: string;
  targetMetricKey?: string;
  primaryMetric: string;
  metricList: string[];
  secondaryMetricList: string[];
  y_axis_2_format: string;
  getColor: (key: string, idx: number) => string;
  palette: string[];
  formatter: (v: number) => string;
  resolvedXAxis: string;
  secFormatter: (v: number) => string;
  secondary_line_color: string;
  secondary_series_type: string;
  secPalette: string[];
  combineFlag: boolean;
  sampleRow: any;
  potentialPivotedKeys: string[];
  sortBy?: 'category' | 'metric';
  isOrderDesc?: boolean;
}

export function buildSeriesRepresentation(options: BuildRepresentationOptions) {
  const {
    data, isPivoted, actualXKey, actualBreakdownKey, actualMetricKey,
    targetMetricKey, primaryMetric, metricList, secondaryMetricList,
    getColor, palette, formatter, resolvedXAxis, secFormatter,
    secondary_line_color, secondary_series_type, secPalette,
    combineFlag, sampleRow, potentialPivotedKeys,
    sortBy = 'category', isOrderDesc = false,
  } = options;

  const categoriesSet = new Set<string>();
  data.forEach(row => {
    const val = row[actualXKey] ?? row[resolvedXAxis] ?? Object.values(row)[0];
    if (val !== null && val !== undefined) {
      if (combineFlag && actualBreakdownKey && row[actualBreakdownKey] !== undefined && row[actualBreakdownKey] !== null) {
        categoriesSet.add(`${val} · ${row[actualBreakdownKey]}`);
      } else {
        categoriesSet.add(String(val));
      }
    }
  });
  const rawCategories = Array.from(categoriesSet);
  let repCategories: string[];
  if (sortBy === 'category') {
    repCategories = sortCategories(rawCategories, isOrderDesc);
  } else {
    const catTotals = new Map<string, number>();
    rawCategories.forEach(cat => catTotals.set(cat, 0));
    data.forEach(row => {
      const catVal = String(row[actualXKey] ?? row[resolvedXAxis] ?? Object.values(row)[0]);
      const key = combineFlag && actualBreakdownKey && row[actualBreakdownKey] !== undefined && row[actualBreakdownKey] !== null
        ? `${catVal} · ${row[actualBreakdownKey]}`
        : catVal;
      const rawVal = row[actualMetricKey];
      const numVal = typeof rawVal === 'number' ? rawVal : (rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : 0);
      if (catTotals.has(key)) {
        catTotals.set(key, (catTotals.get(key) || 0) + numVal);
      }
    });

    repCategories = [...rawCategories].sort((a, b) => {
      const totA = catTotals.get(a) || 0;
      const totB = catTotals.get(b) || 0;
      return isOrderDesc ? totB - totA : totA - totB;
    });
  }

  const repSeries: StratumBarSeries[] = [];

  if (isPivoted) {
    potentialPivotedKeys.forEach((sName, sIdx) => {
      const seriesData: (number | null)[] = [];
      const seriesItems: StratumBarSeriesItem[] = [];

      repCategories.forEach(cat => {
        const row = data.find(r => String(r[actualXKey]) === cat);
        const rawVal = row ? row[sName] : null;
        const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
        seriesData.push(numVal);

        const targetVal = targetMetricKey && row ? Number(row[targetMetricKey]) || null : null;
        seriesItems.push({
          category: cat,
          value: numVal,
          formattedValue: numVal !== null ? formatter(numVal) : undefined,
          targetValue: targetVal,
          rawData: row,
        });
      });

      repSeries.push({
        name: sName,
        key: sName,
        color: getColor(sName, sIdx),
        data: seriesData,
        items: seriesItems,
        yAxisIndex: 0,
        seriesType: 'bar',
      });
    });
  } else if (actualBreakdownKey && actualBreakdownKey in sampleRow) {
    const groupValuesSet = new Set<string>();
    data.forEach(row => {
      const gVal = row[actualBreakdownKey];
      if (gVal !== null && gVal !== undefined) {
        groupValuesSet.add(String(gVal));
      }
    });
    const groupValues = Array.from(groupValuesSet);

    if (combineFlag) {
      groupValues.forEach((gVal, sIdx) => {
        const seriesData: (number | null)[] = [];
        const seriesItems: StratumBarSeriesItem[] = [];

        repCategories.forEach(cat => {
          const matchingRow = data.find(r => `${r[actualXKey]} · ${r[actualBreakdownKey]}` === cat);
          const isMatch = matchingRow && String(matchingRow[actualBreakdownKey]) === gVal;
          const rawVal = isMatch ? matchingRow[actualMetricKey] : null;
          const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
          seriesData.push(numVal);

          const targetVal = targetMetricKey && matchingRow ? Number(matchingRow[targetMetricKey]) || null : null;
          seriesItems.push({
            category: cat,
            value: numVal,
            formattedValue: numVal !== null ? formatter(numVal) : undefined,
            targetValue: targetVal,
            rawData: matchingRow,
          });
        });

        repSeries.push({
          name: gVal,
          key: gVal,
          color: getColor(gVal, sIdx),
          data: seriesData,
          items: seriesItems,
          yAxisIndex: 0,
          seriesType: 'bar',
        });
      });
    } else {
      const lookupVal = new Map<string, Map<string, number>>();
      const lookupRow = new Map<string, Map<string, DataRecord>>();

      data.forEach(row => {
        const rawCat = row[actualXKey] !== null && row[actualXKey] !== undefined ? String(row[actualXKey]) : 'N/D';
        const gVal = row[actualBreakdownKey] !== null && row[actualBreakdownKey] !== undefined ? String(row[actualBreakdownKey]) : 'N/D';
        if (!lookupVal.has(gVal)) {
          lookupVal.set(gVal, new Map());
          lookupRow.set(gVal, new Map());
        }
        const rawVal = row[actualMetricKey];
        const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : 0;
        const currentSum = lookupVal.get(gVal)!.get(rawCat) || 0;
        lookupVal.get(gVal)!.set(rawCat, currentSum + numVal);
        lookupRow.get(gVal)!.set(rawCat, row);
      });

      groupValues.forEach((gVal, sIdx) => {
        const gMapVal = lookupVal.get(gVal) || new Map();
        const gMapRow = lookupRow.get(gVal) || new Map();
        const seriesData: (number | null)[] = [];
        const seriesItems: StratumBarSeriesItem[] = [];

        repCategories.forEach(cat => {
          const hasCat = gMapVal.has(cat);
          const numVal = hasCat ? gMapVal.get(cat)! : null;
          seriesData.push(numVal);

          const row = gMapRow.get(cat);
          const targetVal = targetMetricKey && row ? Number(row[targetMetricKey]) || null : null;
          seriesItems.push({
            category: cat,
            value: numVal,
            formattedValue: numVal !== null ? formatter(numVal) : undefined,
            targetValue: targetVal,
            rawData: row,
          });
        });

        repSeries.push({
          name: gVal,
          key: gVal,
          color: getColor(gVal, sIdx),
          data: seriesData,
          items: seriesItems,
          yAxisIndex: 0,
          seriesType: 'bar',
        });
      });
    }
  } else if (metricList.length > 1) {
    metricList.forEach((mKey, mIdx) => {
      const seriesData: (number | null)[] = [];
      const seriesItems: StratumBarSeriesItem[] = [];

      repCategories.forEach(cat => {
        const row = data.find(r => String(r[actualXKey] ?? r[resolvedXAxis] ?? Object.values(r)[0]) === cat);
        let rawVal: any = null;
        if (row) {
          if (mKey in row) {
            rawVal = row[mKey];
          } else {
            const matchKey = Object.keys(row).find(k => k.toLowerCase() === mKey.toLowerCase());
            rawVal = matchKey ? row[matchKey] : row[mKey];
          }
        }
        const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && rawVal !== undefined && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
        seriesData.push(numVal);

        seriesItems.push({
          category: cat,
          value: numVal,
          formattedValue: numVal !== null ? formatter(numVal) : undefined,
          rawData: row,
        });
      });

      repSeries.push({
        name: mKey,
        key: mKey,
        color: palette[mIdx % palette.length],
        data: seriesData,
        items: seriesItems,
        yAxisIndex: 0,
        seriesType: 'bar',
      });
    });
  } else {
    const seriesData: (number | null)[] = [];
    const seriesItems: StratumBarSeriesItem[] = [];

    repCategories.forEach(cat => {
      const row = data.find(r => String(r[actualXKey] ?? r[resolvedXAxis] ?? Object.values(r)[0]) === cat);
      let rawVal: any = null;
      if (row) {
        if (actualMetricKey in row) {
          rawVal = row[actualMetricKey];
        } else {
          const matchKey = Object.keys(row).find(k => k.toLowerCase() === primaryMetric.toLowerCase())
            || Object.keys(row).find(k => k.toLowerCase() === actualMetricKey.toLowerCase())
            || Object.keys(row).find(k => k !== actualXKey && k !== '__timestamp' && !k.startsWith('__') && typeof row[k] === 'number');
          rawVal = matchKey ? row[matchKey] : row[primaryMetric];
        }
      }
      const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && rawVal !== undefined && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
      seriesData.push(numVal);

      const targetVal = targetMetricKey && row ? Number(row[targetMetricKey]) || null : null;
      seriesItems.push({
        category: cat,
        value: numVal,
        formattedValue: numVal !== null ? formatter(numVal) : undefined,
        targetValue: targetVal,
        rawData: row,
      });
    });

    repSeries.push({
      name: primaryMetric,
      key: primaryMetric,
      color: palette[0],
      data: seriesData,
      items: seriesItems,
      yAxisIndex: 0,
      seriesType: 'bar',
    });
  }

  if (secondaryMetricList.length > 0) {
    secondaryMetricList.forEach((secMetricName, secIdx) => {
      const actualSecKey = Object.keys(sampleRow).find(
        k => k.toLowerCase() === secMetricName.toLowerCase()
      ) || secMetricName;

      const secData: (number | null)[] = [];
      const secItems: StratumBarSeriesItem[] = [];

      repCategories.forEach(cat => {
        const matchingRows = data.filter(r => {
          if (combineFlag && actualBreakdownKey && r[actualBreakdownKey]) {
            return `${r[actualXKey]} [${r[actualBreakdownKey]}]` === cat;
          }
          return String(r[actualXKey]) === cat;
        });

        let numVal: number | null = null;
        if (matchingRows.length > 0) {
          const vals = matchingRows
            .map(r => r[actualSecKey])
            .filter(v => typeof v === 'number' && !isNaN(v)) as number[];
          if (vals.length > 0) {
            numVal = vals.reduce((a, b) => a + b, 0) / vals.length;
          }
        }

        secData.push(numVal);
        secItems.push({
          category: cat,
          value: numVal,
          formattedValue: numVal !== null ? secFormatter(numVal) : undefined,
          rawData: matchingRows[0],
        });
      });

      const chosenColor = secIdx === 0 && secondary_line_color ? secondary_line_color : secPalette[secIdx % secPalette.length];
      repSeries.push({
        name: secMetricName,
        key: `sec_${secMetricName}`,
        color: chosenColor,
        data: secData,
        items: secItems,
        yAxisIndex: 1,
        seriesType: (secondary_series_type || 'line') as 'bar' | 'line',
      });
    });
  }

  return { categories: repCategories, series: repSeries };
}
