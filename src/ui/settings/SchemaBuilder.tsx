import { FC, useState } from 'react';
import { settingsManager } from '../../core/settings-manager';
import { Category, FieldDef } from '../../config/types';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { buildJsonSchema } from '../../core/schema-builder';
import { schemaToExample } from '../../core/schema-to-example';
import {
  newField, newCategory, mutateField, removeField, addChild,
  moveFieldById, moveFieldToCategory, moveCategory, validatePreset,
} from '../../core/field-ops';
import { CategoryBlock } from './CategoryBlock';
import { PresetBar } from './PresetBar';
import { CharacterExport } from './CharacterExport';
import { t } from '../../i18n';

export const SchemaBuilder: FC = () => {
  const forceUpdate = useForceUpdate();
  const settings = settingsManager.getSettings();
  const [showSchema, setShowSchema] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const preset = settings.presets[settings.activePreset];

  const commit = (fn: (cats: Category[]) => void) => {
    const s = settingsManager.getSettings();
    const p = s.presets[s.activePreset];
    if (!p) return;
    if (!Array.isArray(p.categories)) p.categories = [];
    fn(p.categories);
    settingsManager.saveSettings();
    forceUpdate();
  };

  if (!preset) return <div className="areko-section-title">{t('builder.heading')}</div>;

  const categories = preset.categories ?? [];
  const schema = buildJsonSchema(categories, preset.name || 'Tracker');
  const issues = validatePreset(categories);

  const onUpdateField = (id: string, fn: (f: FieldDef) => void) =>
    commit((cats) => { for (const c of cats) if (mutateField(c.fields, id, fn)) return; });
  const onDeleteField = (id: string) =>
    commit((cats) => { for (const c of cats) if (removeField(c.fields, id)) return; });
  const onAddChild = (id: string) =>
    commit((cats) => { for (const c of cats) if (addChild(c.fields, id)) return; });
  const onMoveField = (id: string, dir: -1 | 1) => commit((cats) => { moveFieldById(cats, id, dir); });
  const onMoveToCategory = (id: string, target: string) => commit((cats) => { moveFieldToCategory(cats, id, target); });
  const onAddField = (catId: string) =>
    commit((cats) => { const c = cats.find((x) => x.id === catId); if (c) c.fields.push(newField()); });

  const onAddCategory = () => commit((cats) => { cats.push(newCategory()); });
  const onUpdateCategory = (id: string, fn: (c: Category) => void) =>
    commit((cats) => { const c = cats.find((x) => x.id === id); if (c) fn(c); });
  const onDeleteCategory = (id: string) =>
    commit((cats) => { const i = cats.findIndex((x) => x.id === id); if (i >= 0) cats.splice(i, 1); });
  const onMoveCategory = (id: string, dir: -1 | 1) => commit((cats) => { moveCategory(cats, id, dir); });

  return (
    <div className="areko-builder">
      <div className="areko-section-title">{t('builder.heading')}</div>
      <PresetBar />

      {categories.length === 0 && <div className="areko-hint">{t('builder.empty')}</div>}

      {categories.map((c) => (
        <CategoryBlock
          key={c.id}
          category={c}
          categories={categories}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
          onMoveCategory={onMoveCategory}
          onAddField={onAddField}
          onUpdateField={onUpdateField}
          onDeleteField={onDeleteField}
          onAddChild={onAddChild}
          onMoveField={onMoveField}
          onMoveToCategory={onMoveToCategory}
        />
      ))}

      <div className="menu_button menu_button_icon areko-builder__add" onClick={onAddCategory}>
        <i className="fa-solid fa-folder-plus" />
        <span>{t('builder.addCategory')}</span>
      </div>

      <CharacterExport />

      {issues.length > 0 && (
        <div className="areko-issues">
          <div className="areko-section-title">{t('builder.validation')}</div>
          {issues.map((iss, i) => (
            <div key={i} className="areko-issues__item">⚠ {iss.message}</div>
          ))}
        </div>
      )}

      <div className="areko-builder__previewtoggle" onClick={() => setShowSchema((v) => !v)}>
        <i className={`fa-solid ${showSchema ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
        <span>{t('builder.preview')}</span>
      </div>
      {showSchema && <pre className="areko-test__result">{JSON.stringify(schema, null, 2)}</pre>}

      <div className="areko-builder__previewtoggle" onClick={() => setShowExample((v) => !v)}>
        <i className={`fa-solid ${showExample ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
        <span>{t('builder.examplePreview')}</span>
      </div>
      {showExample && <pre className="areko-test__result">{schemaToExample(schema, 'json')}</pre>}
    </div>
  );
};