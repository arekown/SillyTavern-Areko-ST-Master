import { FC, useState, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { GeneralTab } from './settings/GeneralTab';
import { SchemaBuilder } from './settings/SchemaBuilder';
import { PromptsTab } from './settings/PromptsTab';
import { t } from '../i18n';

let root: Root | null = null;
let container: HTMLElement | null = null;

type Tab = 'general' | 'layout' | 'prompts';

const SettingsWindow: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<Tab>('general');
  const [, setTick] = useState(0);

  // Bei jeder Aenderung (z. B. Profilwechsel) das ganze Fenster neu rendern,
  // damit Labels sofort umschalten.
  useEffect(() => {
    const h = () => setTick((x) => x + 1);
    window.addEventListener('areko:updated', h);
    return () => window.removeEventListener('areko:updated', h);
  }, []);

  const TabBtn: FC<{ k: Tab; label: string }> = ({ k, label }) => (
    <div className={'areko-wtab' + (tab === k ? ' is-active' : '')} onClick={() => setTab(k)}>{label}</div>
  );

  return (
    <div className="areko-overlay" onClick={onClose}>
      <div className="areko-window" onClick={(e) => e.stopPropagation()}>
        <div className="areko-window__header">
          <span>{t('window.title')}</span>
          <div className="fa-solid fa-xmark areko-window__close" onClick={onClose}></div>
        </div>
        <div className="areko-window__tabs">
          <TabBtn k="general" label={t('tab.general')} />
          <TabBtn k="layout" label={t('tab.layout')} />
          <TabBtn k="prompts" label={t('tab.prompts')} />
        </div>
        <div className="areko-window__body">
          {tab === 'general' && <GeneralTab />}
          {tab === 'layout' && <SchemaBuilder />}
          {tab === 'prompts' && <PromptsTab />}
        </div>
      </div>
    </div>
  );
};

export function openSettingsWindow(): void {
  if (!container) {
    container = document.createElement('div');
    container.id = 'areko-tracker-window-root';
    document.body.appendChild(container);
    root = createRoot(container);
  }
  root!.render(<SettingsWindow onClose={closeSettingsWindow} />);
}
export function closeSettingsWindow(): void { root?.render(<></>); }
