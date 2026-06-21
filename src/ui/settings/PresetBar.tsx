import { FC, useRef, ChangeEvent } from 'react';
import { settingsManager } from '../../core/settings-manager';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { notifyUpdated } from '../../core/tracker-store';
import {
  createPreset, duplicatePreset, deletePreset, renamePreset, resetPreset, exportPreset, importPreset,
} from '../../core/preset-ops';
import { t } from '../../i18n';

export const PresetBar: FC = () => {
  const forceUpdate = useForceUpdate();
  const settings = settingsManager.getSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    settingsManager.saveSettings();
    forceUpdate();
    notifyUpdated();
  };
  const mutate = (fn: () => void) => { fn(); save(); };
  const active = settings.activePreset;

  const onSelect = (e: ChangeEvent<HTMLSelectElement>) => mutate(() => { settings.activePreset = e.target.value; });
  const onNew = () => { const name = window.prompt(t('preset.renamePrompt'), 'Neu'); if (name === null) return; mutate(() => { createPreset(settings, name); }); };
  const onDup = () => mutate(() => { duplicatePreset(settings, active); });
  const onRename = () => { const cur = settings.presets[active]?.name ?? ''; const name = window.prompt(t('preset.renamePrompt'), cur); if (name === null) return; mutate(() => { renamePreset(settings, active, name); }); };
  const onDelete = () => { if (!window.confirm(t('preset.delete') + '?')) return; mutate(() => { deletePreset(settings, active); }); };
  const onReset = () => { if (!window.confirm(t('preset.reset') + '?')) return; mutate(() => { resetPreset(settings, active); }); };

  const onExport = () => {
    const p = settings.presets[active];
    if (!p) return;
    const blob = new Blob([exportPreset(p)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (p.name || 'preset') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportClick = () => fileRef.current?.click();
  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      mutate(() => { importPreset(settings, text); });
    } catch (err: any) {
      window.alert('Import-Fehler: ' + (err?.message ?? String(err)));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="areko-presetbar">
      <label>{t('preset.label')}</label>
      <select className="text_pole areko-presetbar__select" value={active} onChange={onSelect}>
        {Object.entries(settings.presets).map(([key, p]) => (
          <option key={key} value={key}>{p.name}</option>
        ))}
      </select>
      <div className="areko-presetbar__btns">
        <i className="fa-solid fa-plus areko-presetbar__icon" title={t('preset.new')} onClick={onNew} />
        <i className="fa-solid fa-copy areko-presetbar__icon" title={t('preset.duplicate')} onClick={onDup} />
        <i className="fa-solid fa-pen areko-presetbar__icon" title={t('preset.rename')} onClick={onRename} />
        <i className="fa-solid fa-rotate-left areko-presetbar__icon" title={t('preset.reset')} onClick={onReset} />
        <i className="fa-solid fa-file-export areko-presetbar__icon" title={t('preset.export')} onClick={onExport} />
        <i className="fa-solid fa-file-import areko-presetbar__icon" title={t('preset.import')} onClick={onImportClick} />
        <i className="fa-solid fa-trash areko-presetbar__icon areko-presetbar__del" title={t('preset.delete')} onClick={onDelete} />
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onImportFile} />
    </div>
  );
};
