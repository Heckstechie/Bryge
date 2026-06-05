 import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// ── Tab → backend status mapping ───────────────────────────────────────────────
const TABS = [
  { key: 'all',        label: 'All',        status: null                            },
  { key: 'new',        label: 'New',        status: 'pending'                       },
  { key: 'preparing',  label: 'Preparing',  status: 'processing'                   },
  { key: 'dispatched', label: 'Dispatched', status: 'dispatched,out_for_delivery'  },
  { key: 'completed',  label: 'Completed',  status: 'delivered'                     },
];

// ── Status → badge(s) config ───────────────────────────────────────────────────
function getBadges(status) {
  switch (status) {
    case 'pending':
      return [{ label: 'New Order', cls: 'bg-[#C8603A] text-white' }];
    case 'processing':
      return [{ label: 'Preparing', cls: 'bg-[#2E3A2C] text-white' }];
    case 'dispatched':
      return [{ label: 'Dispatched', cls: 'bg-navy text-white' }];
    case 'out_for_delivery':
      return [
        { label: 'Dispatched',      cls: 'bg-navy text-white'      },
        { label: 'Out for Delivery', cls: 'bg-[#C8603A] text-white' },
      ];
    case 'delivered':
      return [{ label: 'Delivered', cls: 'bg-[#3D6B4F] text-white' }];
    default:
      return [{ label: status, cls: 'bg-[#8A9BB0] text-white' }];
  }
}

function fmtDate(iso) {
  const d   = new Date(iso);
  const dd  = String(d.getDate()).padStart(2, '0');
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const yr  = d.getFullYear();
  const hr  = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ap  = hr >= 12 ? 'PM' : 'AM';
  return `${dd}-${mm}-${yr} · ${hr % 12 || 12}:${min}${ap}`;
}

function naira(n) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

// ── Muted completed button ─────────────────────────────────────────────────────
const completedBtn = `w-full flex items-center justify-center gap-2
  bg-[#B5C9BE] text-white text-sm font-semibold py-3.5 rounded-xl
  cursor-default select-none`;

// ── Active terracotta action button ────────────────────────────────────────────
const activeBtn = `w-full flex items-center justify-center gap-2
  bg-[#C8603A] text-white text-sm font-bold py-3.5 rounded-xl
  hover:bg-[#B55533] active:scale-[0.98] transition-all`;

// ── Confirmation modal configs ─────────────────────────────────────────────────
const MODALS = {
  ready_for_pickup: {
    title:   'Confirm Pickup Ready?',
    body:    "This lets Bryge know your item is packed and ready for our agent to collect.",
    confirm: "Yes, It's Ready",
    action:  'ready_for_pickup',
  },
  dispatch_to_agent: {
    title:   'Confirm Handoff?',
    body:    "Only confirm this if you have physically handed the item to our delivery agent.",
    confirm: 'Yes, Agent Has It',
    action:  'dispatch_to_agent',
  },
};

