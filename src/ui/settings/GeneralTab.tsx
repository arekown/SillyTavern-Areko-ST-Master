import { FC } from 'react';
import { settingsManager } from '../../core/settings-manager';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { notifyUpdated } from '../../core/tracker-store';
import { ExtensionSettings } from '../../config/types';
import { ConnectionTab } from './ConnectionTab';
import { TestGenerate } from './TestGenerate';
import { t } from '../../i18n';

export const GeneralTab: FC = () => {
  const forceUpdate = useForceUpdate();
  const settings = settingsManager.getSettings();
  const preset = settings.presets[settings.activePreset];
  const update = (fn: (s: ExtensionSettings) => void) => { const s = settingsManager.getSettings(); fn(s); settingsManager.saveSettings(); forceUpdate(); notifyUpdated(); };

  return (
    <div className="areko-tab">
      <ConnectionTab />

      <div className="areko-field">
        <label>{t('general.lastMessages')}</label>
        <input type="number" className="text_pole" min={0} step={1} value={settings.includeLastXMessages}
          onChange={(e) => update((s) => { s.includeLastXMessages = parseInt(e.target.value) || 0; })} />
        <span className="areko-hint">{t('general.lastMessages.hint')}</span>
      </div>

      <div className="areko-field">
        <label>{t('general.lastTrackers')}</label>
        <div className="areko-slider-row">
          <input type="range" min={0} max={10} step={1} value={settings.includeLastXTrackers}
            onChange={(e) => update((s) => { s.includeLastXTrackers = parseInt(e.target.value) || 0; })} />
          <input type="number" className="text_pole areko-slider-num" min={0} step={1} value={settings.includeLastXTrackers}
            onChange={(e) => update((s) => { s.includeLastXTrackers = parseInt(e.target.value) || 0; })} />
        </div>
        <span className="areko-hint">{t('general.lastTrackers.hint')}</span>
      </div>

      <div className="areko-field">
        <label>{t('general.maxTokens')}</label>
        <input type="number" className="text_pole" min={1} step={1} value={settings.maxResponseToken}
          onChange={(e) => update((s) => { s.maxResponseToken = parseInt(e.target.value) || 0; })} />
      </div>

      {preset && (
        <div className="areko-field">
          <label>{t('chars.exclude')}</label>
          <input className="text_pole" placeholder={t('chars.excludeHint')}
            value={preset.characterRules.excludedCharacters.join(', ')}
            onChange={(e) => update((s) => { s.presets[s.activePreset].characterRules.excludedCharacters = e.target.value.split(',').map((v) => v.trim()).filter(Boolean); })} />
          <span className="areko-hint">{t('chars.excludeNote')}</span>
        </div>
      )}

      <hr className="areko-divider" />
      <TestGenerate />
    </div>
  );
};
