import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

function naira(n) {
  return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function LabelValue({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
      <span className="font-semibold text-navy">{label}</span>
      <span className="text-gray-600">{value}</span>
    </div>
  );
}

export default function OrderConfirmation() {
  const { id }           = useParams();
  const navigate         = useNavigate();
  const [data, setData]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data: res }) => setData(res))
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { order, vendor_orders } = data;
  const addr   = order.shipping_address || {};

  // Flatten all order items from all vendor sub-orders
  const allItems = (vendor_orders || []).flatMap((vo) => vo.items || []);

  // Payment method display
  const payLabel = order.gateway === 'stripe'
    ? 'Stripe'
    : (order.gateway_response?.card_type
        ? order.gateway_response.card_type.charAt(0).toUpperCase() + order.gateway_response.card_type.slice(1)
        : 'Paystack');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-[1fr_500px] gap-16 items-start">

          {/* ── Left: Thank you + billing ── */}
          <div>
            <h1 className="text-4xl font-bold text-navy leading-tight mb-5">
              Thank you for your<br />purchase!
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-10 max-w-sm">
              Your order will be processed within 24 hours during working days.
              We will notify you by email once your order has been shipped.
            </p>

            {/* Billing address */}
            <div className="mb-10">
              <h2 className="font-bold text-navy mb-4">Billing Address</h2>
              <div className="space-y-3">
                <LabelValue
                  label="Name"
                  value={`${addr.first_name || ''} ${addr.last_name || ''}`.trim()}
                />
                <LabelValue
                  label="Address"
                  value={[addr.address_line1, addr.address_line2, addr.city, addr.country]
                    .filter(Boolean).join(', ')}
                />
                <LabelValue label="Phone" value={addr.phone || '—'} />
                <LabelValue label="Email"  value={addr.email || '—'} />
              </div>
            </div>

            {/* Track button */}
            <button
              onClick={() => navigate(`/orders/${id}`)}
              className="bg-navy text-white font-semibold px-8 py-3.5 rounded-xl
                         hover:bg-navy-700 active:scale-[0.99] transition-all text-sm"
            >
              Track Your Order
            </button>

            <div className="mt-6">
              <Link to="/shop" className="text-sm text-gray-400 hover:text-navy underline">
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* ── Right: Order summary card ── */}
          <div className="bg-[#F3F4F6] rounded-2xl p-7">
            <h2 className="font-bold text-navy text-base mb-6">Order Summary</h2>

            {/* Meta row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Date</p>
                <p className="text-sm font-bold text-navy">{fmtDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Order Number</p>
                <p className="text-sm font-bold text-navy">{order.order_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Payment Method</p>
                <p className="text-sm font-bold text-navy capitalize">{payLabel}</p>
              </div>
            </div>

            <hr className="border-gray-300 mb-5" />

            {/* Items */}
            <div className="space-y-4 mb-6">
              {allItems.map((item) => {
                const variant = item.variant_details
                  ? (typeof item.variant_details === 'string'
                      ? JSON.parse(item.variant_details)
                      : item.variant_details)
                  : null;
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                      {item.product_image
                        ? <img src={item.product_image} alt={item.product_name}
                            className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{item.product_name}</p>
                      {variant && (
                        <p className="text-xs text-gray-500">{variant.name}: {variant.value}</p>
                      )}
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-navy flex-shrink-0">
                      {naira(item.total_price_ngn)}
                    </p>
                  </div>
                );
              })}
            </div>

            <hr className="border-gray-300 mb-5" />

            {/* Totals */}
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-navy font-medium">{naira(order.subtotal_ngn)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping Costs</span>
                <span className="text-navy font-medium">{naira(order.shipping_fee_ngn)}</span>
              </div>
              {Number(order.discount_ngn) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600 font-medium">−{naira(order.discount_ngn)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 italic text-xs">Estimated sales tax+</span>
              </div>
            </div>

            <hr className="border-gray-300 mb-5" />

            <div className="flex justify-between items-center">
              <span className="font-bold text-navy">Order Total</span>
              <span className="font-bold text-navy text-xl">{naira(order.total_ngn)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
