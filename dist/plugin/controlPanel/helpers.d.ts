import type { ControlPanelsContainerProps } from '@superset-ui/chart-controls';
/** Condizione di visibilità di un controllo: legge i valori degli altri controlli del pannello. */
export type Visibility = (props: ControlPanelsContainerProps) => boolean;
/** Il controllo `name` è acceso (o ha un valore). */
export declare const isOn: (name: string) => Visibility;
/** Il controllo `name` ha esattamente il valore `expected`. */
export declare const isValue: (name: string, expected: unknown) => Visibility;
/** Tutte le condizioni vere insieme. */
export declare const allOf: (...conditions: Visibility[]) => Visibility;
/** C'è un confronto tra due periodi (la modalità non è "nessuno"). */
export declare const isComparing: Visibility;
/** Ci sono metriche sul secondo asse. */
export declare const hasSecondary: Visibility;
/** Ci sono serie per colore (breakdown). */
export declare const hasGroupby: Visibility;
//# sourceMappingURL=helpers.d.ts.map