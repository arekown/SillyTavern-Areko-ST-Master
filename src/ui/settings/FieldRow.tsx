import { FC, useState } from 'react';
import { FieldDef, FieldType, DisplayStyle, Category } from '../../config/types';
import { sanitizeKey } from '../../core/field-ops';
import { t } from '../../i18n';

interface Props {
  field: FieldDef;
  depth: number;
  categories?: Category[];
  currentCatId?: string;
  onUpdate: (id: string, fn: (f: FieldDef) => void) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onMoveToCategory?: (id: string, targetCatId: string) => void;
}

const TYPES: FieldType[] = ['string', 'number', 'boolean', 'list', 'group', 'objectList'];
const ITEM_TYPES: FieldType[] = ['string', 'number', 'boolean'];
const DISPLAYS: DisplayStyle[] = ['text', 'chip', 'badge', 'bar'];

export const FieldRow: FC<Props> = (props) => {
  const { field, depth, categories, currentCatId, onUpdate, onDelete, onAddChild, onMove, onMoveToCategory } = props;
  const [collapsed, setCollapsed] = useState(false);
  const [showAdv, setShowAdv] = useState(false);
  const hasChildren = field.type === 'group' || field.type === 'objectList';
  const isPrimitive = field.type === 'string' || field.type === 'number' || field.type === 'boolean';
  const disabled = field.enabled === false;

  return (
    <div className={'areko-fieldrow' + (disabled ? ' is-disabled' : '')} style={{ marginLeft: depth * 14 }}>
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
            <option key={ty} value={ty}>{t('builder.type.' + ty)}</option>
          ))}
        </select>

        {field.type === 'list' && (
          <select
            className="text_pole areko-fieldrow__itemtype"
            value={field.itemType ?? 'string'}
            onChange={(e) => onUpdate(field.id, (f) => { f.itemType = e.target.value as FieldType; })}
          >
            {ITEM_TYPES.map((ty) => (
              <option key={ty} value={ty}>{t('builder.type.' + ty)}</option>
            ))}
          </select>
        )}

        <label className="areko-fieldrow__req" title={t('builder.required')}>
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => onUpdate(field.id, (f) => { f.required = e.target.checked; })}
          />
        </label>

        <i className="fa-solid fa-arrow-up areko-fieldrow__icon" title={t('builder.moveUp')} onClick={() => onMove(field.id, -1)} />
        <i className="fa-solid fa-arrow-down areko-fieldrow__icon" title={t('builder.moveDown')} onClick={() => onMove(field.id, 1)} />
        <i
          className={'fa-solid fa-gear areko-fieldrow__icon' + (showAdv ? ' is-active' : '')}
          title={t('builder.advanced')}
          onClick={() => setShowAdv((s) => !s)}
        />
        <i className="fa-solid fa-trash areko-fieldrow__del" title={t('builder.delete')} onClick={() => onDelete(field.id)} />
      </div>

      <input
        className="text_pole areko-fieldrow__desc"
        value={field.description ?? ''}
        placeholder={t('builder.description')}
        onChange={(e) => onUpdate(field.id, (f) => { f.description = e.target.value; })}
      />

      {showAdv && (
        <div className="areko-fieldrow__adv">
          <label className="areko-adv-check">
            <input
              type="checkbox"
              checked={field.enabled !== false}
              onChange={(e) => onUpdate(field.id, (f) => { f.enabled = e.target.checked; })}
            />
            <span>{t('builder.enabled')}</span>
          </label>

          {field.type === 'string' && (
            <div className="areko-adv-item">
              <label>{t('builder.enum')}</label>
              <input
                className="text_pole"
                value={(field.enumValues ?? []).join(', ')}
                placeholder={t('builder.enumHint')}
                onChange={(e) =>
                  onUpdate(field.id, (f) => {
                    const vals = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
                    f.enumValues = vals.length ? vals : undefined;
                  })
                }
              />
            </div>
          )}

          {isPrimitive && (
            <>
              <div className="areko-adv-item">
                <label>{t('builder.example')}</label>
                <input
                  className="text_pole"
                  value={field.example ?? ''}
                  onChange={(e) => onUpdate(field.id, (f) => { f.example = e.target.value; })}
                />
              </div>
              <div className="areko-adv-item">
                <label>{t('builder.default')}</label>
                <input
                  className="text_pole"
                  value={field.defaultValue ?? ''}
                  onChange={(e) => onUpdate(field.id, (f) => { f.defaultValue = e.target.value; })}
                />
              </div>
            </>
          )}

          {(field.type === 'number' || field.type === 'string') && (
            <div className="areko-adv-row">
              <div className="areko-adv-item">
                <label>{t('builder.min')}</label>
                <input
                  type="number"
                  className="text_pole"
                  value={field.min ?? ''}
                  onChange={(e) => onUpdate(field.id, (f) => { f.min = e.target.value === '' ? undefined : Number(e.target.value); })}
                />
              </div>
              <div className="areko-adv-item">
                <label>{t('builder.max')}</label>
                <input
                  type="number"
                  className="text_pole"
                  value={field.max ?? ''}
                  onChange={(e) => onUpdate(field.id, (f) => { f.max = e.target.value === '' ? undefined : Number(e.target.value); })}
                />
              </div>
            </div>
          )}

          <div className="areko-adv-item">
            <label>{t('builder.display')}</label>
            <select
              className="text_pole"
              value={field.displayStyle ?? 'text'}
              onChange={(e) => onUpdate(field.id, (f) => { f.displayStyle = e.target.value as DisplayStyle; })}
            >
              {DISPLAYS.map((d) => (
                <option key={d} value={d}>{t('display.' + d)}</option>
              ))}
            </select>
          </div>

          {depth === 0 && categories && onMoveToCategory && categories.length > 1 && (
            <div className="areko-adv-item">
              <label>{t('builder.moveToCategory')}</label>
              <select
                className="text_pole"
                value={currentCatId ?? ''}
                onChange={(e) => onMoveToCategory(field.id, e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

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
              onMove={onMove}
            />
          ))}
          <div className="menu_button menu_button_icon areko-fieldrow__addchild" onClick={() => onAddChild(field.id)}>
            <i className="fa-solid fa-plus" />
            <span>{t('builder.addChild')}</span>
          </div>
        </div>
      )}
    </div>
  );
};