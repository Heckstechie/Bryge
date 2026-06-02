import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TABS = [
  { key: 'all',     label: 'All'     },
  { key: 'orders',  label: 'Orders'  },
  { key: 'payouts', label: 'Payouts' },
  { key: 'updates', label: 'Updates' },
];

// How long ago
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)    return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)    return `${m} minute${m !== 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24)    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  const days = Math.floor(h / 24);
  if (days < 7)  return `${days} day${days !== 1 ? 's' : ''} ago`;
  const d  = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${dd}-${mm}-${yr}`;
}

// ── Bryge notification icon ────────────────────────────────────────────────────
function NotifIcon() {
  return (
    <div className="w-10 h-10 rounded-full bg-[#3D6B4F] flex items-center
                    justify-center flex-none">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
           stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1
                 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <path d="m22 6-10 7L2 6"/>
      </svg>
    </div>
  );
}

export default function VendorNotifications() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab]         = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.category = activeTab;
      const { data } = await api.get('/vendor/notifications', { params });
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Mark all read when page mounts
  useEffect(() => {
    api.patch('/vendor/notifications/read').catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center mb-5">
          <button onClick={() => navigate(-1)}
                  className="p-1 text-navy hover:text-navy/70 transition-colors flex-none">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M15.75 19.5 8.25 12l7.5-7.5"/>
            </svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-navy">Notifications</h1>
          <span className="w-8 flex-none" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-semibold px-5 py-1.5 rounded-full transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#3D6B4F] text-white'
                  : 'bg-[#DDD9D2] text-navy/60 hover:text-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="px-4 mt-2 space-y-px">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white h-16 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-28 text-center px-6">
          <h2 className="text-xl font-bold text-navy mb-3">You're all caught up</h2>
          <p className="text-[#8A9BB0] text-sm leading-relaxed">No new notifications</p>
        </div>
      ) : (
        <div className="mt-2">
          {notifications.map((n, idx) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                idx !== notifications.length - 1 ? 'border-b border-[#EDE8E0]' : ''
              } ${idx % 2 === 0 ? 'bg-cream' : 'bg-[#EDEBE6]'} ${
                !n.read ? 'relative' : ''
              }`}
            >
              {/* Unread dot */}
              {!n.read && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2
                                 w-1.5 h-1.5 rounded-full bg-[#C8603A]" />
              )}

              <NotifIcon />

              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${n.read ? 'text-navy/80' : 'text-navy font-medium'}`}>
                  {n.title}
                </p>
                {n.message && n.message !== n.title && (
                  <p className="text-[#8A9BB0] text-xs mt-0.5 truncate">{n.message}</p>
                )}
              </div>

              <p className="text-[#8A9BB0] text-[11px] flex-none whitespace-nowrap">
                {timeAgo(n.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
