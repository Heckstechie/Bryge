import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ORDER_STATUS_COLORS = {
  paid:       'bg-green-50 text-green-700',
  pending:    'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  cancelled:  'bg-gray-100 text-gray-500',
  refunded:   'bg-orange-50 text-orange-700',
};

function StatusBadge({ status, map = ORDER_STATUS_COLORS }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize
      ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

function ConfirmModal({ title, body, confirmLabel, confirmClass, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  async function go() { setLoading(true); await onConfirm(); setLoading(false); }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#D45B3E" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.302-12.748c.866-1.5 3.032-1.5 3.898 0L21.303 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
          </svg>
        </div>
        <h3 className="text-sm font-bold text-[#0F1A2B] mb-2">{title}</h3>
        <p className="text-xs text-gray-400 mb-5">{body}</p>
        <div className="flex gap-2">
          <button onClick={go} disabled={loading}
            className={`flex-1 py-2.5 text-white text-xs font-semibold rounded-xl disabled:opacity-60 ${confirmClass}`}>
            {loading ? 'Processing…' : confirmLabel}
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [confirm, setConfirm]   = useState(null);
  const [toast, setToast]       = useState('');

  function load() {
    setLoading(true);
    api.get(`/admin/customers/${id}`)
      .then(({ data: d }) => setData(d))
      .catch(() => navigate('/admin/customers'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function toggleStatus(action) {
    try {
      await api.patch(`/admin/customers/${id}/status`, { action });
      showToast(`Customer ${action}d`);
      load();
    } catch (e) { showToast(e.response?.data?.error || 'Failed'); }
    finally { setConfirm(null); }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  if (loading) return (
    <AdminShell title="Customer Detail">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  const { customer, stats, orders } = data || {};
  const isSuspended = customer?.status === 'suspended' || customer?.status === 'deactivated';

  return (
    <AdminShell title="Customer Detail">

      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#0F1A2B] text-white text-xs px-4 py-3 rounded-xl shadow-lg">{toast}</div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title} body={confirm.body}
          confirmLabel={confirm.label} confirmClass={confirm.cls}
          onConfirm={confirm.action} onClose={() => setConfirm(null)}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
        <Link to="/admin/customers" className="hover:text-[#0F1A2B]">Customers</Link>
        <span>/</span>
        <span className="text-[#0F1A2B] font-medium">{customer?.full_name}</span>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">

        {/* Customer info */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#0F1A2B]/10 rounded-full flex items-center justify-center text-[#0F1A2B] text-lg font-bold">
                {customer?.full_name ? customer.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '?'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0F1A2B]">{customer?.full_name || '—'}</h2>
                <p className="text-xs text-gray-400">{customer?.email}</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize
                    ${isSuspended ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {customer?.status}
                  </span>
                </div>
              </div>
            </div>
            {isSuspended ? (
              <button
                onClick={() => setConfirm({
                  title: 'Activate Customer?', body: 'This customer will regain access to the platform.',
                  label: 'Yes, Activate', cls: 'bg-[#3D6B4F]', action: () => toggleStatus('activate'),
                })}
                className="px-4 py-2 bg-[#3D6B4F] text-white text-xs font-semibold rounded-xl hover:bg-[#3D6B4F]/90">
                Activate Account
              </button>
            ) : (
              <button
                onClick={() => setConfirm({
                  title: 'Suspend Customer?', body: 'This customer will be unable to log in or place orders.',
                  label: 'Yes, Suspend', cls: 'bg-[#D45B3E]', action: () => toggleStatus('suspend'),
                })}
                className="px-4 py-2 bg-[#D45B3E]/10 text-[#D45B3E] text-xs font-semibold rounded-xl hover:bg-[#D45B3E]/20">
                Suspend Account
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: 'Phone',    value: customer?.phone   || '—' },
              { label: 'Joined',   value: fmtDate(customer?.created_at) },
              { label: 'Address',  value: customer?.address || '—' },
              { label: 'City',     value: customer?.city    || '—' },
              { label: 'State',    value: customer?.state   || '—' },
              { label: 'Country',  value: customer?.country || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                <p className="text-xs font-medium text-[#0F1A2B]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          {[
            { label: 'Total Orders',    value: Number(stats?.total_orders || 0).toLocaleString(),    bg: 'bg-[#0F1A2B]' },
            { label: 'Total Spent',     value: naira(stats?.total_spent),                            bg: 'bg-[#3D6B4F]' },
            { label: 'Avg Order Value', value: naira(stats?.avg_order_value),                        bg: 'bg-[#5C4A1E]' },
            { label: 'Pending Orders',  value: Number(stats?.pending_orders || 0).toLocaleString(),  bg: 'bg-[#8B3A2A]' },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`${bg} rounded-2xl px-5 py-4`}>
              <p className="text-[11px] text-white/50 mb-0.5">{label}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-sm font-bold text-[#0F1A2B]">Order History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Order #</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Items</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Amount</th>
              <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3 pr-6">Date</th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((o) => (
              <tr key={o.id}
                onClick={() => navigate(`/admin/orders/${o.id}`)}
                className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer">
                <td className="px-6 py-3 text-xs font-semibold text-[#D45B3E]">{o.order_number}</td>
                <td className="px-3 py-3 text-right text-xs text-gray-500">{o.item_count}</td>
                <td className="px-3 py-3 text-right text-xs font-medium text-[#0F1A2B]">{naira(o.total_ngn)}</td>
                <td className="px-3 py-3 text-center">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-3 py-3 pr-6 text-right text-xs text-gray-400">{fmtDate(o.created_at)}</td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 text-sm py-12">No orders yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
