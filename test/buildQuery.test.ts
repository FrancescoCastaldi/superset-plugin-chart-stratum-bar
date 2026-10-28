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

  it('should not emit adhoc_filters in the query object so that Jinja filter_values sees native filters', () => {
    const formData: any = {
      viz_type: 'stratum_bar',
      datasource: '78__table',
      x_axis: 'CANALE',
      metrics: ['richieste'],
      extra_form_data: {
        filters: [{ col: 'ESCLUDI_LABORATORIO', op: 'IN', val: ['SI'] }],
        adhoc_filters: [
          {
            clause: 'WHERE',
            expressionType: 'SIMPLE',
            comparator: ['Convenzioni'],
            operator: 'IN',
            subject: 'REGIME',
          },
        ],
      },
      adhoc_filters: [
        {
          clause: 'WHERE',
          expressionType: 'SIMPLE',
          comparator: ['Prestazioni cliniche'],
          operator: 'IN',
          subject: 'AREA_PRESTAZIONE',
        },
      ],
    };

    const queryContext = buildQuery(formData);
    const q = (queryContext as any).queries ? (queryContext as any).queries[0] : (queryContext as any)[0];
    expect(q).not.toHaveProperty('adhoc_filters');
    expect((q.filters || []).map((f: any) => f.col)).toContain('ESCLUDI_LABORATORIO');
  });

  it('should forward dashboard time_compare to query.time_offsets', () => {
    const formData: any = {
      viz_type: 'stratum_bar',
      datasource: '70__table',
      x_axis: 'CANALE',
      metrics: ['richieste'],
      extra_form_data: {
        time_compare: ['2026-08-01 : 2026-08-31'],
      },
    };

    const queryContext = buildQuery(formData);
    const q = (queryContext as any).queries ? (queryContext as any).queries[0] : (queryContext as any)[0];
    expect(q.time_offsets).toEqual(['2026-08-01 : 2026-08-31']);
  });

  it('should conditionally append comparison_metric when time_comparison_mode is dual_metric', () => {
    const formData: any = {
      viz_type: 'stratum_bar',
      datasource: '70__table',
      x_axis: 'CANALE',
      metrics: ['richieste_corr'],
      time_comparison_mode: 'dual_metric',
      comparison_metric: 'richieste_conf',
    };

    const queryContext = buildQuery(formData);
    const q = (queryContext as any).queries ? (queryContext as any).queries[0] : (queryContext as any)[0];
    expect(q.metrics).toEqual(['richieste_corr', 'richieste_conf']);
  });

  it('should not append comparison_metric when time_comparison_mode is none', () => {
    const formData: any = {
      viz_type: 'stratum_bar',
      datasource: '70__table',
      x_axis: 'CANALE',
      metrics: ['richieste_corr'],
      time_comparison_mode: 'none',
      comparison_metric: 'richieste_conf',
    };

    const queryContext = buildQuery(formData);
    const q = (queryContext as any).queries ? (queryContext as any).queries[0] : (queryContext as any)[0];
    expect(q.metrics).toEqual(['richieste_corr']);
  });
});
