import { FC, useState } from 'react';
import { settingsManager } from '../../core/settings-manager';
import { FieldDef } from '../../config/types';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { buildJsonSchema } from '../../core/schema-builder';
import { newField, mutateField, removeField, addChild } from '../../core/field-ops';
import { FieldRow } from './FieldRow';
import { t } from '../../i18n';

export const SchemaBuilder: FC = () => {
  const forceUpdate = useForceUpdate();
  const settings = settingsManager.getSettings();
  const [showPreview, setShowPreview] = useState(false);

  const preset = settings.presets[settings.activePreset];

  const commit = (fn: (fields: FieldDef[]) => void) => {
    const s = settingsManager.getSettings();
    const p = s.presets[s.activePreset];
    if (!p) return;
    if (!Array.isArray(p.fields)) p.fields = [];
    fn(p.fields);
    settingsManager.saveSettings();
    forceUpdate();
  };

  const onUpdate = (id: string, fn: (f: FieldDef) => void) =>
    commit((fields) => {
      mutateField(fields, id, fn);
    });
  const onDelete = (id: string) =>
    commit((fields) => {
      removeField(fields, id);
    });
  const onAddChild = (id: string) =>
    commit((fields) => {
      addChild(fields, id);
    });
  const onAddTop = () =>
    commit((fields) => {
      fields.push(newField());
    });

  if (!preset) return <div className="areko-section-title">{t('builder.heading')}</div>;

  const fields = preset.fields ?? [];
  const schema = buildJsonSchema(fields, preset.name || 'Tracker');

  return (
    <div className="areko-builder">
      <div className="areko-section-title">{t('builder.heading')}</div>

      {fields.length === 0 && <div className="areko-hint">{t('builder.empty')}</div>}

      {fields.map((f) => (
        <FieldRow
          key={f.id}
          field={f}
          depth={0}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}

      <div className="menu_button menu_button_icon areko-builder__add" onClick={onAddTop}>
        <i className="fa-solid fa-plus" />
        <span>{t('builder.addField')}</span>
      </div>

      <div className="areko-builder__previewtoggle" onClick={() => setShowPreview((v) => !v)}>
        <i className={`fa-solid ${showPreview ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
        <span>{t('builder.preview')}</span>
      </div>
      {showPreview && <pre className="areko-test__result">{JSON.stringify(schema, null, 2)}</pre>}
    </div>
  );
};