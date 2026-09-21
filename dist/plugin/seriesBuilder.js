export function buildSeriesRepresentation(options) {
    const { data, isPivoted, actualXKey, actualBreakdownKey, actualMetricKey, targetMetricKey, primaryMetric, metricList, secondaryMetricList, getColor, palette, formatter, resolvedXAxis, secFormatter, secondary_line_color, secondary_series_type, secPalette, combineFlag, sampleRow, potentialPivotedKeys } = options;
    const categoriesSet = new Set();
    data.forEach(row => {
        const val = row[actualXKey];
        if (val !== null && val !== undefined) {
            if (combineFlag && actualBreakdownKey && row[actualBreakdownKey] !== undefined && row[actualBreakdownKey] !== null) {
                categoriesSet.add(`${val} · ${row[actualBreakdownKey]}`);
            }
            else {
                categoriesSet.add(String(val));
            }
        }
    });
    const repCategories = Array.from(categoriesSet);
    const repSeries = [];
    if (isPivoted) {
        potentialPivotedKeys.forEach((sName, sIdx) => {
            const seriesData = [];
            const seriesItems = [];
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
    }
    else if (actualBreakdownKey && actualBreakdownKey in sampleRow) {
        const groupValuesSet = new Set();
        data.forEach(row => {
            const gVal = row[actualBreakdownKey];
            if (gVal !== null && gVal !== undefined) {
                groupValuesSet.add(String(gVal));
            }
        });
        const groupValues = Array.from(groupValuesSet);
        if (combineFlag) {
            groupValues.forEach((gVal, sIdx) => {
                const seriesData = [];
                const seriesItems = [];
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
        }
        else {
            const lookupVal = new Map();
            const lookupRow = new Map();
            data.forEach(row => {
                const rawCat = row[actualXKey] !== null && row[actualXKey] !== undefined ? String(row[actualXKey]) : 'N/D';
                const gVal = row[actualBreakdownKey] !== null && row[actualBreakdownKey] !== undefined ? String(row[actualBreakdownKey]) : 'N/D';
                if (!lookupVal.has(gVal)) {
                    lookupVal.set(gVal, new Map());
                    lookupRow.set(gVal, new Map());
                }
                const rawVal = row[actualMetricKey];
                const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : 0;
                const currentSum = lookupVal.get(gVal).get(rawCat) || 0;
                lookupVal.get(gVal).set(rawCat, currentSum + numVal);
                lookupRow.get(gVal).set(rawCat, row);
            });
            groupValues.forEach((gVal, sIdx) => {
                const gMapVal = lookupVal.get(gVal) || new Map();
                const gMapRow = lookupRow.get(gVal) || new Map();
                const seriesData = [];
                const seriesItems = [];
                repCategories.forEach(cat => {
                    const hasCat = gMapVal.has(cat);
                    const numVal = hasCat ? gMapVal.get(cat) : null;
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
    }
    else if (metricList.length > 1) {
        metricList.forEach((mKey, mIdx) => {
            const seriesData = [];
            const seriesItems = [];
            repCategories.forEach(cat => {
                const row = data.find(r => String(r[resolvedXAxis]) === cat);
                const rawVal = row ? row[mKey] : null;
                const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
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
    }
    else {
        const seriesData = [];
        const seriesItems = [];
        repCategories.forEach(cat => {
            const row = data.find(r => String(r[resolvedXAxis]) === cat);
            const rawVal = row ? row[primaryMetric] : null;
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
            const actualSecKey = Object.keys(sampleRow).find(k => k.toLowerCase() === secMetricName.toLowerCase()) || secMetricName;
            const secData = [];
            const secItems = [];
            repCategories.forEach(cat => {
                const matchingRows = data.filter(r => {
                    if (combineFlag && actualBreakdownKey && r[actualBreakdownKey]) {
                        return `${r[actualXKey]} [${r[actualBreakdownKey]}]` === cat;
                    }
                    return String(r[actualXKey]) === cat;
                });
                let numVal = null;
                if (matchingRows.length > 0) {
                    const vals = matchingRows
                        .map(r => r[actualSecKey])
                        .filter(v => typeof v === 'number' && !isNaN(v));
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
                seriesType: (secondary_series_type || 'line'),
            });
        });
    }
    return { categories: repCategories, series: repSeries };
}
//# sourceMappingURL=seriesBuilder.js.map