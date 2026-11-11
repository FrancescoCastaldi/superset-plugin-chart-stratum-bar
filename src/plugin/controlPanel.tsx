import {
  ControlPanelConfig,
  ControlPanelsContainerProps,
  sharedControls,
} from '@superset-ui/chart-controls';
import { hasTimeMetric } from './timeMetricHints';

/*
 * Pannello di controllo del grafico, in italiano.
 * Ogni sezione e ogni controllo ha un tooltip (`description`) con l'indicazione di cosa fa e un esempio.
 * I nomi dei controlli sono quelli salvati nei chart: non cambiarli, altrimenti i grafici esistenti perdono le impostazioni.
 */

const isComparing = ({ controls }: ControlPanelsContainerProps) =>
  Boolean(controls?.time_comparison_mode?.value) && controls?.time_comparison_mode?.value !== 'none';

const hasSecondary = ({ controls }: ControlPanelsContainerProps) =>
  Boolean(controls?.secondary_metrics?.value && (controls.secondary_metrics.value as any[]).length > 0);

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: 'Dati',
      description:
        'Cosa mostrare sull\'asse orizzontale, quanto alta è ogni barra e come dividere le barre per colore. Il grafico legge i dati dalla query del dataset.',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'x_axis',
            config: {
              ...sharedControls.groupby,
              label: 'Asse X (categoria principale)',
              description:
                'La dimensione che compone le barre sull\'asse orizzontale. Esempio: Mese, Reparto, Canale di prenotazione. Una sola colonna.',
              multi: false,
              clearable: true,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'groupby',
            config: {
              ...sharedControls.groupby,
              label: 'Serie per colore (suddivisione)',
              description:
                'Divide ogni categoria in più barre colorate. Esempio: sull\'asse X il Canale e qui il Regime (Privato, Pubblico), così ogni canale mostra una barra per regime. Con il confronto tra periodi attivo, le categorie diventano "Canale · Regime".',
              multi: true,
              clearable: true,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'combine_category_breakdown',
            config: {
              type: 'CheckboxControl',
              label: 'Unisci asse e serie nelle etichette',
              description:
                'Mostra "Categoria · Serie" sull\'asse X invece di barre affiancate. Esempio: "Ambulatorio · Privato". Con il confronto tra periodi attivo le etichette sono sempre unite.',
              default: false,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.groupby?.value && (controls.groupby.value as any[]).length > 0),
            },
          },
        ],
        [
          {
            name: 'metrics',
            config: {
              ...sharedControls.metrics,
              label: 'Metrica principale (altezza delle barre)',
              description:
                'Il valore numerico che decide l\'altezza delle barre del periodo corrente. Esempio: Numero richieste, Fatturato, Accessi.',
              clearable: true,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'sort_by',
            config: {
              type: 'SelectControl',
              label: 'Ordina per',
              description:
                'Come mettere in ordine le barre. "Ordine originale": come arrivano dalla query. "Categoria": in ordine alfabetico o cronologico, per esempio Lun-Dom. "Valore della metrica": dalla più alta alla più bassa, utile per le classifiche (Top 10).',
              choices: [
                ['original', 'Ordine originale (come nella query)'],
                ['category', 'Categoria (A-Z, mesi, giorni della settimana)'],
                ['metric', 'Valore della metrica (classifiche, Top N)'],
              ],
              default: 'original',
              renderTrigger: false,
            },
          },
          {
            name: 'order_desc',
            config: {
              type: 'CheckboxControl',
              label: 'Ordine decrescente',
              description:
                'Attivo: Z-A, oppure il valore più alto in cima. Disattivo: A-Z, oppure 1-7 in ordine, oppure il valore più basso in cima. Esempio: per una classifiche dei reparti più richiesti, attiva questa opzione con "Valore della metrica".',
              default: false,
              renderTrigger: false,
            },
          },
        ],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: 'Confronto tra due periodi',
      description:
        'Mette accanto al periodo corrente (T1) un secondo periodo (T2), per vedere quanto è cambiato. Il periodo T1 segue sempre il filtro di tempo della dashboard, per esempio il Calendar Filter. Scegli la modalità in base a come vuoi scegliere il secondo periodo.',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'time_comparison_mode',
            config: {
              type: 'SelectControl',
              label: 'Modalità di confronto',
              description:
                'Nessun confronto: mostra solo il periodo del filtro. Periodo corrente e confronto dal Calendar Filter: il secondo periodo è quello selezionato nel filtro (T2). Confronto automatico (shift): il secondo periodo è il T1 spostato indietro di un anno, un mese, 28 giorni o di un intervallo a scelta. Avanzato: due metriche già calcolate, per esempio "Richieste 2026" e "Richieste 2025".',
              choices: [
                ['none', 'Nessun confronto (solo il periodo del filtro)'],
                ['time_offsets', 'Periodo corrente e confronto dal Calendar Filter'],
                ['time_shift', 'Confronto automatico (shift di 1 anno, 1 mese, 28 giorni)'],
                ['dual_metric', 'Avanzato: due metriche già calcolate'],
              ],
              default: 'none',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'comparison_shift',
            config: {
              type: 'SelectControl',
              freeForm: true,
              label: 'Di quanto spostare il periodo',
              description:
                'Lo spostamento all\'indietro del periodo corrente. Scegli una voce o scrivi il tuo. Esempi: "1 year ago" (anno precedente), "1 month ago" (mese precedente), "28 days ago" (28 giorni prima), "52 weeks ago" (52 settimane prima), "3 months ago" (trimestre precedente).',
              choices: [
                ['1 year ago', 'Anno precedente (1 year ago)'],
                ['1 month ago', 'Mese precedente (1 month ago)'],
                ['28 days ago', '28 giorni prima (28 days ago)'],
                ['52 weeks ago', '52 settimane prima (52 weeks ago)'],
              ],
              default: '1 year ago',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.time_comparison_mode?.value === 'time_shift',
            },
          },
        ],
        [
          {
            name: 'comparison_metric',
            config: {
              ...sharedControls.metric,
              label: 'Metrica del secondo periodo (T2)',
              description:
                'Solo per la modalità avanzata: la metrica già calcolata del secondo periodo, da confrontare con la metrica principale. Esempio: Richieste 2025 da confrontare con Richieste 2026.',
              clearable: true,
              validators: [],
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.time_comparison_mode?.value === 'dual_metric',
            },
          },
        ],
        [
          {
            name: 'time1_label',
            config: {
              type: 'TextControl',
              label: 'Nome del periodo corrente (T1)',
              description:
                'Il nome che compare nella legenda e nel tooltip. Lascia vuoto per il nome automatico preso dal filtro. Esempi: "Ottobre 2026", "Anno corrente".',
              default: '',
              renderTrigger: true,
              visibility: isComparing,
            },
          },
          {
            name: 'time2_label',
            config: {
              type: 'TextControl',
              label: 'Nome del periodo di confronto (T2)',
              description:
                'Il nome del secondo periodo nella legenda e nel tooltip. Lascia vuoto per il nome automatico. Esempi: "Ottobre 2025", "Anno precedente".',
              default: '',
              renderTrigger: true,
              visibility: isComparing,
            },
          },
        ],
        [
          {
            name: 'show_comparison_delta',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra lo scostamento tra T1 e T2',
              description:
                'Nel tooltip, sotto le due barre, compare la differenza in valore assoluto e in percentuale tra il periodo corrente e il confronto. Esempio: 120 contro 100 mostra "+20,0% (+20)". Se il confronto è zero compare "Nuovo".',
              default: true,
              renderTrigger: true,
              visibility: isComparing,
            },
          },
          {
            name: 'comparison_delta_polarity',
            config: {
              type: 'SelectControl',
              label: 'Colore dello scostamento',
              description:
                'Normale: l\'aumento è verde, il calo rosso (es. accessi, fatturato). Invertito: l\'aumento è rosso, il calo verde (es. tempi di attesa, costi).',
              choices: [
                ['normal', 'Normale (aumento verde, calo rosso)'],
                ['inverted', 'Invertito (aumento rosso, calo verde)'],
              ],
              default: 'normal',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                isComparing({ controls } as ControlPanelsContainerProps) && Boolean(controls?.show_comparison_delta?.value),
            },
          },
        ],
      ],
    },
    {
      label: 'Aspetto e motore di disegno',
      description:
        'Come appare il grafico: forma 3D o 2D, colori, tema e formato dei numeri.',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'viewMode',
            config: {
              type: 'SelectControl',
              label: 'Visualizzazione',
              description:
                '3D isometrico: barre a volume con ombre. 2D moderno: barre piatte con angoli arrotondati e, se attivo, lo sfondo di riferimento. Chi guarda può cambiarla anche in dashboard, se la barra degli strumenti è attiva.',
              choices: [
                ['3d', '3D isometrico (volume)'],
                ['2d', '2D moderno (piatto, angoli arrotondati)'],
              ],
              default: '3d',
              renderTrigger: true,
            },
          },
          {
            name: 'theme_mode',
            config: {
              type: 'SelectControl',
              label: 'Tema colori',
              description: 'Chiaro per le dashboard con sfondo bianco, scuro per quelle con sfondo scuro.',
              choices: [
                ['light', 'Chiaro (Light Enterprise)'],
                ['dark', 'Scuro (Dark Obsidian)'],
              ],
              default: 'light',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'color_scheme',
            config: {
              type: 'ColorSchemeControl',
              label: 'Palette di colori',
              description:
                'Palette usata per le barre principali e per le serie. Se la dashboard ha già colori assegnati alle etichette, questi hanno la precedenza.',
              renderTrigger: true,
              default: 'supersetColors',
            },
          },
          {
            name: 'enable_a11y_decal',
            config: {
              type: 'CheckboxControl',
              label: 'Motivi per daltonici',
              description:
                'Aggiunge un motivo geometrico alle barre, così le serie si distinguono anche senza colore. Utile per chi ha difficoltà a distinguere i colori.',
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'barShape3D',
            config: {
              type: 'SelectControl',
              label: 'Forma delle barre 3D',
              description: 'Parallelepipedo: barre squadrate. Cilindro: barre tonde. Vale solo con visualizzazione 3D.',
              choices: [
                ['prism', 'Parallelepipedo'],
                ['cylinder', 'Cilindro'],
              ],
              default: 'prism',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '3d',
            },
          },
          {
            name: 'shadow3D',
            config: {
              type: 'CheckboxControl',
              label: 'Ombre sotto le barre 3D',
              description: 'Disegna un\'ombra morbida sotto ogni barra 3D, per dare profondità. Disattivala per un disegno più essenziale.',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '3d',
            },
          },
        ],
        [
          {
            name: 'depth3D',
            config: {
              type: 'SliderControl',
              label: 'Profondità 3D (px)',
              description: 'Quanto è profonda la barra 3D, in pixel. Valori bassi (5-10) per barre quasi piatte, alti (30-50) per un effetto molto marcato.',
              min: 5,
              max: 50,
              step: 1,
              default: 20,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '3d',
            },
          },
          {
            name: 'tilt3D',
            config: {
              type: 'SliderControl',
              label: 'Inclinazione 3D (gradi)',
              description: 'L\'angolo di vista delle facce superiori e laterali delle barre. Esempio: 25 gradi è l\'impostazione standard, 45 le rende più visibili dall\'alto.',
              min: 15,
              max: 60,
              step: 1,
              default: 25,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '3d',
            },
          },
        ],
      ],
    },
    {
      label: 'Layout, etichette e valori',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.showValue?.value),
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
                'Come scrivere i numeri delle barre. Puoi anche scrivere un formato tuo. Esempi: ",.0f" = 1.234, ",.2f" = 1.234,56, ".2%" = 12,34%, "~s" = 1,2k.',
              choices: [
                [',.0f', 'Intero con separatore (1.234)'],
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
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '2d',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => controls?.viewMode?.value === '2d',
            },
          },
        ],
      ],
    },
    {
      label: 'Secondo asse (metriche aggiuntive)',
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                hasSecondary({ controls } as ControlPanelsContainerProps) && controls?.secondary_series_type?.value === 'line',
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                hasSecondary({ controls } as ControlPanelsContainerProps) && controls?.secondary_series_type?.value === 'line',
            },
          },
        ],
      ],
    },
    {
      label: 'Soglia e annotazioni',
      description:
        'Una linea di riferimento (obiettivo o media) per confrontare le barre, e l\'evidenziazione automatica di massimi e minimi.',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'show_smart_annotations',
            config: {
              type: 'CheckboxControl',
              label: 'Evidenzia massimo e minimo',
              description: 'Segnala automaticamente la barra più alta (🏆) e quella più bassa (📉) con la loro etichetta.',
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'showBenchmark',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra la linea di soglia (obiettivo)',
              description: 'Disegna una linea orizzontale di riferimento, per vedere quali barre superano l\'obiettivo.',
              default: false,
              renderTrigger: true,
            },
          },
          {
            name: 'benchmarkType',
            config: {
              type: 'SelectControl',
              label: 'Come calcolare la soglia',
              description:
                'Valore fisso: un numero scritto a mano. Media o mediana: calcolate sulle barre. Metrica obiettivo: un valore per ogni barra, da un\'altra metrica (es. Budget).',
              choices: [
                ['fixed_value', 'Valore fisso'],
                ['average', 'Media delle barre'],
                ['median', 'Mediana delle barre'],
                ['target_metric', 'Metrica obiettivo'],
              ],
              default: 'fixed_value',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.showBenchmark?.value),
            },
          },
        ],
        [
          {
            name: 'benchmarkValue',
            config: {
              type: 'TextControl',
              label: 'Valore dell\'obiettivo',
              description: 'Il numero della linea di soglia. Esempio: 100 per "almeno 100 richieste al mese". Con i campi Time il valore è in secondi: 600 vale 10:00.',
              default: 100,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.showBenchmark?.value) && controls?.benchmarkType?.value === 'fixed_value',
            },
          },
          {
            name: 'target_metric',
            config: {
              ...sharedControls.metric,
              label: 'Metrica obiettivo',
              description: 'La metrica che fornisce l\'obiettivo di ogni barra. Esempio: Budget richieste, Target accessi.',
              clearable: true,
              validators: [],
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.showBenchmark?.value) && controls?.benchmarkType?.value === 'target_metric',
            },
          },
          {
            name: 'showDeltaBadge',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra lo scostamento dalla soglia',
              description: 'Nel tooltip, la differenza in percentuale rispetto alla soglia. Esempio: "vs Target: +12,5%".',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.showBenchmark?.value),
            },
          },
        ],
        [
          {
            name: 'deltaPolarity',
            config: {
              type: 'SelectControl',
              label: 'Colore dello scostamento dalla soglia',
              description:
                'Normale: sopra la soglia è verde. Invertito: sopra la soglia è rosso (es. tempi di attesa, costi).',
              choices: [
                ['normal', 'Normale (sopra soglia verde)'],
                ['inverted', 'Invertito (sopra soglia rosso)'],
              ],
              default: 'normal',
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.showBenchmark?.value && controls?.showDeltaBadge?.value),
            },
          },
        ],
      ],
    },
    {
      label: 'Asse spezzato (valori anomali)',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enable_axis_break?.value),
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
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                Boolean(controls?.enable_axis_break?.value) && controls?.axis_break_mode?.value === 'manual',
            },
          },
        ],
      ],
    },
    {
      label: 'Assi, legenda e interattività',
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
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.show_legend?.value),
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
    },
    {
      label: 'Barra degli strumenti (in dashboard)',
      description:
        'La barra piccola sopra il grafico, visibile a chi guarda la dashboard. Ogni pulsante può essere nascosto. Il grafico resta uguale, cambia solo ciò che l\'utente può modificare al volo.',
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'enableToolbar',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra la barra degli strumenti',
              description: 'Attiva la barra con i pulsanti qui sotto. Disattivala per un grafico senza pulsanti.',
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'toolbar_show_view_mode',
            config: {
              type: 'CheckboxControl',
              label: 'Pulsante 2D / 3D',
              description: 'Permette di passare da visualizzazione 3D a 2D mentre si guarda la dashboard.',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
          {
            name: 'toolbar_show_orientation',
            config: {
              type: 'CheckboxControl',
              label: 'Pulsante direzione (↕ / ↔)',
              description: 'Permette di girare il grafico tra colonne verticali e barre orizzontali.',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
        ],
        [
          {
            name: 'toolbar_show_stacking',
            config: {
              type: 'CheckboxControl',
              label: 'Pulsante affiancate / impilate',
              description: 'Permette di passare tra serie affiancate e impilate.',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
          {
            name: 'toolbar_show_dual_axis',
            config: {
              type: 'CheckboxControl',
              label: 'Pulsante secondo asse',
              description: 'Permette di mostrare o nascondere il secondo asse.',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
        ],
        [
          {
            name: 'toolbar_show_breakdown_toggle',
            config: {
              type: 'CheckboxControl',
              label: 'Pulsante unisci asse e serie',
              description: 'Permette di unire o separare la suddivisione per serie nelle etichette dell\'asse X.',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
          {
            name: 'toolbar_show_benchmark',
            config: {
              type: 'CheckboxControl',
              label: 'Pulsante soglia (obiettivo)',
              description: 'Permette di mostrare o nascondere la linea di soglia.',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
        ],
        [
          {
            name: 'toolbar_show_axis_break',
            config: {
              type: 'CheckboxControl',
              label: 'Pulsante asse spezzato (✂️)',
              description: 'Permette di attivare o disattivare l\'asse spezzato mentre si guarda la dashboard.',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
          {
            name: 'toolbar_show_export',
            config: {
              type: 'CheckboxControl',
              label: 'Pulsanti di esportazione (PNG / CSV)',
              description: 'Scarica il grafico come immagine PNG o i dati aggregati come CSV.',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) => Boolean(controls?.enableToolbar?.value),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
