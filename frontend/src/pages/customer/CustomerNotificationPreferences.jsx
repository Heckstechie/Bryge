import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OPTIONS = [
  { key: 'order_updates', label: 'Order updates' },
  { key: 'delivery_updates', label: 'Delivery updates' },
  { key: 'promotions', label: 'Promotions & offers' },
  { key: 'dispute_updates', label: 'Dispute updates' },
  { key: 'email_notifications', label: 'Email notifications' },
];

export default function CustomerNotificationPreferences() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('customer_notification_prefs') || '{}');
    setPrefs({
      order_updates: true,
      delivery_updates: true,
      promotions: false,
      dispute_updates: true,
      email_notifications: true,
      ...stored,
    });
  }, []);

  function toggle(key) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function save() {
    localStorage.setItem('customer_notification_prefs', JSON.stringify(prefs));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 text-navy">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <h1 className="text-lg font-bold text-navy">Notification Preferences</h1>
        </div>

        <div className="bg-white rounded-3xl p-5 space-y-4">
          {OPTIONS.map((option) => (
            <label key={option.key} className="flex items-center justify-between gap-3 rounded-3xl bg-[#F5F1E8] p-4">
              <div>
                <div className="text-sm font-semibold text-navy">{option.label}</div>
              </div>
              <input type="checkbox" checked={prefs[option.key] || false} onChange={() => toggle(option.key)} className="h-5 w-5 rounded border-[#C0BAB2] text-[#3D6B4F] focus:ring-[#3D6B4F]" />
            </label>
          ))}

          <button onClick={save} className="w-full bg-[#3D6B4F] text-white py-3 rounded-3xl font-semibold">Save Preferences</button>
          {saved && <div className="text-sm text-[#3D6B4F]">Preferences saved locally.</div>}
        </div>
      </div>
    </div>
  );
}
