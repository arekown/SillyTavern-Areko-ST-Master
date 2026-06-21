import { ExtensionSettings, AutoMode, Timing, Preset } from './types';
import { VERSION } from './constants';

export function makeDefaultPreset(name = 'Default'): Preset {
  return {
    name,
    categories: [
      {
        id: 'c_scene',
        name: 'Szene',
        scope: 'global',
        collapsed: false,
        hidden: false,
        fields: [
          {
            id: 'f_time',
            key: 'time',
            label: 'Zeit',
            type: 'string',
            description: 'Aktuelle Uhrzeit und Datum der Szene',
            required: true,
            enabled: true,
            appliesTo: 'all',
          },
          {
            id: 'f_location',
            key: 'location',
            label: 'Ort',
            type: 'string',
            description: 'Aktueller Ort der Szene',
            required: true,
            enabled: true,
            appliesTo: 'all',
          },
        ],
      },
    ],
    characterRules: { loopOverCharacters: false, excludedCharacters: [] },
  };
}

export const defaultSettings: ExtensionSettings = {
  version: VERSION,
  profileId: '',
  autoMode: AutoMode.OFF,
  timing: Timing.AFTER,
  language: 'de',
  maxResponseToken: 16000,
  activePreset: 'default',
  presets: { default: makeDefaultPreset() },
  imageGen: { enabled: false, sourceFieldId: '' },
  lorebookExport: { enabledFieldIds: [] },
  prompt: '',
};