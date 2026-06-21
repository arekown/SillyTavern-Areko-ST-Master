import { ExtensionSettings, AutoMode, Timing, Preset } from './types';
import { VERSION } from './constants';

const defaultPreset: Preset = {
  name: 'Default',
  fields: [
    { id: 'f_time', key: 'time', label: 'Zeit', type: 'string', description: 'Aktuelle Uhrzeit und Datum der Szene', required: true },
    { id: 'f_location', key: 'location', label: 'Ort', type: 'string', description: 'Aktueller Ort der Szene', required: true },
  ],
  layout: [
    { fieldId: 'f_time', order: 0 },
    { fieldId: 'f_location', order: 1 },
  ],
  characterRules: { loopOverCharacters: false, excludedCharacters: [] },
};

export const defaultSettings: ExtensionSettings = {
  version: VERSION,
  profileId: '',
  autoMode: AutoMode.OFF,
  timing: Timing.AFTER,
  language: 'de',
  maxResponseToken: 16000,
  activePreset: 'default',
  presets: { default: defaultPreset },
  imageGen: { enabled: false },
  lorebookExport: { enabledFieldIds: [] },
  prompt: '',
};
