import { useEffect, useState } from 'react';
import api from '../../services/api';

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get('/customer/notifications')
      .then(({ data }) => {
        if (!mounted) return;
        setNotifications(data.notifications || []);
        setUnread(data.unread || 0);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function markAllRead() {
    setMarking(true);
    try {
      await api.patch('/customer/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      alert('Unable to mark notifications read');
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-navy">Notifications</h1>
          <button
            onClick={markAllRead}
            disabled={marking || unread === 0}
            className="text-xs font-semibold text-[#3D6B4F] disabled:text-[#A9B0AD]"
          >
            {unread ? `Mark all read (${unread})` : 'All caught up'}
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            [1,2,3,4].map(i => (
              <div key={i} className="h-20 rounded-3xl bg-white animate-pulse" />
            ))
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-sm text-[#8A9BB0]">
              You have no notifications yet.
            </div>
          ) : notifications.map((notification) => (
            <div key={notification.id}
              className={`flex items-center gap-4 rounded-3xl p-4 bg-white ${notification.read ? '' : 'ring-2 ring-[#C8603A]/15'}`}>
              <div className="w-12 h-12 rounded-2xl bg-[#EDE8DF] flex items-center justify-center text-2xl">
                🔔
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-navy truncate">{notification.title || 'Update'}</div>
                <div className="text-xs text-[#8A9BB0] mt-1 leading-relaxed break-words">{notification.message}</div>
              </div>
              <div className="text-[11px] text-[#8A9BB0] whitespace-nowrap">{fmtTime(notification.created_at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
