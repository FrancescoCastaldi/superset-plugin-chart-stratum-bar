export const axisBreakOutlierData = [
  { mese: 'Gennaio', sede: 'Hub Centrale', volume_transazioni: 820 },
  { mese: 'Gennaio', sede: 'Spoke Territoriale', volume_transazioni: 340 },

  { mese: 'Febbraio', sede: 'Hub Centrale', volume_transazioni: 910 },
  { mese: 'Febbraio', sede: 'Spoke Territoriale', volume_transazioni: 390 },

  { mese: 'Marzo', sede: 'Hub Centrale', volume_transazioni: 1050 },
  { mese: 'Marzo', sede: 'Spoke Territoriale', volume_transazioni: 420 },

  { mese: 'Aprile', sede: 'Hub Centrale', volume_transazioni: 880 },
  { mese: 'Aprile', sede: 'Spoke Territoriale', volume_transazioni: 360 },

  { mese: 'Maggio', sede: 'Hub Centrale', volume_transazioni: 1140 },
  { mese: 'Maggio', sede: 'Spoke Territoriale', volume_transazioni: 480 },

  { mese: 'Giugno', sede: 'Hub Centrale', volume_transazioni: 1220 },
  { mese: 'Giugno', sede: 'Spoke Territoriale', volume_transazioni: 510 },

  { mese: 'Luglio (Picco Estremo)', sede: 'Hub Centrale', volume_transazioni: 14800 },
  { mese: 'Luglio (Picco Estremo)', sede: 'Spoke Territoriale', volume_transazioni: 890 },

  { mese: 'Agosto', sede: 'Hub Centrale', volume_transazioni: 620 },
  { mese: 'Agosto', sede: 'Spoke Territoriale', volume_transazioni: 280 },

  { mese: 'Settembre', sede: 'Hub Centrale', volume_transazioni: 1180 },
  { mese: 'Settembre', sede: 'Spoke Territoriale', volume_transazioni: 490 },

  { mese: 'Ottobre', sede: 'Hub Centrale', volume_transazioni: 1310 },
  { mese: 'Ottobre', sede: 'Spoke Territoriale', volume_transazioni: 540 },
];

export const axisBreakOutlierFormData = {
  datasource: '205__table',
  viz_type: 'stratum_bar',
  slice_id: 205,
  x_axis: 'mese',
  groupby: ['sede'],
  metrics: ['volume_transazioni'],
  viewMode: '3d',
  orientation: 'vertical',
  stacking: 'none',
  barShape3D: 'prism',
  depth3D: 24,
  tilt3D: 25,
  shadow3D: true,
  enable_axis_break: true,
  axis_break_mode: 'manual',
  axis_break_threshold: 2500,
  show_smart_annotations: true,
  showValue: true,
  valuePosition: 'top',
  numberFormat: ',.0f',
  show_legend: true,
  legendOrientation: 'top',
  emit_filter: true,
  enableToolbar: true,
  y_axis_title: 'Transazioni Elaborate',
  x_axis_title: 'Mese Operativo',
  sort_by: 'original',
};
