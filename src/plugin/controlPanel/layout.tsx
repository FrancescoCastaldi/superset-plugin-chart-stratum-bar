import type { ControlPanelSectionConfig } from '@superset-ui/chart-controls';
import { hasTimeMetric } from '../timeMetricHints';
import { isOn, isValue } from './helpers';

const layout: ControlPanelSectionConfig = {
  label: 'Layout, etichette e valori',
  tabOverride: 'customize',
  description: 'Direzione delle barre, come sono impilate le serie, dove compaiono i numeri e come sono formattati.',
  expanded: true,
  controlSetRows: [
    [
      {
        name: 'orientation',
        config: {
          type: 'SelectControl',
          label: 'Direzione',
          description: 'Verticale: colonne che salgono. Orizzontale: barre distese da sinistra a destra, utili con nomi lunghi (es. reparti).',
          choices: [
            ['vertical', 'Verticale (colonne)'],
            ['horizontal', 'Orizzontale (barre)'],
          ],
          default: 'vertical',
          renderTrigger: true,
        },
      },
      {
        name: 'stacking',
        config: {
          type: 'SelectControl',
          label: 'Serie affiancate o impilate',
          description:
            'Affiancate: una barra per serie accanto all\'altra. Impilate: le serie una sopra l\'altra, il totale è l\'altezza. Esempio: Pubblico e Privato impilati mostrano il totale del canale.',
          choices: [
            ['none', 'Affiancate'],
            ['stack', 'Impilate'],
          ],
          default: 'none',
          renderTrigger: true,
        },
      },
    ],
    [
      {
        name: 'showValue',
        config: {
          type: 'CheckboxControl',
          label: 'Mostra i valori sulle barre',
          description: 'Scrive il numero di ogni barra, formattato come scelto qui sotto.',
          default: true,
          renderTrigger: true,
        },
      },
      {
        name: 'valuePosition',
        config: {
          type: 'SelectControl',
          label: 'Posizione dei valori',
          description:
            'Sopra la barra, dentro la barra, inclinato di 45 gradi (utile con molte barre), o fuori dalla barra. Vale solo se "Mostra i valori" è attivo.',
          choices: [
            ['top', 'Sopra la barra'],
            ['inside', 'Dentro la barra'],
            ['slanted', 'Inclinato (45 gradi)'],
            ['outside', 'Fuori dalla barra'],
          ],
          default: 'top',
          renderTrigger: true,
          visibility: isOn('showValue'),
        },
      },
    ],
    [
      {
        name: 'numberFormat',
        config: {
          type: 'SelectControl',
          freeForm: true,
          label: 'Formato dei numeri',
          description:
            'Come scrivere i numeri delle barre, sempre con il punto per le migliaia e la virgola per i decimali. Puoi anche scrivere un formato tuo. Esempi: ",.0f" = 1.234, ",.1f" = 7,0 (per le medie), ",.2f" = 1.234,56, ".2%" = 12,34%, "~s" = 1,2k.',
          choices: [
            [',.0f', 'Intero con separatore (1.234)'],
            [',.1f', 'Un decimale (1.234,5)'],
            [',.2f', 'Due decimali (1.234,56)'],
            ['.2%', 'Percentuale (12,34%)'],
            ['~s', 'Abbreviato (1,2k, 3,4M)'],
          ],
          default: ',.0f',
          renderTrigger: true,
        },
      },
    ],
    [
      {
        name: 'time_detection',
        config: {
          type: 'SelectControl',
          label: 'Campi Time e durate',
          description:
            'Le metriche di tipo Time (ore:minuti:secondi, per esempio un tempo medio di attesa) arrivano come testo e non si possono disegnare come numeri. Con "Automatico" il grafico le riconosce, le disegna in proporzione e scrive asse, valori e tooltip come durate. Disattivalo solo se una metrica che sembra un orario deve restare testo.',
          choices: [
            ['auto', 'Automatico (riconosce i campi Time)'],
            ['off', 'Disattivato'],
          ],
          default: 'auto',
          clearable: false,
          renderTrigger: true,
          visibility: hasTimeMetric,
        },
      },
    ],
    [
      {
        name: 'time_display_format',
        config: {
          type: 'SelectControl',
          label: 'Formato delle durate',
          description:
            'Come scrivere i campi Time su asse, barre e tooltip. Automatico: mm:ss, oppure h:mm:ss quando un valore arriva a 1 ora. Gli altri formati sono fissi. Vale solo per le metriche di tipo Time: il formato dei numeri qui sopra non le riguarda.',
          choices: [
            ['auto', 'Automatico (mm:ss oppure h:mm:ss)'],
            ['hms', 'Ore, minuti, secondi (1:05:30)'],
            ['ms', 'Minuti e secondi (65:30)'],
            ['minutes', 'Minuti decimali (65,5 min)'],
            ['hours', 'Ore decimali (1,09 h)'],
            ['seconds', 'Secondi (3930 s)'],
          ],
          default: 'auto',
          clearable: false,
          renderTrigger: true,
          visibility: hasTimeMetric,
        },
      },
      {
        name: 'time_fraction_digits',
        config: {
          type: 'SelectControl',
          label: 'Decimali delle durate',
          description:
            'Quante cifre dopo la virgola mostrare nei secondi (formati a orologio) o nel valore (formati decimali). Esempio: 0 scrive 12:54, 1 scrive 12:54.4, 3 scrive 12:54.425.',
          choices: [
            [0, 'Nessuno'],
            [1, 'Uno'],
            [2, 'Due'],
            [3, 'Tre'],
          ],
          default: 0,
          clearable: false,
          renderTrigger: true,
          visibility: hasTimeMetric,
        },
      },
    ],
    [
      {
        name: 'barBorderRadius',
        config: {
          type: 'SliderControl',
          label: 'Arrotondamento degli angoli (2D)',
          description: 'Quanto sono arrotondati gli angoli delle barre 2D. 0 per barre squadrate, 6 per l\'impostazione standard.',
          min: 0,
          max: 20,
          step: 1,
          default: 6,
          renderTrigger: true,
          visibility: isValue('viewMode', '2d'),
        },
      },
      {
        name: 'showTrackBackground',
        config: {
          type: 'CheckboxControl',
          label: 'Sfondo di riferimento (2D)',
          description: 'Disegna una barra chiara dietro ogni barra, come scala del valore massimo. Utile per vedere quanto manca al massimo.',
          default: false,
          renderTrigger: true,
          visibility: isValue('viewMode', '2d'),
        },
      },
    ],
  ],
};

export default layout;
