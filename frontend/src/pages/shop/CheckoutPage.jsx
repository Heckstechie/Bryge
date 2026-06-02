import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

function naira(n) { return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }

const COUNTRIES = ['United States','United Kingdom','Canada','Australia','Germany','France','Nigeria','Other'];

export default function CheckoutPage() {
  const navigate         = useNavigate();
  const location         = useLocation();
  const { refreshCount } = useCart();
  const { user }         = useAuth();

  const coupon         = location.state?.coupon || null;
  const paymentMethod  = location.state?.payment_method || 'paystack';

  const [cart, setCart]       = useState({ items: [], subtotal: 0, shipping_fee: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError]     = useState('');

  const [address, setAddress] = useState({
    first_name: '', last_name: '', email: user?.email || '',
    phone: '', address_line1: '', address_line2: '',
    city: '', state: '', country: 'United States',
  });

  useEffect(() => {
    api.get('/cart')
      .then(({ data }) => {
        if (!data.items?.length) navigate('/cart');
        else setCart(data);
      })
      .catch(() => navigate('/cart'))
      .finally(() => setLoading(false));
  }, [navigate]);

  // Pre-fill from customer profile
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      const profile = data.profile;
      if (profile) {
        setAddress((a) => ({
          ...a,
          first_name: profile.first_name || a.first_name,
          last_name:  profile.last_name  || a.last_name,
          email:      data.user?.email   || a.email,
        }));
      }
    }).catch(() => {});
  }, []);

  function onChange(e) {
    setAddress((a) => ({ ...a, [e.target.name]: e.target.value }));
    setError('');
  }

  const discount       = coupon?.discount || 0;
  const estimatedTotal = Math.max(0, cart.subtotal - discount);

  async function placeOrder(e) {
    e.preventDefault();
    setPlacing(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        shipping_address: address,
        payment_method:   paymentMethod,
        coupon_id:        coupon?.id    || undefined,
        coupon_discount:  coupon?.discount || 0,
      });
      await refreshCount();
      navigate(`/order-confirmation/${data.order_id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-navy">Checkout</h1>
          <button onClick={() => navigate('/cart')}
            className="text-sm text-gray-400 hover:text-navy flex items-center gap-1">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
            </svg>
            Back to cart
          </button>
        </div>
        <hr className="border-gray-200 mb-8" />

        <div className="grid grid-cols-[1fr_380px] gap-10 items-start">

          {/* ── Shipping address form ── */}
          <form onSubmit={placeOrder} id="checkout-form">
            <h2 className="text-base font-bold text-navy mb-5">Shipping Address</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
                  <input name="first_name" value={address.first_name} onChange={onChange}
                    placeholder="Jane" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy
                               focus:outline-none focus:border-navy/50 placeholder-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
                  <input name="last_name" value={address.last_name} onChange={onChange}
                    placeholder="Smith" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy
                               focus:outline-none focus:border-navy/50 placeholder-gray-300" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input type="email" name="email" value={address.email} onChange={onChange}
                  placeholder="jane@example.com" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy
                             focus:outline-none focus:border-navy/50 placeholder-gray-300" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                <input name="phone" value={address.phone} onChange={onChange}
                  placeholder="+1 (415) 555 1234" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy
                             focus:outline-none focus:border-navy/50 placeholder-gray-300" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                <input name="address_line1" value={address.address_line1} onChange={onChange}
                  placeholder="45 Broadway" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy
                             focus:outline-none focus:border-navy/50 placeholder-gray-300 mb-2" />
                <input name="address_line2" value={address.address_line2} onChange={onChange}
                  placeholder="Apartment, suite, etc. (optional)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy
                             focus:outline-none focus:border-navy/50 placeholder-gray-300" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                  <input name="city" value={address.city} onChange={onChange}
                    placeholder="San Francisco" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy
                               focus:outline-none focus:border-navy/50 placeholder-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">State / Province</label>
                  <input name="state" value={address.state} onChange={onChange}
                    placeholder="CA"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy
                               focus:outline-none focus:border-navy/50 placeholder-gray-300" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                <select name="country" value={address.country} onChange={onChange} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy
                             focus:outline-none focus:border-navy/50 appearance-none">
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <div className="pointer-events-none absolute right-4 bottom-3.5 text-gray-400">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Payment method badge */}
            <div className="mt-6 flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              {paymentMethod === 'stripe' ? (
                <>
                  <span className="text-xl">💳</span>
                  <div>
                    <p className="text-xs font-semibold text-navy">Paying with Stripe (USD)</p>
                    <p className="text-xs text-gray-400">Amount will be converted at current exchange rate</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xl">🏦</span>
                  <div>
                    <p className="text-xs font-semibold text-navy">Paying with Paystack (₦ NGN)</p>
                    <p className="text-xs text-gray-400">Secure Nigerian payment gateway</p>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}
          </form>

          {/* ── Order summary (right panel, same as cart) ── */}
          <div className="sticky top-6">
            <h2 className="text-base font-bold text-navy mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-5">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#F7F5F0] rounded-lg overflow-hidden flex-shrink-0">
                    {item.primary_image
                      ? <img src={item.primary_image} alt={item.product_name}
                          className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-navy truncate">{item.product_name}</p>
                    {item.variant_value && (
                      <p className="text-xs text-gray-400">{item.variant_name}: {item.variant_value}</p>
                    )}
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold text-[#2E6B4F] flex-shrink-0">{naira(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <hr className="border-gray-200 mb-4" />

            {/* Totals */}
            <div className="space-y-2.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-[#2E6B4F]">{naira(cart.subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount ({coupon?.code})</span>
                  <span className="font-medium text-green-600">−{naira(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-[#2E6B4F]">{naira(cart.shipping_fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 italic text-xs">Estimated sales tax+</span>
              </div>
            </div>

            <hr className="border-gray-200 mb-4" />

            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-navy">Estimated Cost</span>
              <span className="font-bold text-[#2E6B4F] text-xl">{naira(estimatedTotal)}</span>
            </div>

            <button
              type="submit" form="checkout-form"
              disabled={placing}
              className="w-full bg-[#1A2B3C] text-white font-semibold py-4 rounded-xl
                         hover:bg-navy-800 active:scale-[0.99] transition-all tracking-wider
                         disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {placing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />
                  Processing…
                </span>
              ) : (
                `PLACE ORDER — ${naira(estimatedTotal)}`
              )}
            </button>

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              By continuing, I confirm that I have read and accept the{' '}
              <a href="#" className="text-navy font-semibold hover:underline">Terms and Conditions</a>
              {' '}and the{' '}
              <a href="#" className="text-navy font-semibold hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
