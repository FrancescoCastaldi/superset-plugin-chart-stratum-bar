import { ControlPanelSectionConfig, sharedControls } from '@superset-ui/chart-controls';
import { allOf, hasSecondary, isValue } from './helpers';

const secondoAsse: ControlPanelSectionConfig = {
  label: 'Secondo asse (metriche aggiuntive)',
  tabOverride: 'data',
  description:
    'Metriche in più disegnate su un secondo asse verticale a destra, con un colore proprio. Esempio: barre per numero di accessi e una linea per il tasso di ricovero in percentuale.',
  expanded: false,
  controlSetRows: [
    [
      {
        name: 'secondary_metrics',
        config: {
          ...sharedControls.metrics,
          label: 'Metriche sul secondo asse',
          description:
            'Le metriche da disegnare sull\'asse di destra. Esempi: Tasso di ricovero %, Degenza media, Costo unitario.',
          multi: true,
          validators: [],
        },
      },
    ],
    [
      {
        name: 'secondary_series_type',
        config: {
          type: 'SelectControl',
          label: 'Come disegnarle',
          description: 'Linea con punti: un andamento continuo. Barre: barre secondarie sull\'asse di destra.',
          choices: [
            ['line', 'Linea con punti'],
            ['bar', 'Barre'],
          ],
          default: 'line',
          renderTrigger: true,
          visibility: hasSecondary,
        },
      },
    ],
    [
      {
        name: 'y_axis_2_title',
        config: {
          type: 'TextControl',
          label: 'Titolo del secondo asse',
          description: 'Il testo sopra l\'asse di destra. Esempio: "Tasso di ricovero %".',
          default: '',
          renderTrigger: true,
          visibility: hasSecondary,
        },
      },
      {
        name: 'y_axis_2_format',
        config: {
          type: 'SelectControl',
          freeForm: true,
          label: 'Formato dei numeri del secondo asse',
          description: 'Come scrivere i numeri dell\'asse di destra. Esempio: ".2%" per le percentuali, "$,.2f" per le valute.',
          choices: [
            ['.2%', 'Percentuale (12,34%)'],
            [',.1f', 'Un decimale (1.234,5)'],
            [',.2f', 'Due decimali (1.234,56)'],
            [',.0f', 'Intero (1.234)'],
            ['$,.2f', 'Valuta ($1.234,56)'],
            ['~s', 'Abbreviato (1,2k, 3,4M)'],
          ],
          default: ',.2f',
          renderTrigger: true,
          visibility: hasSecondary,
        },
      },
    ],
    [
      {
        name: 'secondary_line_color',
        config: {
          type: 'TextControl',
          label: 'Colore del secondo asse',
          description: 'Codice esadecimale del colore della linea e dei numeri di destra. Esempi: #ea580c (arancio), #f59e0b (ambra), #ec4899 (rosa).',
          default: '#ea580c',
          renderTrigger: true,
          visibility: hasSecondary,
        },
      },
      {
        name: 'secondary_line_width',
        config: {
          type: 'SelectControl',
          label: 'Spessore della linea',
          description: 'Lo spessore della linea del secondo asse, in pixel.',
          choices: [
            [2, '2 px (sottile)'],
            [3, '3 px (standard)'],
            [4, '4 px (marcato)'],
          ],
          default: 3,
          renderTrigger: true,
          visibility: allOf(hasSecondary, isValue('secondary_series_type', 'line')),
        },
      },
    ],
    [
      {
        name: 'secondary_area_gradient',
        config: {
          type: 'CheckboxControl',
          label: 'Sfumatura sotto la linea',
          description: 'Colora leggermente l\'area sotto la linea del secondo asse, con una sfumatura.',
          default: true,
          renderTrigger: true,
          visibility: allOf(hasSecondary, isValue('secondary_series_type', 'line')),
        },
      },
    ],
  ],
};

export default secondoAsse;
