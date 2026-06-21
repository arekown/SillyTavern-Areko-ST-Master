import type { FC } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ConnectionTab } from './settings/ConnectionTab';

let root: Root | null = null;
let container: HTMLElement | null = null;

const SettingsWindow: FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="areko-overlay" onClick={onClose}>
      <div className="areko-window" onClick={(e) => e.stopPropagation()}>
        <div className="areko-window__header">
          <span>Areko Tracker — Einstellungen</span>
          <div className="fa-solid fa-xmark areko-window__close" onClick={onClose}></div>
        </div>
        <div className="areko-window__body">
          <ConnectionTab />
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

export function closeSettingsWindow(): void {
  root?.render(<></>);
}