import buildQuery from '../src/plugin/buildQuery';

describe('StratumBar buildQuery', () => {
  it('should include columns, groupby, metrics, and preserve native/extra filters', () => {
    const formData: any = {
      viz_type: 'stratum_bar',
      datasource: '70__table',
      x_axis: 'CANALE',
      groupby: ['CANALE', 'REGIME'],
      metrics: ['richieste'],
      extra_form_data: {
        filters: [
          { col: 'ANNO_CORRENTE', op: 'IN', val: [2026] },
          { col: 'SEDE', op: 'IN', val: ['IDI'] },
        ],
      },
      adhoc_filters: [
        {
          clause: 'WHERE',
          expressionType: 'SIMPLE',
          filterOptionName: 'filter_1',
          comparator: 'Convenzioni',
          operator: '==',
          subject: 'REGIME',
        },
      ],
    };

    const queryContext = buildQuery(formData);
    expect(queryContext).toBeDefined();
    const q = (queryContext as any).queries ? (queryContext as any).queries[0] : (queryContext as any)[0];
    expect(q.columns).toEqual(['CANALE', 'REGIME']);
    expect(q.groupby).toEqual(['CANALE', 'REGIME']);
    expect(q.metrics).toEqual(['richieste']);

    // Ensure native filters are in q.filters
    expect(q.filters).toBeDefined();
    const filterCols = (q.filters || []).map((f: any) => f.col);
    expect(filterCols).toContain('ANNO_CORRENTE');
    expect(filterCols).toContain('SEDE');
  });
});
