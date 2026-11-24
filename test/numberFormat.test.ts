import {
  formatCompact,
  formatNumber,
  formatPercent,
  italianNumber,
  numberFormatter,
} from '../src/utils/numberFormat';

describe('italianNumber', () => {
  it('swaps thousands and decimal separators', () => {
    expect(italianNumber('1,234.56')).toBe('1.234,56');
    expect(italianNumber('1,234,567')).toBe('1.234.567');
    expect(italianNumber('7.03')).toBe('7,03');
    expect(italianNumber('12.34%')).toBe('12,34%');
    expect(italianNumber('1.2k')).toBe('1,2k');
  });

  it('leaves text without separators alone', () => {
    expect(italianNumber('950')).toBe('950');
    expect(italianNumber('N/A')).toBe('N/A');
  });
});

describe('numberFormatter', () => {
  it('writes the result of the Superset formatter in Italian', () => {
    // The Superset mock writes en-US like d3: 1,234.50 and 12.34%
    expect(numberFormatter(',.2f')(1234.5)).toBe('1.234,50');
    expect(numberFormatter('.2%')(0.1234)).toBe('12,34%');
    expect(numberFormatter(',.1f')(7.03)).toBe('7,0');
  });

  it('keeps one formatter per format', () => {
    expect(numberFormatter('.2%')).toBe(numberFormatter('.2%'));
  });

  it('falls back to the integer format without a format', () => {
    expect(numberFormatter()(1234)).toBe(numberFormatter(',.0f')(1234));
  });
});

describe('formatNumber', () => {
  it('groups thousands with a dot, four digits included', () => {
    expect(formatNumber(1234)).toBe('1.234');
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(999)).toBe('999');
  });

  it('writes decimals with a comma, up to the maximum', () => {
    expect(formatNumber(7.03)).toBe('7,03');
    expect(formatNumber(7.034)).toBe('7,03');
    expect(formatNumber(7.5)).toBe('7,5');
    expect(formatNumber(1234.5)).toBe('1.234,5');
    expect(formatNumber(0.126, 1)).toBe('0,1');
  });

  it('handles negatives and zero', () => {
    expect(formatNumber(-1234.5)).toBe('-1.234,5');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatCompact', () => {
  it('abbreviates thousands and millions with a decimal comma', () => {
    expect(formatCompact(1200)).toBe('1,2k');
    expect(formatCompact(3_400_000)).toBe('3,4M');
    expect(formatCompact(-2500)).toBe('-2,5k');
  });

  it('drops the decimal when it is zero', () => {
    expect(formatCompact(1000)).toBe('1k');
    expect(formatCompact(2_000_000)).toBe('2M');
  });

  it('writes small values in full', () => {
    expect(formatCompact(950)).toBe('950');
    expect(formatCompact(7.03)).toBe('7,03');
  });
});

describe('formatPercent', () => {
  it('writes a ratio as a percentage with a decimal comma', () => {
    expect(formatPercent(0.1234)).toBe('12,3%');
    expect(formatPercent(0.1234, 2)).toBe('12,34%');
    expect(formatPercent(1)).toBe('100%');
  });
});
