import type { ControlPanelSectionConfig } from '@superset-ui/chart-controls';
import { allOf, isOn, isValue } from './helpers';

const asseSpezzato: ControlPanelSectionConfig = {
  label: 'Asse spezzato (valori anomali)',
  tabOverride: 'customize',
  description:
    'Quando una barra è molto più alta delle altre, il grafico tronca la sua scala: le barre piccole restano leggibili e sopra la barra troncata compare il valore reale.',
  expanded: false,
  controlSetRows: [
    [
      {
        name: 'enable_axis_break',
        config: {
          type: 'CheckboxControl',
          label: 'Attiva l\'asse spezzato',
          description:
            'Taglia la scala delle barre anomale, mantenendo leggibili quelle piccole. Esempio: un reparto con 900 richieste e gli altri con 40 restano entrambi visibili.',
          default: false,
          renderTrigger: true,
        },
      },
      {
        name: 'axis_break_mode',
        config: {
          type: 'SelectControl',
          label: 'Come scegliere dove tagliare',
          description:
            'Automatico: rileva da solo le barre anomale. 90° o 95° percentile: taglia sopra il valore che lascia il 10% o il 5% delle barre più alte. Manuale: un valore fisso che scrivi tu.',
          choices: [
            ['auto', 'Automatico (rilevamento anomalie)'],
            ['p90', '90° percentile'],
            ['p95', '95° percentile'],
            ['manual', 'Valore fisso manuale'],
          ],
          default: 'auto',
          renderTrigger: true,
          visibility: isOn('enable_axis_break'),
        },
      },
    ],
    [
      {
        name: 'axis_break_threshold',
        config: {
          type: 'TextControl',
          label: 'Soglia di taglio manuale',
          description: 'Il valore sopra il quale le barre vengono tagliate, con il segno //. Esempio: 150.',
          default: 150,
          renderTrigger: true,
          visibility: allOf(isOn('enable_axis_break'), isValue('axis_break_mode', 'manual')),
        },
      },
    ],
  ],
};

export default asseSpezzato;
