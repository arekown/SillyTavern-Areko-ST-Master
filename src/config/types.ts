export enum AutoMode { OFF = 'off', INPUTS = 'inputs', RESPONSES = 'responses', BOTH = 'both' }
export type Language = 'de' | 'en';
export type FieldType = 'string' | 'number' | 'boolean' | 'list' | 'group' | 'objectList';
export type DisplayStyle = 'text' | 'chip' | 'badge' | 'bar';
export type CategoryScope = 'global' | 'perCharacter';
export type AppliesTo = 'all' | 'npc' | 'player';

export interface FieldDef {
  id: string; key: string; label: string; type: FieldType;
  description?: string; required?: boolean; enabled?: boolean; appliesTo?: AppliesTo;
  itemType?: FieldType; enumValues?: string[]; example?: string; defaultValue?: string;
  min?: number; max?: number; displayStyle?: DisplayStyle; children?: FieldDef[];
}
export interface Category { id: string; name: string; scope?: CategoryScope; collapsed?: boolean; hidden?: boolean; fields: FieldDef[]; }
export interface CharacterRules { loopOverCharacters: boolean; excludedCharacters: string[]; }
export interface Preset { name: string; categories: Category[]; characterRules: CharacterRules; }
export interface ImageGenSettings { enabled: boolean; sourceFieldId: string; }
export interface LorebookExportSettings { sourceFieldId: string; }

export interface ExtensionSettings {
  version: string;
  profileId: string;
  autoMode: AutoMode;
  language: Language;
  maxResponseToken: number;
  includeLastXMessages: number;
  includeLastXTrackers: number;
  activePreset: string;
  presets: Record<string, Preset>;
  imageGen: ImageGenSettings;
  lorebookExport: LorebookExportSettings;
  characterImages: Record<string, string>;
  prompt: string;
  promptJson: string;
  imagePrompt: string;
  lorebookPrompt: string;
  panelOpen: boolean;
}
