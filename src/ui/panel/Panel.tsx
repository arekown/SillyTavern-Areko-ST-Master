import { FC, useEffect, useState, useCallback } from 'react';
import { settingsManager } from '../../core/settings-manager';
import { getLatestTracker, getPlayerName } from '../../core/tracker-store';
import { renderGeneral, renderCharacters } from '../../core/render-html';
import { t } from '../../i18n';

type TabKey = 'general' | 'player' | 'npc';

export const Panel: FC = () => {
  const [tab, setTab] = useState<TabKey>('general');
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((x) => x + 1), []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('areko:updated', handler);
    return () => window.removeEventListener('areko:updated', handler);
  }, [refresh]);

  const settings = settingsManager.getSettings();
  const open = settings.panelOpen ?? false;

  const toggle = () => {
    const s = settingsManager.getSettings();
    s.panelOpen = !s.panelOpen;
    settingsManager.saveSettings();
    refresh();
  };

  const cats = settings.presets[settings.activePreset]?.categories ?? [];
  const data = getLatestTracker();
  const player = getPlayerName();

  let html = '';
  if (!data) html = `<div class="areko-empty">${t('panel.noData')}</div>`;
  else if (tab === 'general') html = renderGeneral(cats, data);
  else if (tab === 'player') html = renderCharacters(cats, data, 'player', player);
  else html = renderCharacters(cats, data, 'npc', player);

  const TabBtn: FC<{ k: TabKey; label: string }> = ({ k, label }) => (
    <div className={'areko-panel__tab' + (tab === k ? ' is-active' : '')} onClick={() => setTab(k)}>
      {label}
    </div>
  );

  return (
    <div className={'areko-panel' + (open ? ' is-open' : '')}>
      <div className="areko-panel__handle" onClick={toggle} title={t('panel.toggle')}>
        <i className={'fa-solid ' + (open ? 'fa-chevron-right' : 'fa-chevron-left')}></i>
        <span className="areko-panel__handle-label">{t('panel.title')}</span>
      </div>
      <div className="areko-panel__inner">
        <div className="areko-panel__header">
          <span>{t('panel.title')}</span>
          <i className="fa-solid fa-xmark areko-panel__close" onClick={toggle}></i>
        </div>
        <div className="areko-panel__tabs">
          <TabBtn k="general" label={t('panel.tab.general')} />
          <TabBtn k="player" label={t('panel.tab.player')} />
          <TabBtn k="npc" label={t('panel.tab.npc')} />
        </div>
        <div className="areko-panel__content" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};
