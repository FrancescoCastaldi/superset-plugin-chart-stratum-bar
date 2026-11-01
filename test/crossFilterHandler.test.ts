import { buildCrossFilterHandler } from '../src/plugin/crossFilterHandler';

describe('buildCrossFilterHandler', () => {
  const base = { emit_filter: true, primaryMetric: 'sales', actualXKey: 'territory', onAddFilter: undefined };

  it('emits an IN filter on the clicked category', () => {
    const setDataMask = jest.fn();
    buildCrossFilterHandler({ ...base, currentSelected: [], setDataMask })('EMEA');
    expect(setDataMask).toHaveBeenCalledWith({
      extraFormData: { filters: [{ col: 'territory', op: 'IN', val: ['EMEA'] }] },
      filterState: { value: [['EMEA']], selectedValues: ['EMEA', 'EMEA'] },
    });
  });

  it('adds the breakdown value when a stacked series is clicked', () => {
    const setDataMask = jest.fn();
    buildCrossFilterHandler({ ...base, actualBreakdownKey: 'deal_size', currentSelected: [], setDataMask })('EMEA', 'Large');
    expect(setDataMask.mock.calls[0][0].extraFormData.filters).toEqual([
      { col: 'territory', op: 'IN', val: ['EMEA'] },
      { col: 'deal_size', op: 'IN', val: ['Large'] },
    ]);
  });

  it('clears the filter when the selected category is clicked again', () => {
    const setDataMask = jest.fn();
    buildCrossFilterHandler({ ...base, currentSelected: ['EMEA'], setDataMask })('EMEA');
    expect(setDataMask).toHaveBeenCalledWith({
      extraFormData: { filters: [] },
      filterState: { value: null, selectedValues: null },
    });
  });

  it('does nothing when cross-filtering is off', () => {
    const setDataMask = jest.fn();
    buildCrossFilterHandler({ ...base, emit_filter: false, currentSelected: [], setDataMask })('EMEA');
    expect(setDataMask).not.toHaveBeenCalled();
  });
});
