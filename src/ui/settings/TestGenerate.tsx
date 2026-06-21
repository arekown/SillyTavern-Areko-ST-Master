import { FC, useState } from 'react';
import { generateTrackerData } from '../../core/generation';
import { t } from '../../i18n';

export const TestGenerate: FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const run = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setResult('');
    try {
      const data = await generateTrackerData();
      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="areko-test">
      <div className="areko-section-title">{t('test.heading')}</div>
      <div className="menu_button menu_button_icon areko-test__btn" onClick={run}>
        <i className={loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-play'}></i>
        <span>{loading ? t('test.running') : t('test.run')}</span>
      </div>
      {error && <div className="areko-test__error">{error}</div>}
      {result && <pre className="areko-test__result">{result}</pre>}
    </div>
  );
};