import { FC, useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { settingsManager } from '../../core/settings-manager';
import { getLatestTracker, getPlayerName } from '../../core/tracker-store';
import { renderGeneral, renderCharacters, loreExists } from '../../core/render-html';
import { categoryKey } from '../../core/schema-builder';
import { getCharImage, generateCharImage, setCharImage, deleteCharImage } from '../../features/image-gen';
import { generateLorebookEntry, lorebookExistsBatch } from '../../features/lorebook';
import { t } from '../../i18n';

type TabKey = 'general' | 'player' | 'npc';

function charNames(cats: any[], data: any): string[] {
  const names: string[] = [];
  for (const cat of cats) {
    if (cat.scope !== 'perCharacter') continue;
    const arr = data?.[categoryKey(cat)];
    if (Array.isArray(arr)) for (const e of arr) { const n = e?.character ?? e?.name; if (n) names.push(String(n)); }
  }
  return Array.from(new Set(names));
}

export const Panel: FC = () => {
  const [tab, setTab] = useState<TabKey>('general');
  const [, setTick] = useState(0);
  const [busyImg, setBusyImg] = useState<string | null>(null);
  const [busyLore, setBusyLore] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const pendingName = useRef('');
  const fileRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const openState = useRef<Map<string, boolean>>(new Map());
  const refresh = useCallback(() => setTick((x) => x + 1), []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('areko:updated', handler);
    const ctx: any = SillyTavern.getContext();
    const es = ctx?.eventSource;
    const et = ctx?.eventTypes || ctx?.event_types || {};
    const evs = [et.CHAT_CHANGED, et.MESSAGE_RENDERED, et.CHARACTER_MESSAGE_RENDERED, et.MESSAGE_SWIPED, et.MESSAGE_DELETED].filter(Boolean);
    if (es?.on) for (const ev of evs) es.on(ev, handler);
    return () => { window.removeEventListener('areko:updated', handler); if (es) for (const ev of evs) (es.removeListener || es.off)?.call(es, ev, handler); };
  }, [refresh]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onToggle = (e: Event) => {
      const d = e.target as HTMLElement;
      if (d instanceof HTMLDetailsElement && d.hasAttribute('data-areko-key')) openState.current.set(d.getAttribute('data-areko-key')!, d.open);
    };
    el.addEventListener('toggle', onToggle, true);
    return () => el.removeEventListener('toggle', onToggle, true);
  }, []);

  const settings = settingsManager.getSettings();
  const open = settings.panelOpen ?? false;
  const toggle = () => { const s = settingsManager.getSettings(); s.panelOpen = !s.panelOpen; settingsManager.saveSettings(); refresh(); };

  const cats = settings.presets[settings.activePreset]?.categories ?? [];
  const data = getLatestTracker();
  const player = getPlayerName();
  const names = charNames(cats, data);

  // Existenz der Lorebook-Eintraege nur pruefen, wenn sich die Namensliste aendert (kein Spam).
  const namesKey = names.join('|');
  useEffect(() => {
    if (names.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await lorebookExistsBatch(names);
        let changed = false;
        for (const n of names) if (loreExists[n] !== res[n]) { loreExists[n] = res[n]; changed = true; }
        if (!cancelled && changed) refresh();
      } catch { /* still */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey]);

  let html = '';
  if (!data) html = `<div class="areko-empty">${t('panel.noData')}</div>`;
  else if (tab === 'general') html = renderGeneral(cats, data);
  else if (tab === 'player') html = renderCharacters(cats, data, 'player', player, { imageOf: getCharImage });
  else html = renderCharacters(cats, data, 'npc', player, { imageOf: getCharImage });

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.querySelectorAll('details[data-areko-key]').forEach((d) => {
      const key = (d as HTMLElement).getAttribute('data-areko-key')!;
      if (openState.current.has(key)) (d as HTMLDetailsElement).open = openState.current.get(key)!;
    });
  });

  const onContentClick = async (e: React.MouseEvent) => {
    const tgt = e.target as HTMLElement;
    const img = tgt.closest('img.areko-charimg') as HTMLImageElement | null;
    if (img && img.src) { setLightbox(img.src); return; }
    const btn = tgt.closest('[data-areko-action]') as HTMLElement | null;
    if (!btn) return;
    const action = btn.getAttribute('data-areko-action');
    const name = btn.getAttribute('data-areko-name') || '';
    if (action === 'lorehelp') { window.alert(t('lore.helpLong')); return; }
    if (action === 'lorebook') {
      if (busyLore) return;
      setBusyLore(name);
      try { await generateLorebookEntry(name); loreExists[name] = true; window.alert(t('lore.done')); }
      catch (err: any) { window.alert('Lorebook-Fehler: ' + (err?.message ?? String(err))); }
      finally { setBusyLore(null); refresh(); }
      return;
    }
    if (action === 'genimg') {
      if (busyImg) return;
      setBusyImg(name);
      try { await generateCharImage(name); } catch (err: any) { window.alert('Bild-Fehler: ' + (err?.message ?? String(err))); } finally { setBusyImg(null); refresh(); }
    } else if (action === 'upload') { pendingName.current = name; fileRef.current?.click(); }
    else if (action === 'delimg') { deleteCharImage(name); refresh(); }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; const name = pendingName.current;
    if (file && name) { const r = new FileReader(); r.onload = () => { setCharImage(name, String(r.result)); refresh(); }; r.readAsDataURL(file); }
    e.target.value = '';
  };

  const TabBtn: FC<{ k: TabKey; label: string }> = ({ k, label }) => (
    <div className={'areko-panel__tab' + (tab === k ? ' is-active' : '')} onClick={() => setTab(k)}>{label}</div>
  );

  return (
    <div className={'areko-panel' + (open ? ' is-open' : '')}>
      <div className="areko-panel__handle" onClick={toggle} title={t('panel.toggle')}>
        <i className={'fa-solid ' + (open ? 'fa-chevron-right' : 'fa-chevron-left')}></i>
        <span className="areko-panel__handle-label">{t('panel.title')}</span>
      </div>
      <div className="areko-panel__inner">
        <div className="areko-panel__header"><span>{t('panel.title')}</span><i className="fa-solid fa-xmark areko-panel__close" onClick={toggle}></i></div>
        <div className="areko-panel__tabs">
          <TabBtn k="general" label={t('panel.tab.general')} />
          <TabBtn k="player" label={t('panel.tab.player')} />
          <TabBtn k="npc" label={t('panel.tab.npc')} />
        </div>
        <div className="areko-panel__content" onClick={onContentClick} ref={contentRef}>
          {busyImg && <div className="areko-imgbusy">{t('panel.img.busy')} ({busyImg})</div>}
          {busyLore && <div className="areko-imgbusy">{t('lore.busy')} ({busyLore})</div>}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
      </div>
      {lightbox && createPortal(<div className="areko-lightbox" onClick={() => setLightbox(null)}><img src={lightbox} alt="" /></div>, document.body)}
    </div>
  );
};
