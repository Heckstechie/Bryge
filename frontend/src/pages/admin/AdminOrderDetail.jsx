import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) {
  return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_COLORS = {
  pending:          'bg-amber-100 text-amber-700 border-amber-200',
  confirmed:        'bg-blue-100 text-blue-700 border-blue-200',
  processing:       'bg-blue-100 text-blue-700 border-blue-200',
  out_for_delivery: 'bg-purple-100 text-purple-700 border-purple-200',
  shipped:          'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:        'bg-green-100 text-green-700 border-green-200',
  cancelled:        'bg-gray-100 text-gray-500 border-gray-200',
  disputed:         'bg-red-100 text-red-700 border-red-200',
  refunded:         'bg-orange-100 text-orange-700 border-orange-200',
};

function StatusBadge({ status, large }) {
  const cls = large ? 'px-3.5 py-1 rounded-xl text-sm' : 'px-2.5 py-0.5 rounded-full text-xs';
  return (
    <span className={`inline-flex items-center font-medium capitalize border
      ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-500 border-gray-200'} ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

const VENDOR_STATUS_OPTIONS = [
  { value: 'confirmed',        label: 'Confirmed' },
  { value: 'processing',       label: 'Processing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered',        label: 'Delivered' },
  { value: 'cancelled',        label: 'Cancelled' },
];

const DISPUTE_REASON_LABELS = {
  not_received:      'Item Not Received',
  wrong_item:        'Wrong Item Sent',
  damaged:           'Item Damaged',
  not_as_described:  'Not as Described',
  other:             'Other',
};

export default function AdminOrderDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [resolving, setResolving] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [updatingVo, setUpdatingVo] = useState(null);  // vendor_order id being updated
  const [voStatus, setVoStatus] = useState({});         // { [voId]: newStatus }
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  function fetchData() {
    setLoading(true);
    api.get(`/admin/orders/${id}`)
      .then(({ data: res }) => {
        setData(res);
        // Seed local VO status state
        const init = {};
        (res.vendor_orders || []).forEach((vo) => { init[vo.id] = vo.status; });
        setVoStatus(init);
      })
      .catch(() => navigate('/admin/orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, [id]);

  async function updateVoStatus(vo) {
    const newStatus = voStatus[vo.id];
    if (newStatus === vo.status) return;
    setUpdatingVo(vo.id);
    setError('');
    try {
      await api.patch(`/admin/orders/${id}/vendor-orders/${vo.id}/status`, { status: newStatus });
      setSuccess('Status updated');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally { setUpdatingVo(null); }
  }

  async function resolveDispute(resolution) {
    if (!window.confirm(`Confirm: ${resolution === 'release_to_vendor' ? 'Release to Vendor' : 'Refund Customer'}?`)) return;
    setResolving(true);
    setError('');
    try {
      await api.post(`/admin/disputes/${data.dispute.id}/resolve`, {
        resolution,
        resolution_notes: resolveNotes || undefined,
      });
      setSuccess('Dispute resolved successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve dispute');
    } finally { setResolving(false); }
  }

  if (loading) {
    return (
      <AdminShell title="Order Detail">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  const { order, vendor_orders, dispute, escrow } = data;
  const addr = order.shipping_address || {};

  const payLabel = order.gateway === 'stripe'
    ? 'Stripe (USD)'
    : (order.gateway_response?.card_type
        ? order.gateway_response.card_type.charAt(0).toUpperCase() + order.gateway_response.card_type.slice(1)
        : 'Paystack');

  return (
    <AdminShell title="Order Detail">

      {/* ── Breadcrumb + back ── */}
      <div className="flex items-center gap-2 mb-5 text-xs text-gray-400">
        <Link to="/admin/orders" className="hover:text-[#0F1A2B]">Orders</Link>
        <span>/</span>
        <span className="text-[#0F1A2B] font-medium">{order.order_number}</span>
      </div>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-[#0F1A2B]">{order.order_number}</h2>
            <StatusBadge status={order.status} large />
            {dispute && dispute.status === 'open' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white
                               text-xs font-semibold rounded-xl">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
                </svg>
                Dispute Open
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">Placed on {fmtDate(order.created_at)}</p>
        </div>
      </div>

      {/* Notifications */}
      {error   && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{success}</div>}

      {/* ── Main layout ── */}
      <div className="grid grid-cols-[1fr_340px] gap-5">

        {/* ── LEFT column ── */}
        <div className="space-y-5">

          {/* Dispute Panel — shown prominently when dispute exists and is open */}
          {dispute && dispute.status === 'open' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="text-white" width="16" height="16" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700">Dispute Submitted</p>
                  <p className="text-xs text-red-500">{fmtDateTime(dispute.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-sm text-red-800 font-medium">
                    {DISPUTE_REASON_LABELS[dispute.reason] || dispute.reason}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Submitted By</p>
                  <p className="text-sm text-red-800">
                    {dispute.customer_first} {dispute.customer_last}
                  </p>
                  <p className="text-xs text-red-500">{dispute.customer_email}</p>
                </div>
              </div>

              {dispute.description && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Customer's Description</p>
                  <p className="text-sm text-red-800 bg-white/60 rounded-xl p-3 leading-relaxed">
                    {dispute.description}
                  </p>
                </div>
              )}

              {/* Resolution notes */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1 block">
                  Resolution Notes (optional)
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Add notes about the resolution decision…"
                  rows={3}
                  className="w-full border border-red-200 rounded-xl px-4 py-3 text-sm text-gray-700
                             focus:outline-none focus:border-red-400 bg-white resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => resolveDispute('release_to_vendor')}
                  disabled={resolving}
                  className="flex-1 bg-[#0F1A2B] text-white font-semibold py-3 rounded-xl text-sm
                             hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {resolving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                      </svg>
                      Release to Vendor
                    </>
                  )}
                </button>
                <button
                  onClick={() => resolveDispute('refund_customer')}
                  disabled={resolving}
                  className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl text-sm
                             hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {resolving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"/>
                      </svg>
                      Refund Customer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Resolved dispute info */}
          {dispute && dispute.status === 'resolved' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <svg className="text-green-600" width="16" height="16" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                <p className="text-sm font-bold text-green-700">Dispute Resolved</p>
              </div>
              <p className="text-xs text-green-600 mb-1">
                <strong>Resolution:</strong>{' '}
                {dispute.resolution === 'release_to_vendor' ? 'Released to vendor' : 'Refunded to customer'}
              </p>
              {dispute.resolution_notes && (
                <p className="text-xs text-green-700 bg-white/60 rounded-lg p-2 mt-1">{dispute.resolution_notes}</p>
              )}
              <p className="text-[10px] text-green-500 mt-2">Resolved {fmtDateTime(dispute.resolved_at)}</p>
            </div>
          )}

          {/* Vendor Sub-Orders */}
          {vendor_orders.map((vo) => (
            <div key={vo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <p className="text-sm font-bold text-[#0F1A2B]">{vo.vendor_name}</p>
                  <p className="text-xs text-gray-400">{vo.vendor_email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={vo.status} />
                  {/* Status update dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={voStatus[vo.id] || vo.status}
                      onChange={(e) => setVoStatus((prev) => ({ ...prev, [vo.id]: e.target.value }))}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white
                                 text-gray-600 focus:outline-none focus:border-[#0F1A2B]/30"
                    >
                      {VENDOR_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateVoStatus(vo)}
                      disabled={updatingVo === vo.id || voStatus[vo.id] === vo.status}
                      className="text-xs px-3 py-1.5 bg-[#0F1A2B] text-white rounded-lg font-medium
                                 disabled:opacity-40 hover:opacity-90"
                    >
                      {updatingVo === vo.id ? '…' : 'Update'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50">
                {vo.items.map((item) => {
                  const variant = item.variant_details
                    ? (typeof item.variant_details === 'string'
                        ? JSON.parse(item.variant_details) : item.variant_details)
                    : null;
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-14 h-14 bg-[#F7F5F0] rounded-xl overflow-hidden flex-shrink-0">
                        {item.product_image
                          ? <img src={item.product_image} alt={item.product_name}
                              className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0F1A2B]">{item.product_name}</p>
                        {variant && (
                          <p className="text-xs text-gray-400">{variant.name}: {variant.value}</p>
                        )}
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#0F1A2B]">{naira(item.total_price_ngn)}</p>
                        <p className="text-[10px] text-gray-400">{naira(item.unit_price_ngn)} each</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vendor earnings row */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Commission: {Number(vo.commission_rate).toFixed(1)}% ({naira(vo.commission_ngn)})</span>
                  <span className="text-gray-300">|</span>
                  <span>Vendor earns: <strong className="text-green-600">{naira(vo.vendor_earnings_ngn)}</strong></span>
                </div>
                {vo.tracking_number && (
                  <span className="text-xs text-gray-400">Tracking: {vo.tracking_number}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT column ── */}
        <div className="space-y-4">

          {/* Order Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-[#0F1A2B] mb-4">Order Summary</h3>
            <div className="space-y-2.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-[#0F1A2B]">{naira(order.subtotal_ngn)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-[#0F1A2B]">{naira(order.shipping_fee_ngn)}</span>
              </div>
              {Number(order.discount_ngn) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-green-600">−{naira(order.discount_ngn)}</span>
                </div>
              )}
            </div>
            <hr className="border-gray-100 mb-4" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#0F1A2B]">Total</span>
              <span className="font-bold text-[#0F1A2B] text-lg">{naira(order.total_ngn)}</span>
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-[#0F1A2B] mb-3">Customer</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[#0F1A2B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#0F1A2B]">
                  {(order.customer_first?.[0] || '') + (order.customer_last?.[0] || '')}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F1A2B]">
                  {order.customer_first} {order.customer_last}
                </p>
                <p className="text-xs text-gray-400">{order.customer_email}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-[#0F1A2B] mb-3">Shipping Address</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p className="font-medium text-[#0F1A2B]">{addr.first_name} {addr.last_name}</p>
              {addr.address_line1 && <p>{addr.address_line1}</p>}
              {addr.address_line2 && <p>{addr.address_line2}</p>}
              {(addr.city || addr.state) && (
                <p>{[addr.city, addr.state].filter(Boolean).join(', ')}</p>
              )}
              {addr.country && <p>{addr.country}</p>}
              {addr.phone && <p className="text-gray-400 mt-1">{addr.phone}</p>}
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-[#0F1A2B] mb-3">Payment</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Gateway</span>
                <span className="font-medium text-[#0F1A2B] capitalize">{payLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={`font-medium capitalize ${
                  order.payment_status === 'paid'     ? 'text-green-600' :
                  order.payment_status === 'refunded' ? 'text-orange-500' : 'text-amber-600'
                }`}>{order.payment_status}</span>
              </div>
              {order.payment_reference && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Reference</span>
                  <span className="font-mono text-[10px] text-gray-600 truncate max-w-[140px]">
                    {order.payment_reference}
                  </span>
                </div>
              )}
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Paid At</span>
                  <span className="text-gray-600">{fmtDate(order.paid_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Escrow Card */}
          {escrow?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#0F1A2B] mb-3">Escrow</h3>
              <div className="space-y-2">
                {escrow.map((esc) => (
                  <div key={esc.id} className="flex justify-between text-xs">
                    <span className={`capitalize font-medium px-2 py-0.5 rounded-full text-[10px]
                      ${esc.status === 'holding'  ? 'bg-amber-100 text-amber-700' :
                        esc.status === 'released' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-600'}`}>
                      {esc.status}
                    </span>
                    <span className="font-semibold text-[#0F1A2B]">{naira(esc.amount_ngn)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </AdminShell>
  );
}
