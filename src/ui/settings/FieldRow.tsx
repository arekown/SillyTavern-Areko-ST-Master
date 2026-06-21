import { FC, useState } from 'react';
import { FieldDef, FieldType } from '../../config/types';
import { sanitizeKey } from '../../core/field-ops';
import { t } from '../../i18n';

interface Props {
  field: FieldDef;
  depth: number;
  onUpdate: (id: string, fn: (f: FieldDef) => void) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string) => void;
}

const TYPES: FieldType[] = ['string', 'number', 'boolean', 'list', 'group', 'objectList'];

export const FieldRow: FC<Props> = ({ field, depth, onUpdate, onDelete, onAddChild }) => {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = field.type === 'group' || field.type === 'objectList';

  return (
    <div className="areko-fieldrow" style={{ marginLeft: depth * 16 }}>
      <div className="areko-fieldrow__head">
        {hasChildren ? (
          <i
            className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-down'} areko-fieldrow__toggle`}
            onClick={() => setCollapsed((c) => !c)}
          />
        ) : (
          <span className="areko-fieldrow__bullet">•</span>
        )}

        <input
          className="text_pole areko-fieldrow__label"
          value={field.label}
          placeholder={t('builder.label')}
          onChange={(e) => onUpdate(field.id, (f) => { f.label = e.target.value; })}
        />

        <input
          className="text_pole areko-fieldrow__key"
          value={field.key}
          placeholder={t('builder.key')}
          onChange={(e) => onUpdate(field.id, (f) => { f.key = sanitizeKey(e.target.value); })}
        />

        <select
          className="text_pole areko-fieldrow__type"
          value={field.type}
          onChange={(e) =>
            onUpdate(field.id, (f) => {
              f.type = e.target.value as FieldType;
              if ((f.type === 'group' || f.type === 'objectList') && !f.children) f.children = [];
              if (f.type === 'list' && !f.itemType) f.itemType = 'string';
            })
          }
        >
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t('builder.type.' + ty)}
            </option>
          ))}
        </select>

        {field.type === 'list' && (
          <select
            className="text_pole areko-fieldrow__itemtype"
            value={field.itemType ?? 'string'}
            onChange={(e) => onUpdate(field.id, (f) => { f.itemType = e.target.value as FieldType; })}
          >
            <option value="string">{t('builder.type.string')}</option>
            <option value="number">{t('builder.type.number')}</option>
            <option value="boolean">{t('builder.type.boolean')}</option>
          </select>
        )}

        <label className="areko-fieldrow__req" title={t('builder.required')}>
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => onUpdate(field.id, (f) => { f.required = e.target.checked; })}
          />
        </label>

        <i
          className="fa-solid fa-trash areko-fieldrow__del"
          title={t('builder.delete')}
          onClick={() => onDelete(field.id)}
        />
      </div>

      <input
        className="text_pole areko-fieldrow__desc"
        value={field.description ?? ''}
        placeholder={t('builder.description')}
        onChange={(e) => onUpdate(field.id, (f) => { f.description = e.target.value; })}
      />

      {hasChildren && !collapsed && (
        <div className="areko-fieldrow__children">
          {(field.children ?? []).map((c) => (
            <FieldRow
              key={c.id}
              field={c}
              depth={depth + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
          <div
            className="menu_button menu_button_icon areko-fieldrow__addchild"
            onClick={() => onAddChild(field.id)}
          >
            <i className="fa-solid fa-plus" />
            <span>{t('builder.addChild')}</span>
          </div>
        </div>
      )}
    </div>
  );
};