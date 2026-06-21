import { ExtensionSettingsManager } from 'sillytavern-utils-lib';
import { EXTENSION_KEY } from '../config/constants';
import { ExtensionSettings } from '../config/types';
import { defaultSettings } from '../config/defaults';

export const settingsManager = new ExtensionSettingsManager<ExtensionSettings>(
  EXTENSION_KEY,
  defaultSettings,
);
