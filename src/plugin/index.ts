import { ChartMetadata, ChartPlugin, Behavior } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import example from '../images/example.png';

const t = (str: string) => str;

const metadata = new ChartMetadata({
  name: t('StratumBar — 3D Isometric & Advanced Bar Chart'),
  description: t(
    'Advanced Bar and Column chart with dual-engine 2D/3D isometric volumetric rendering, benchmark reference lines, automatic delta % badges, grouped and stacked layouts, and an interactive runtime toolbar.',
  ),
  behaviors: [Behavior.InteractiveChart, Behavior.DrillToDetail],
  category: t('Ranking'),
  tags: [
    t('StratumBar'),
    t('Bar'),
    t('Column'),
    t('3D'),
    t('Isometric'),
    t('Benchmark'),
    t('Delta'),
    t('ECharts'),
    t('Healthcare'),
    t('Cross-filter'),
  ],
  credits: ['Francesco Castaldi'],
  exampleGallery: [{ url: example }],
  thumbnail,
});

export default class StratumBarChartPlugin extends ChartPlugin {
  constructor() {
    super({
      buildQuery: buildQuery as any,
      controlPanel,
      loadChart: () => import('../components/StratumBarChart'),
      metadata,
      transformProps: transformProps as any,
    });
  }
}
