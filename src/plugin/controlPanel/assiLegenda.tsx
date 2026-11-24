import type { ControlPanelSectionConfig } from '@superset-ui/chart-controls';
import { isOn } from './helpers';

const assiLegenda: ControlPanelSectionConfig = {
  label: 'Assi, legenda e interattività',
  tabOverride: 'customize',
  description: 'Titoli degli assi, legenda e cosa succede quando si clicca una barra.',
  expanded: false,
  controlSetRows: [
    [
      {
        name: 'x_axis_title',
        config: {
          type: 'TextControl',
          label: 'Titolo dell\'asse X',
          description: 'Il testo sotto l\'asse orizzontale. Esempio: "Mese di prenotazione". Lascia vuoto per nessun titolo.',
          default: '',
          renderTrigger: true,
        },
      },
      {
        name: 'y_axis_title',
        config: {
          type: 'TextControl',
          label: 'Titolo dell\'asse Y',
          description: 'Il testo sopra l\'asse verticale principale. Esempio: "Richieste".',
          default: '',
          renderTrigger: true,
        },
      },
    ],
    [
      {
        name: 'show_legend',
        config: {
          type: 'CheckboxControl',
          label: 'Mostra la legenda',
          description: 'La legenda elenca le serie e i loro colori. Con il confronto tra periodi indica quale barra è T1 e quale T2.',
          default: true,
          renderTrigger: true,
        },
      },
      {
        name: 'legendOrientation',
        config: {
          type: 'SelectControl',
          label: 'Posizione della legenda',
          choices: [
            ['top', 'In alto'],
            ['bottom', 'In basso'],
            ['right', 'A destra'],
          ],
          default: 'top',
          renderTrigger: true,
          visibility: isOn('show_legend'),
        },
      },
    ],
    [
      {
        name: 'emit_filter',
        config: {
          type: 'CheckboxControl',
          label: 'Filtra le altre viste cliccando una barra',
          description:
            'Cliccando una barra, le altre viste della dashboard si filtrano su quella categoria. Cliccando di nuovo la barra il filtro si toglie. Esempio: clic su "Ambulatorio" filtra i grafici della pagina su quell\'ambulatorio.',
          default: true,
          renderTrigger: true,
        },
      },
    ],
  ],
};

export default assiLegenda;
