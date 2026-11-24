import { ControlPanelSectionConfig, sharedControls } from '@superset-ui/chart-controls';
import { hasGroupby } from './helpers';

const dati: ControlPanelSectionConfig = {
  label: 'Dati',
  tabOverride: 'data',
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
          visibility: hasGroupby,
        },
      },
    ],
    [
      {
        name: 'metrics',
        config: {
          ...sharedControls.metrics,
          label: 'Metriche (altezza delle barre)',
          description:
            'Valori numerici che determinano l\'altezza delle barre. Supporta una o più metriche: con una sola metrica viene mostrata una serie di barre; con più metriche ciascuna genera una serie distinta (o coppie T1/T2 coordinate se il confronto temporale è attivo). Esempi: Richieste, Fatturato, Accessi.',
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
            'Come mettere in ordine le barre. "Ordine originale": come arrivano dalla query. "Categoria": in ordine alfabetico o cronologico, per esempio Lun-Dom. "Valore della metrica": dalla più alta alla più bassa (sulla prima metrica), utile per le classifiche (Top 10).',
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
};

export default dati;
