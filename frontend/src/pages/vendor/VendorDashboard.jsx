import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorShell from '../../components/vendor/VendorShell';
import api from '../../services/api';

function fmtDate(iso) {
  const d = new Date(iso);
  const day  = String(d.getDate()).padStart(2, '0');
  const mon  = String(d.getMonth() + 1).padStart(2, '0');
  const yr   = d.getFullYear();
  const hr   = d.getHours();
  const min  = String(d.getMinutes()).padStart(2, '0');
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr % 12 || 12;
  return `${day}-${mon}-${yr}  ${hr12}:${min}${ampm}`;
}

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendor/dashboard')
      .then(({ data: res }) => setData(res))
      .catch(() => navigate('/vendor/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { vendor, wallet, orders = [], low_stock_count = 0 } = data;

  // Route to correct status screen
  let statusContent;
  if (vendor.status === 'pending') {
    statusContent = <UnderReview />;
  } else if (vendor.status === 'rejected') {
    statusContent = <Declined />;
  } else if (vendor.status === 'active' && !vendor.has_bank_details) {
    statusContent = <Approved onAddBank={() => navigate('/vendor/bank-details')} />;
  } else {
    statusContent = (
      <FullDashboard
        orders={orders}
        onNavigate={navigate}
      />
    );
  }

  return (
    <div className="relative">
      <VendorShell vendor={vendor} wallet={wallet}>
        {statusContent}
      </VendorShell>

      {/* ── Low-stock sticky bar ── */}
      {low_stock_count > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-[#E2DED8]
                        px-5 py-3 shadow-lg z-40">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-none">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="13" stroke="red" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="12" cy="17" r="1.5" fill="red"/>
              </svg>
            </span>
            <p className="text-navy text-sm font-medium">
              {low_stock_count} product{low_stock_count !== 1 ? 's' : ''} are running low on stock
            </p>
          </div>
          <button
            onClick={() => navigate('/vendor/products')}
            className="text-navy text-sm font-semibold hover:underline ml-6"
          >
            Review Products &gt;
          </button>
        </div>
      )}
    </div>
  );
}

// ── Full dashboard content ────────────────────────────────────────────────────
function FullDashboard({ orders, onNavigate }) {
  return (
    <div className="flex flex-col gap-6 pt-1">

      {/* My Products pill button */}
      <button
        onClick={() => onNavigate('/vendor/products')}
        className="flex items-center gap-3 px-5 py-3 border-2 border-[#D4CFC7]
                   rounded-full bg-cream hover:bg-white transition-colors self-start"
      >
        <BagIcon />
        <span className="text-navy font-semibold text-sm">My Products</span>
      </button>

      {/* New Orders section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="bg-[#C8603A] text-white text-xs font-semibold
                           px-4 py-1.5 rounded-full">
            New Orders
          </span>
          <button
            onClick={() => onNavigate('/vendor/orders')}
            className="text-sm text-[#8A9BB0] hover:text-navy transition-colors"
          >
            View All &gt;
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[#8A9BB0] text-sm">No new orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE8DF]">
            {orders.map(order => (
              <OrderRow key={order.id} order={order} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order, onNavigate }) {
  return (
    <div className="flex items-center gap-3 py-4">
      {/* Bag icon circle */}
      <div className="w-10 h-10 rounded-full bg-[#3D6B4F]/15 flex items-center
                      justify-center flex-none">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
             stroke="#3D6B4F" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </div>

      {/* Order info */}
      <div className="flex-1 min-w-0">
        <p className="text-navy text-sm font-semibold">
          {order.order_ref || `ORD-${String(order.id).slice(0, 6).toUpperCase()}`}
        </p>
        <p className="text-[#8A9BB0] text-xs mt-0.5">{fmtDate(order.created_at)}</p>
      </div>

      {/* Link */}
      <button
        onClick={() => onNavigate(`/vendor/orders/${order.id}`)}
        className="text-[#8A9BB0] text-xs hover:text-navy whitespace-nowrap transition-colors flex-none"
      >
        Order Details &gt;
      </button>
    </div>
  );
}

// ── Status screens ────────────────────────────────────────────────────────────
function UnderReview() {
  return (
    <div className="flex flex-col items-center text-center pt-6 pb-4">
      <div className="mb-5"><ClockIllustration badge="pending" /></div>
      <h2 className="text-xl font-bold text-navy mb-3">Application Under Review</h2>
      <p className="text-sm text-[#8A9BB0] leading-relaxed max-w-xs">
        We've received your application and our team is reviewing it.
        You'll hear from us within 2–3 business days.
      </p>
      <p className="text-xs text-[#A0AAB8] mt-5">
        Questions? Reach us at{' '}
        <a href="mailto:support@bryge.com" className="text-navy underline">
          support@bryge.com
        </a>
      </p>
    </div>
  );
}

function Declined() {
  return (
    <div className="flex flex-col items-center text-center pt-6 pb-4">
      <div className="mb-5"><ClockIllustration badge="declined" /></div>
      <h2 className="text-xl font-bold text-navy mb-3">Your Application was Declined</h2>
      <p className="text-sm text-[#8A9BB0] leading-relaxed max-w-xs">
        After reviewing your application, we're unable to approve your vendor
        account at this time.
      </p>
      <p className="text-xs text-[#A0AAB8] mt-5">
        Questions? Reach us at{' '}
        <a href="mailto:support@bryge.com" className="text-navy underline">
          support@bryge.com
        </a>
      </p>
    </div>
  );
}

function Approved({ onAddBank }) {
  return (
    <div className="flex flex-col items-center text-center pt-6 pb-4">
      <div className="mb-5"><ClockIllustration badge="approved" /></div>
      <h2 className="text-xl font-bold text-navy mb-1">
        Your Application has been Approved
      </h2>
      <p className="text-sm text-[#8A9BB0] mb-6">One Last Step</p>
      <button
        type="button"
        onClick={onAddBank}
        className="bg-navy text-white font-semibold px-8 py-3 rounded-full
                   hover:bg-navy/90 transition-colors"
      >
        Add your bank details
      </button>
    </div>
  );
}

// ── SVG illustrations ─────────────────────────────────────────────────────────
function ClockIllustration({ badge }) {
  const badgeColor = badge === 'approved' ? '#48BB78' : badge === 'declined' ? '#E53E3E' : '#EFB84B';
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="42" fill="#C8603A" opacity="0.12"/>
      <circle cx="50" cy="50" r="34" fill="#C8603A" opacity="0.2"/>
      <circle cx="50" cy="50" r="26" fill="#C8603A"/>
      <line x1="50" y1="50" x2="50" y2="34" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="50" y1="50" x2="60" y2="57" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="50" cy="50" r="3" fill="white"/>
      <circle cx="72" cy="28" r="10" fill={badgeColor}/>
      {badge === 'approved' && (
        <polyline points="67,28 71,32 77,24" stroke="white" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      )}
      {badge === 'declined' && (
        <>
          <line x1="68" y1="24" x2="76" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="76" y1="24" x2="68" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </>
      )}
      {badge === 'pending' && (
        <text x="72" y="32" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">!</text>
      )}
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
         stroke="#1B2F5C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
