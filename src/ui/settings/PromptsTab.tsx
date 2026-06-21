import { FC } from 'react';
import { settingsManager } from '../../core/settings-manager';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { ExtensionSettings } from '../../config/types';
import { DEFAULT_TRACKER_PROMPT, DEFAULT_JSON_PROMPT, DEFAULT_IMAGE_PROMPT, DEFAULT_LOREBOOK_PROMPT } from '../../core/prompts';
import { t } from '../../i18n';

export const PromptsTab: FC = () => {
  const forceUpdate = useForceUpdate();
  const settings = settingsManager.getSettings();
  const update = (fn: (s: ExtensionSettings) => void) => { const s = settingsManager.getSettings(); fn(s); settingsManager.saveSettings(); forceUpdate(); };

  const block = (labelKey: string, hintKey: string, value: string, set: (v: string) => void, reset: () => void) => (
    <div className="areko-field">
      <div className="areko-prompt-head">
        <label>{t(labelKey)}</label>
        <span className="areko-prompt-reset" onClick={reset}><i className="fa-solid fa-rotate-left"></i> {t('prompts.reset')}</span>
      </div>
      <span className="areko-hint">{t(hintKey)}</span>
      <textarea className="text_pole areko-prompt-area" rows={10} value={value} onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <div className="areko-tab">
      {block('prompts.tracker', 'prompts.tracker.hint', settings.prompt, (v) => update((s) => { s.prompt = v; }), () => update((s) => { s.prompt = DEFAULT_TRACKER_PROMPT; }))}
      {block('prompts.json', 'prompts.json.hint', settings.promptJson, (v) => update((s) => { s.promptJson = v; }), () => update((s) => { s.promptJson = DEFAULT_JSON_PROMPT; }))}
      {block('prompts.image', 'prompts.image.hint', settings.imagePrompt, (v) => update((s) => { s.imagePrompt = v; }), () => update((s) => { s.imagePrompt = DEFAULT_IMAGE_PROMPT; }))}
      {block('prompts.lore', 'prompts.lore.hint', settings.lorebookPrompt, (v) => update((s) => { s.lorebookPrompt = v; }), () => update((s) => { s.lorebookPrompt = DEFAULT_LOREBOOK_PROMPT; }))}
    </div>
  );
};
