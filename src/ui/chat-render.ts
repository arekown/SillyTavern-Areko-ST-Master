import { settingsManager } from '../core/settings-manager';
import { renderFullTracker } from '../core/render-html';
import { getTrackerFor, clearTrackerFor, notifyUpdated } from '../core/tracker-store';
import { generateForMessage } from '../core/generation';
import { t } from '../i18n';

const busy = new Set<number>();

function activeCategories() {
  const s = settingsManager.getSettings();
  return s.presets[s.activePreset]?.categories ?? [];
}

function buildBlockHtml(messageId: number): string {
  const data = getTrackerFor(messageId);
  const hasData = !!data;
  const inner = hasData ? renderFullTracker(activeCategories(), data) : '';
  const busyNow = busy.has(messageId);

  const genLabel = busyNow ? t('chat.generating') : hasData ? t('chat.regenerate') : t('chat.generate');
  const genIcon = busyNow ? 'fa-spinner fa-spin' : hasData ? 'fa-rotate' : 'fa-wand-magic-sparkles';

  const controls =
    `<div class="areko-trk__controls">` +
    `<span class="areko-trk__btn areko-trk__gen"><i class="fa-solid ${genIcon}"></i> ${genLabel}</span>` +
    (hasData ? `<span class="areko-trk__btn areko-trk__del" title="${t('chat.delete')}"><i class="fa-solid fa-trash"></i></span>` : '') +
    `</div>`;

  const body = hasData
    ? `<details class="areko-trk__details"><summary>${t('chat.tracker')}</summary><div class="areko-trk__body">${inner}</div></details>`
    : '';

  return controls + body;
}

function attachTo(mes: HTMLElement): void {
  const idAttr = mes.getAttribute('mesid');
  if (idAttr === null) return;
  const messageId = Number(idAttr);
  const text = mes.querySelector('.mes_text');
  if (!text) return;

  const s = settingsManager.getSettings();
  const data = getTrackerFor(messageId);
  const sig = `${s.activePreset}:${s.language}:${data ? 1 : 0}:${busy.has(messageId) ? 1 : 0}:${data ? JSON.stringify(data).length : 0}`;

  let block = mes.querySelector('.areko-trk') as HTMLElement | null;
  if (block && block.dataset.sig === sig) return;

  if (!block) {
    block = document.createElement('div');
    block.className = 'areko-trk';
    text.insertAdjacentElement('afterend', block);
  }

  const wasOpen = block.querySelector('details.areko-trk__details')?.hasAttribute('open') ?? false;
  block.dataset.sig = sig;
  block.innerHTML = buildBlockHtml(messageId);
  const det = block.querySelector('details.areko-trk__details') as HTMLDetailsElement | null;
  if (det && wasOpen) det.open = true;

  block.querySelector('.areko-trk__gen')?.addEventListener('click', async () => {
    if (busy.has(messageId)) return;
    busy.add(messageId);
    rebuild(mes);
    try {
      await generateForMessage(messageId);
    } catch (e: any) {
      window.alert('Tracker-Fehler: ' + (e?.message ?? String(e)));
    } finally {
      busy.delete(messageId);
      rebuild(mes);
      notifyUpdated();
    }
  });

  block.querySelector('.areko-trk__del')?.addEventListener('click', () => {
    clearTrackerFor(messageId);
    rebuild(mes);
    notifyUpdated();
  });
}

function rebuild(mes: HTMLElement): void {
  mes.querySelector('.areko-trk')?.remove();
  attachTo(mes);
}

let scheduled = false;
function scheduleRefresh(): void {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    document.querySelectorAll('#chat .mes').forEach((el) => attachTo(el as HTMLElement));
  }, 120);
}

export function initChatRender(): void {
  const ctx: any = SillyTavern.getContext();
  const es = ctx?.eventSource;
  const et = ctx?.eventTypes || ctx?.event_types || {};
  const evs = [
    et.CHAT_CHANGED, et.MESSAGE_RENDERED, et.CHARACTER_MESSAGE_RENDERED,
    et.USER_MESSAGE_RENDERED, et.MESSAGE_SWIPED, et.MESSAGE_EDITED,
    et.MESSAGE_DELETED, et.MORE_MESSAGES_LOADED, et.MESSAGE_UPDATED,
  ].filter(Boolean);
  if (es?.on) for (const ev of evs) es.on(ev, scheduleRefresh);

  window.addEventListener('areko:updated', scheduleRefresh);
  scheduleRefresh();
  setTimeout(scheduleRefresh, 800);
}
