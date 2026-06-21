import { FC } from 'react';
import { Category, FieldDef, CategoryScope } from '../../config/types';
import { FieldRow } from './FieldRow';
import { t } from '../../i18n';

interface Props {
  category: Category;
  categories: Category[];
  onUpdateCategory: (id: string, fn: (c: Category) => void) => void;
  onDeleteCategory: (id: string) => void;
  onMoveCategory: (id: string, dir: -1 | 1) => void;
  onAddField: (catId: string) => void;
  onUpdateField: (id: string, fn: (f: FieldDef) => void) => void;
  onDeleteField: (id: string) => void;
  onAddChild: (id: string) => void;
  onMoveField: (id: string, dir: -1 | 1) => void;
  onMoveToCategory: (id: string, targetCatId: string) => void;
}

export const CategoryBlock: FC<Props> = (p) => {
  const c = p.category;
  const perCharacter = c.scope === 'perCharacter';

  return (
    <div className={'areko-cat' + (c.hidden ? ' is-hidden' : '')}>
      <div className="areko-cat__head">
        <i
          className={`fa-solid ${c.collapsed ? 'fa-chevron-right' : 'fa-chevron-down'} areko-cat__toggle`}
          onClick={() => p.onUpdateCategory(c.id, (x) => { x.collapsed = !x.collapsed; })}
        />
        <input
          className="text_pole areko-cat__name"
          value={c.name}
          onChange={(e) => p.onUpdateCategory(c.id, (x) => { x.name = e.target.value; })}
        />
        <select
          className="text_pole"
          style={{ flex: '0 0 auto', width: 'auto' }}
          title={t('builder.scope')}
          value={c.scope ?? 'global'}
          onChange={(e) => p.onUpdateCategory(c.id, (x) => { x.scope = e.target.value as CategoryScope; })}
        >
          <option value="global">{t('scope.global')}</option>
          <option value="perCharacter">{t('scope.perCharacter')}</option>
        </select>
        <i
          className={`fa-solid ${c.hidden ? 'fa-eye-slash' : 'fa-eye'} areko-cat__icon`}
          title={c.hidden ? t('builder.category.show') : t('builder.category.hide')}
          onClick={() => p.onUpdateCategory(c.id, (x) => { x.hidden = !x.hidden; })}
        />
        <i className="fa-solid fa-arrow-up areko-cat__icon" title={t('builder.moveUp')} onClick={() => p.onMoveCategory(c.id, -1)} />
        <i className="fa-solid fa-arrow-down areko-cat__icon" title={t('builder.moveDown')} onClick={() => p.onMoveCategory(c.id, 1)} />
        <i className="fa-solid fa-trash areko-cat__icon areko-cat__del" title={t('builder.delete')} onClick={() => p.onDeleteCategory(c.id)} />
      </div>

      {!c.collapsed && (
        <div className="areko-cat__body">
          {perCharacter && <div className="areko-hint">{t('scope.perCharacter.hint')}</div>}
          {c.fields.length === 0 && <div className="areko-hint">{t('builder.empty')}</div>}
          {c.fields.map((f) => (
            <FieldRow
              key={f.id}
              field={f}
              depth={0}
              perCharacter={perCharacter}
              categories={p.categories}
              currentCatId={c.id}
              onUpdate={p.onUpdateField}
              onDelete={p.onDeleteField}
              onAddChild={p.onAddChild}
              onMove={p.onMoveField}
              onMoveToCategory={p.onMoveToCategory}
            />
          ))}
          <div className="menu_button menu_button_icon areko-cat__addfield" onClick={() => p.onAddField(c.id)}>
            <i className="fa-solid fa-plus" />
            <span>{t('builder.addField')}</span>
          </div>
        </div>
      )}
    </div>
  );
};