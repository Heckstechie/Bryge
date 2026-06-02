import { useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200
        ${checked ? 'bg-[#3D6B4F]' : 'bg-gray-200'}`}>
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5
        ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

const GATEWAYS = [
  {
    id:    'paystack',
    name:  'Paystack',
    desc:  'Nigerian payments — Cards, Bank Transfer, USSD',
    active: true,
  },
  {
    id:    'stripe',
    name:  'Stripe',
    desc:  'International card payments',
    active: true,
  },
];

const NOTIFICATION_EVENTS = [
  { key: 'vendor_application', label: 'New Vendor Application',  email: false, dashboard: true },
  { key: 'dispute_opened',     label: 'New Dispute Opened',      email: true,  dashboard: true },
  { key: 'large_transaction',  label: 'Large Transaction Alert', email: true,  dashboard: true },
  { key: 'daily_revenue',      label: 'Daily Revenue Summary',   email: false, dashboard: true },
  { key: 'low_stock',          label: 'Low Stock Alert',         email: true,  dashboard: true },
  { key: 'payment_processed',  label: 'Payment Processed',       email: true,  dashboard: true },
];

export default function AdminPaymentGateways() {
  const [gateways, setGateways]     = useState(GATEWAYS);
  const [notifications, setNotifs]  = useState(NOTIFICATION_EVENTS);
  const [saved, setSaved]           = useState(false);

  function toggleGateway(id) {
    setGateways((prev) => prev.map((g) => g.id === id ? { ...g, active: !g.active } : g));
  }

  function toggleNotif(key, channel) {
    setNotifs((prev) => prev.map((n) => n.key === key ? { ...n, [channel]: !n[channel] } : n));
  }

  function saveAll() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <AdminShell title="Payment Gateways">
      <div className="max-w-xl">

        {/* Gateway Cards */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 mb-8">
          {gateways.map((gw) => (
            <div key={gw.id} className="flex items-center justify-between px-6 py-5">
              <div>
                <p className="text-sm font-bold text-[#0F1A2B]">{gw.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{gw.desc}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold
                  ${gw.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {gw.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => {}}
                  className="flex items-center gap-0.5 text-xs text-[#3D6B4F] hover:text-[#0F1A2B] font-medium">
                  Configure
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Notification Settings */}
        <h2 className="text-sm font-bold text-[#0F1A2B] mb-3">Notification Settings</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_90px] px-6 py-3 bg-gray-50/80 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400">Events</span>
            <span className="text-xs font-semibold text-gray-400 text-center">Email</span>
            <span className="text-xs font-semibold text-gray-400 text-center">Dashboard</span>
          </div>
          {/* Rows */}
          {notifications.map((n) => (
            <div key={n.key}
              className="grid grid-cols-[1fr_80px_90px] px-6 py-4 border-b border-gray-50 last:border-0">
              <span className="text-xs text-[#0F1A2B] font-medium self-center">{n.label}</span>
              <div className="flex justify-center items-center">
                <Toggle checked={n.email} onChange={() => toggleNotif(n.key, 'email')} />
              </div>
              <div className="flex justify-center items-center">
                <Toggle checked={n.dashboard} onChange={() => toggleNotif(n.key, 'dashboard')} />
              </div>
            </div>
          ))}
        </div>

        {/* Save */}
        <button onClick={saveAll}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all
            ${saved ? 'bg-green-600' : 'bg-[#8B3A2A] hover:opacity-90'}`}>
          {saved ? '✓ Saved!' : 'Save All Changes'}
        </button>
      </div>
    </AdminShell>
  );
}
