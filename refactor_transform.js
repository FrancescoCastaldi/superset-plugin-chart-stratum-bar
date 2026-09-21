const fs = require('fs');
const p = 'D:/Sviluppo/superset-plugins/superset-plugin-chart-stratum-bar/src/plugin/transformProps.ts';
let code = fs.readFileSync(p, 'utf8');

const importStr = "import { resolveColors, resolveDimensions, computeBenchmark } from './transformPropsUtils';\n";
code = code.replace("import {", importStr + "import {");

code = code.replace(/const DEFAULT_COLORS = \[[\s\S]*?\];/m, '');

// Resolve dimensions
code = code.replace(/const rawXAxisList = ensureIsArray[\s\S]*?const actualBreakdownKey = findRowKey\(secondaryDimName\);/m, 
  "const { resolvedXAxis, actualXKey, actualBreakdownKey } = resolveDimensions(fd, sampleRow);");

// Resolve colors
code = code.replace(/const dashLabelColors[\s\S]*?return palette\[idx % palette\.length\];\n  \};/m, 
  "const { combinedLabelColors, palette, getColor } = resolveColors(fd, rawFd, scaleInstance);");

// Benchmark
code = code.replace(/let benchmark: BenchmarkConfig \| undefined;[\s\S]*?label: bLabel,\n    \};\n/m, 
  "const benchmark = computeBenchmark(series, showBenchmark, benchmarkType || '', Number(benchmarkValue) || 0, formatter);");

fs.writeFileSync(p, code);
