import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}
function fmtDateLong(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Confirm Modal (Release / Complete) ────────────────────────────────────────
function ConfirmModal({ type, payout, onConfirm, onCancel, loading }) {
  const isRelease = type === 'release';
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 className="text-lg font-bold text-[#0F1A2B] text-center mb-2">
          {isRelease ? 'Release Payment?' : 'Mark as Completed?'}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-1">
          {isRelease ? 'You are about to release' : 'Confirm payout completed for'}
        </p>
        <p className="text-base font-bold text-[#0F1A2B] text-center mb-1">{payout?.vendor_name}</p>
        <p className="text-xl font-bold text-[#3D6B4F] text-center mb-3">{naira(payout?.amount)}</p>
        {isRelease && (
          <p className="text-xs text-gray-400 text-center mb-6">
            Bank details: {payout?.bank_name} · {payout?.bank_account_number}
          </p>
        )}
        <div className="flex gap-3 mb-3">
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-all
              ${isRelease ? 'bg-[#3D6B4F] hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading ? '…' : isRelease ? 'Confirm Release' : 'Confirm Completed'}
          </button>
          <button onClick={onCancel} disabled={loading}
            className="flex-1 bg-[#8B3A2A] text-white font-semibold py-3 rounded-xl text-sm
                       hover:opacity-90 disabled:opacity-50 transition-all">
            Cancel
          </button>
        </div>
        {isRelease && <p className="text-[10px] text-gray-400 text-center">This action cannot be undone</p>}
      </div>
    </div>
  );
}

// ── Receipt Section ───────────────────────────────────────────────────────────
function ReceiptSection({ title, rows }) {
  return (
    <div className="mb-7">
      <h3 className="text-sm font-bold text-[#0F1A2B] mb-3">{title}</h3>
      <div className="space-y-2">
        {rows.map(([label, value]) => value !== undefined && (
          <div key={label} className="flex">
            <span className="w-44 text-xs text-gray-400 flex-shrink-0">{label}</span>
            <span className="text-xs text-[#0F1A2B]">{value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminPayoutDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);  // 'release' | 'complete' | null
  const [actioning, setActioning] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get(`/admin/payouts/${id}`)
      .then(({ data: res }) => setData(res.payout))
      .catch(() => navigate('/admin/payouts'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(type) {
    setActioning(true);
    setError('');
    try {
      const endpoint = type === 'release'
        ? `/admin/payouts/${id}/release`
        : `/admin/payouts/${id}/complete`;
      const { data: res } = await api.post(endpoint);
      setData(res.payout);
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
      setModal(null);
    } finally { setActioning(false); }
  }

  if (loading) return (
    <AdminShell title="Payout Receipt">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  if (!data) return null;

  // Compute commission — use category commission or default 10%
  const commissionPct = 10;
  const saleAmount    = Number(data.amount);
  const commission    = saleAmount * (commissionPct / 100);
  const vendorPayout  = saleAmount - commission;

  return (
    <AdminShell title="Payout Receipt">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-xs text-gray-400">
        <Link to="/admin/payouts" className="hover:text-[#0F1A2B]">Payouts</Link>
        <span>/</span>
        <span className="text-[#0F1A2B] font-medium">{data.vendor_name}</span>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-6 max-w-5xl">

        {/* ── Receipt Document ── */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Header */}
          <div className="mb-7">
            <h2 className="text-xl font-bold text-[#0F1A2B]">Payout Receipt</h2>
            <p className="text-xs text-gray-400 mt-1">Receipt #{data.receipt_number}</p>
            <p className="text-xs text-gray-400">{fmtDate(data.processed_at || data.updated_at || data.created_at)}</p>
          </div>

          {/* Payment Details */}
          <ReceiptSection title="Payment Details" rows={[
            ['Receipt Number',    data.receipt_number],
            ['Payout Date',       fmtDate(data.processed_at || data.updated_at)],
            ['Payout Date',       'Bank Transfer'],
            ['Transfer Reference',data.gateway_reference || data.gateway_response?.reference || 'TRF-XXXXXXXXX'],
          ]} />

          {/* Vendor Details */}
          <ReceiptSection title="Vendor Details" rows={[
            ['Business Name',   data.vendor_name],
            ['Vendor Name',     data.vendor_name],
            ['Email',           data.vendor_email],
            ['Bank',            data.bank_name],
            ['Account Number',  data.bank_account_number],
            ['Account Name',    data.bank_account_name],
          ]} />

          {/* Payout Breakdown */}
          <div className="mb-7">
            <h3 className="text-sm font-bold text-[#0F1A2B] mb-3">Payout Breakdown</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="w-44 text-xs text-gray-400 flex-shrink-0">Sale Amount</span>
                <span className="text-xs text-[#0F1A2B]">{naira(saleAmount)}</span>
              </div>
              <div className="flex">
                <span className="w-44 text-xs text-gray-400 flex-shrink-0">Bryge Commission ({commissionPct}%)</span>
                <span className="text-xs text-[#8B3A2A]">−{naira(commission)}</span>
              </div>
              <div className="flex border-t border-gray-100 pt-2 mt-1">
                <span className="w-44 text-xs font-semibold text-[#0F1A2B] flex-shrink-0">Total Paid to Vendor</span>
                <span className="text-xs font-bold text-[#0F1A2B]">{naira(vendorPayout)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              This receipt confirms that payment of {naira(vendorPayout)} has been successfully
              transferred to the above vendor's bank account.
            </p>
            <p className="text-xs text-gray-400">Bryge Global Services Limited</p>
            <p className="text-xs text-gray-400">620 Tulip Road, Lekki, Lagos, Nigeria</p>
            <p className="text-xs text-gray-400">hello.bryge@gmail.com · 08172070964</p>
          </div>
        </div>

        {/* ── Right: Status + Action ── */}
        <div className="w-56 space-y-4 flex-shrink-0">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-xs text-gray-400 mb-2">Status</p>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize
              ${data.status === 'pending'    ? 'bg-amber-100 text-amber-700'
              : data.status === 'processing' ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'}`}>
              {data.status}
            </span>
            {data.processed_at && (
              <p className="text-[10px] text-gray-400 mt-2">{fmtDateLong(data.processed_at)}</p>
            )}
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Wallet</p>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Available</span>
              <span className="text-xs font-semibold text-[#0F1A2B]">{naira(data.available_balance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">On Hold</span>
              <span className="text-xs text-amber-600">{naira(data.on_hold_balance)}</span>
            </div>
          </div>

          {/* Action */}
          {data.status === 'pending' && (
            <button onClick={() => { setError(''); setModal('release'); }}
              className="w-full py-3 bg-[#3D6B4F] text-white text-sm font-semibold rounded-xl
                         hover:bg-green-700 transition-colors">
              Release Payment
            </button>
          )}
          {data.status === 'processing' && (
            <button onClick={() => { setError(''); setModal('complete'); }}
              className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl
                         hover:bg-blue-700 transition-colors">
              Mark as Completed
            </button>
          )}
          {data.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-4 text-center">
              <svg className="text-green-600 mx-auto mb-1.5" width="20" height="20" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
              <p className="text-xs font-semibold text-green-700">Payout Complete</p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ConfirmModal
          type={modal}
          payout={data}
          loading={actioning}
          onConfirm={() => handleAction(modal)}
          onCancel={() => setModal(null)}
        />
      )}
    </AdminShell>
  );
}
