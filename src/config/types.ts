// --- Connection / Generierung ---

export enum AutoMode {
  OFF = 'off',
  INPUTS = 'inputs',       // nur bei Spieler-Eingaben
  RESPONSES = 'responses', // nur bei ST-Antworten
  BOTH = 'both',
}

// Nur relevant, wenn AutoMode !== OFF
export enum Timing {
  BEFORE = 'before', // vor der Antwort (ueber generate_interceptor)
  AFTER = 'after',   // nach der Antwort (ueber Render-Events)
}

export type Language = 'de' | 'en';

// --- CMS / Schema-Builder ---

export type FieldType = 'string' | 'number' | 'boolean' | 'list' | 'group' | 'objectList';

export interface FieldDef {
  id: string;             // stabile interne ID (fuer Reorder/Layout)
  key: string;            // JSON-Key (Englisch, geht ins Schema)
  label: string;          // Anzeigename
  type: FieldType;
  description?: string;    // zugleich die LLM-Anweisung
  required?: boolean;
  itemType?: FieldType;    // fuer 'list': Typ der Elemente
  children?: FieldDef[];   // fuer 'group' / 'objectList'
}

export interface CharacterRules {
  loopOverCharacters: boolean;   // Feld(er) pro Charakter durchlaufen
  excludedCharacters: string[];  // ausgeschlossene Namen (z.B. Spieler)
}

export interface LayoutItem {
  fieldId: string;
  order: number;
  collapsed?: boolean;
}

export interface Preset {
  name: string;
  fields: FieldDef[];          // Quelle der Wahrheit
  layout: LayoutItem[];        // Anordnung der Optik
  characterRules: CharacterRules;
}

// --- Features ---

export interface ImageGenSettings {
  enabled: boolean;
}

export interface LorebookExportSettings {
  enabledFieldIds: string[];   // welche Variablen in den Eintrag wandern
}

// --- Root ---

export interface ExtensionSettings {
  version: string;
  profileId: string;           // #1 Connection-Profil
  autoMode: AutoMode;          // #2
  timing: Timing;              // #3
  language: Language;          // #4
  maxResponseToken: number;
  activePreset: string;
  presets: Record<string, Preset>;
  imageGen: ImageGenSettings;          // #8
  lorebookExport: LorebookExportSettings; // #10
  prompt: string;
}