export default function VendorOrders() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);

  // Modal state: { orderId, modalKey } | null
  const [modal, setModal]         = useState(null);
  const [confirming, setConfirming] = useState(false);

  const currentTab = TABS.find(t => t.key === activeTab);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (currentTab.status) params.status = currentTab.status;
      if (search.trim())     params.search  = search.trim();
      const { data } = await api.get('/vendor/orders', { params });
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);   // eslint-disable-line

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function confirmAction() {
    if (!modal) return;
    setConfirming(true);
    try {
      const { data } = await api.patch(`/vendor/orders/${modal.orderId}/status`, {
        action: MODALS[modal.modalKey].action,
      });
      // Optimistically update the order status
      setOrders(prev =>
        prev.map(o => o.id === modal.orderId ? { ...o, status: data.status } : o)
      );
      setModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order. Please try again.');
    } finally {
      setConfirming(false);
    }
  }

  // Filter locally by search
  const visible = search.trim()
    ? orders.filter(o =>
        (o.order_ref || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.product_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)}
                  className="p-1 text-navy hover:text-navy/70 transition-colors flex-none">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M15.75 19.5 8.25 12l7.5-7.5"/>
            </svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-navy">My Orders</h1>
          <span className="w-8 flex-none" />
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C0BAB2]">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="text" placeholder="Search"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E2DED8] rounded-full
                       pl-10 pr-4 py-3 text-sm text-navy placeholder-[#C0BAB2]
                       focus:outline-none focus:border-navy/30 focus:ring-2
                       focus:ring-navy/10 transition-all"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {TABS.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap text-xs font-semibold px-4 py-2
                          rounded-full transition-colors flex-none ${
                activeTab === tab.key
                  ? 'bg-[#3D6B4F] text-white'
                  : 'bg-[#EDE8DF] text-navy/60 hover:text-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pb-10">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-28 text-center px-6">
            <h2 className="text-xl font-bold text-navy mb-3">No orders yet</h2>
            <p className="text-[#8A9BB0] text-sm leading-relaxed">
              Your orders will appear here once customers start buying
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onAction={(modalKey) => setModal({ orderId: order.id, modalKey })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Confirmation modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-cream rounded-3xl shadow-xl w-full max-w-xs p-7 text-center">
            <h3 className="text-lg font-bold text-navy mb-2">
              {MODALS[modal.modalKey].title}
            </h3>
            <p className="text-[#8A9BB0] text-sm leading-relaxed mb-7">
              {MODALS[modal.modalKey].body}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmAction}
                disabled={confirming}
                className="flex-1 bg-[#3D6B4F] text-white font-semibold py-3
                           rounded-full hover:bg-[#325c43] transition-colors
                           disabled:opacity-60 text-sm"
              >
                {confirming ? 'Updating…' : MODALS[modal.modalKey].confirm}
              </button>
              <button
                onClick={() => setModal(null)}
                disabled={confirming}
                className="flex-1 bg-[#C8603A] text-white font-semibold py-3
                           rounded-full hover:bg-[#B55533] transition-colors
                           disabled:opacity-60 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Order card ─────────────────────────────────────────────────────────────────
function OrderCard({ order, onAction }) {
  const badges     = getBadges(order.status);
  const isNew      = order.status === 'pending';
  const isPreparing = order.status === 'processing';
  const isDone     = ['dispatched', 'out_for_delivery', 'delivered'].includes(order.status);

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      {/* Info row */}
      <div className="flex gap-3 px-4 pt-4 pb-3">
        {/* Product thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-[#F0EBE2] overflow-hidden flex-none">
          {order.product_image
            ? <img src={order.product_image} alt={order.product_name}
                   className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
          }
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-[#8A9BB0] text-[11px] font-medium mb-0.5">
            {order.order_ref || `ORD-${String(order.id).slice(0, 8).toUpperCase()}`}
          </p>
          <p className="text-navy font-semibold text-sm leading-snug">
            {order.product_name || 'Product'}
          </p>
          <p className="text-[#8A9BB0] text-xs mt-0.5">{fmtDate(order.created_at)}</p>
          <p className="text-[#8A9BB0] text-xs mt-0.5">
            QTY: {order.quantity || 1}
            <span className="mx-2">·</span>
            Price: <span className="font-medium text-navy">{naira(order.price)}</span>
          </p>
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {badges.map(b => (
              <span key={b.label}
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md ${b.cls}`}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {(isNew || isPreparing || isDone) && (
        <div className="px-4 pb-4 flex flex-col gap-2">

          {/* New → Ready for Pickup (active terracotta) */}
          {isNew && (
            <button className={activeBtn} onClick={() => onAction('ready_for_pickup')}>
              Ready for Pickup
            </button>
          )}

          {/* Preparing/Dispatched → show step history + next action */}
          {(isPreparing || isDone) && (
            <>
              {/* Step 1: completed */}
              <button className={completedBtn} disabled>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                Ready for Pickup
              </button>

              {/* Step 2: active (preparing) or completed (dispatched) */}
              {isPreparing ? (
                <button className={activeBtn} onClick={() => onAction('dispatch_to_agent')}>
                  Confirm Dispatched to Agent
                </button>
              ) : (
                <button className={completedBtn} disabled>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  Dispatched to Agent
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
