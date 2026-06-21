import { FC } from 'react';
import { settingsManager } from '../../core/settings-manager';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { Category, FieldDef, ExtensionSettings } from '../../config/types';
import { t } from '../../i18n';

interface FlatField { id: string; label: string; }
function flatten(categories: Category[]): FlatField[] {
  const out: FlatField[] = [];
  const walk = (fields: FieldDef[], prefix: string) => {
    for (const f of fields) {
      const label = prefix ? prefix + ' › ' + f.label : f.label;
      out.push({ id: f.id, label });
      if (f.children) walk(f.children, label);
    }
  };
  for (const c of categories) walk(c.fields, c.name);
  return out;
}

export const CharacterExport: FC = () => {
  const forceUpdate = useForceUpdate();
  const settings = settingsManager.getSettings();
  const preset = settings.presets[settings.activePreset];
  const update = (fn: (s: ExtensionSettings) => void) => { const s = settingsManager.getSettings(); fn(s); settingsManager.saveSettings(); forceUpdate(); };
  if (!preset) return null;
  const flat = flatten(preset.categories);
  const lore = settings.lorebookExport.enabledFieldIds;
  const toggleLore = (id: string, on: boolean) => update((s) => {
    const set = new Set(s.lorebookExport.enabledFieldIds);
    if (on) set.add(id); else set.delete(id);
    s.lorebookExport.enabledFieldIds = Array.from(set);
  });

  return (
    <div className="areko-charexport">
      <div className="areko-section-title">{t('export2.heading')}</div>
      <div className="areko-field">
        <label>{t('export2.lorebookFields')}</label>
        <div className="areko-checklist">
          {flat.length === 0 && <div className="areko-hint">{t('builder.empty')}</div>}
          {flat.map((f) => (
            <label key={f.id} className="areko-adv-check">
              <input type="checkbox" checked={lore.includes(f.id)} onChange={(e) => toggleLore(f.id, e.target.checked)} />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="areko-field">
        <label>{t('export2.imageField')}</label>
        <select className="text_pole" value={settings.imageGen.sourceFieldId} onChange={(e) => update((s) => { s.imageGen.sourceFieldId = e.target.value; })}>
          <option value="">{t('export2.none')}</option>
          {flat.map((f) => (<option key={f.id} value={f.id}>{f.label}</option>))}
        </select>
        <span className="areko-hint">{t('export2.imageHint')}</span>
      </div>
    </div>
  );
};
