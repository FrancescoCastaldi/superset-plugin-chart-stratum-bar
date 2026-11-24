import type { ControlPanelConfig } from '@superset-ui/chart-controls';
import dati from './dati';
import confronto from './confronto';
import aspetto from './aspetto';
import layout from './layout';
import secondoAsse from './secondoAsse';
import soglia from './soglia';
import asseSpezzato from './asseSpezzato';
import assiLegenda from './assiLegenda';
import toolbar from './toolbar';

/*
 * Pannello di controllo del grafico, in italiano. Una sezione per file, nell'ordine in cui compaiono.
 * Ogni sezione e ogni controllo ha un tooltip (`description`) con l'indicazione di cosa fa e un esempio.
 * I nomi dei controlli sono quelli salvati nei chart: non cambiarli, altrimenti i grafici esistenti perdono le impostazioni.
 */
const config: ControlPanelConfig = {
  controlPanelSections: [dati, confronto, aspetto, layout, secondoAsse, soglia, asseSpezzato, assiLegenda, toolbar],
};

export default config;
