import { getTooltipFormatter } from '../src/utils/echartsUtils';

// Bar of 1500 against a threshold of 1000: +50,0% (+500), above the threshold
const items = [{ seriesName: 'Richieste', value: 1500, seriesIndex: 0, color: '#1c3d5e', data: 1500 }];
const benchmark = { value: 1000, label: 'Obiettivo' };

const tooltip = (benchmarkDelta?: { show: boolean; polarity: 'normal' | 'inverted' }) =>
  getTooltipFormatter(
    ['CA'], false, ['#1c3d5e'], true, benchmark,
    undefined, undefined, undefined, false, true, undefined, undefined, benchmarkDelta,
  )(items);

const GOOD = '#10b981';
const BAD = '#ef4444';

describe('threshold deviation in the tooltip', () => {
  it('writes the numbers in Italian', () => {
    const html = tooltip();
    expect(html).toContain('1.500');
    expect(html).toContain('+50,0%');
    expect(html).toContain('(+500)');
  });

  it('is shown by default, green above the threshold', () => {
    const html = tooltip();
    expect(html).toContain('vs Target');
    expect(html).toContain(GOOD);
  });

  it('turns red above the threshold when the polarity is inverted (waiting times, costs)', () => {
    const html = tooltip({ show: true, polarity: 'inverted' });
    expect(html).toContain(BAD);
    expect(html).not.toContain(GOOD);
  });

  it('disappears when the deviation badge is off', () => {
    const html = tooltip({ show: false, polarity: 'normal' });
    expect(html).not.toContain('vs Target');
    expect(html).toContain('1.500');
  });
});
