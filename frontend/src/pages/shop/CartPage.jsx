import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

function naira(n) { return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }

export default function CartPage() {
  const navigate           = useNavigate();
  const { refreshCount }   = useCart();
  const [cart, setCart]    = useState({ items: [], subtotal: 0, shipping_fee: 0, total: 0 });
  const [loading, setLoading]         = useState(true);
  const [promoCode, setPromoCode]     = useState('');
  const [coupon, setCoupon]           = useState(null);
  const [promoError, setPromoError]   = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [updating, setUpdating]       = useState(null);

  async function fetchCart() {
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch { setCart({ items: [], subtotal: 0, shipping_fee: 0, total: 0 }); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchCart(); }, []);

  async function changeQty(itemId, newQty) {
    setUpdating(itemId);
    try {
      const { data } = await api.put(`/cart/${itemId}`, { quantity: newQty });
      setCart(data);
      refreshCount();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update quantity');
    } finally { setUpdating(null); }
  }

  async function removeItem(itemId) {
    setUpdating(itemId);
    try {
      const { data } = await api.delete(`/cart/${itemId}`);
      setCart(data);
      refreshCount();
    } finally { setUpdating(null); }
  }

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    setPromoError('');
    try {
      const { data } = await api.post('/cart/apply-coupon', { code: promoCode.trim() });
      setCoupon({ ...data.coupon, discount: data.discount });
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Invalid promo code');
      setCoupon(null);
    } finally { setApplyingPromo(false); }
  }

  const discount      = coupon?.discount || 0;
  const estimatedTotal = Math.max(0, cart.subtotal - discount);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-navy">Shopping Cart</h1>
          {cart.items.length > 0 && (
            <span className="text-sm text-gray-400 font-medium">
              {cart.items.length} Product{cart.items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <hr className="border-gray-200 mb-8" />

        {cart.items.length === 0 ? (
          /* Empty state */
          <div className="text-center py-24">
            <p className="text-xl font-semibold text-navy mb-2">Your cart is empty</p>
            <p className="text-sm text-gray-400 mb-8">Discover authentic Nigerian products</p>
            <Link to="/shop" className="btn-primary inline-block px-10">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_380px] gap-10 items-start">

            {/* ── Cart items ── */}
            <div className="space-y-5">
              {cart.items.map((item) => (
                <div key={item.id}
                  className={`border border-gray-200 rounded-xl flex gap-5 p-4 transition-opacity
                    ${updating === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* Image */}
                  <Link to={`/shop/product/${item.product_id}`}
                    className="w-28 h-28 flex-shrink-0 bg-[#F7F5F0] rounded-lg overflow-hidden">
                    {item.primary_image
                      ? <img src={item.primary_image} alt={item.product_name}
                          className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
                    }
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy text-base mb-1">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-sm text-gray-500">
                        {item.variant_name}: <span className="font-bold text-navy">{item.variant_value}</span>
                      </p>
                    )}
                    {/* Quantity pill */}
                    <div className="flex items-center gap-0 mt-3">
                      <button
                        onClick={() => changeQty(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center
                                   text-navy font-semibold hover:border-navy disabled:opacity-30 text-sm"
                      >−</button>
                      <span className="w-10 text-center text-sm font-semibold text-navy">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => changeQty(item.id, item.quantity + 1)}
                        className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center
                                   text-navy font-semibold hover:border-navy text-sm"
                      >+</button>
                    </div>
                  </div>

                  {/* Price + Remove */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[#2E6B4F] text-base">
                      {naira(item.subtotal)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-gray-400 hover:text-red-500 mt-1 transition-colors"
                    >
                      Remove ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Order summary panel ── */}
            <div className="sticky top-6">
              {/* Free shipping banner */}
              <div className="bg-[#E8F0EB] rounded-xl flex items-center gap-3 px-4 py-3 mb-4">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#3D6B4F" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                </svg>
                <span className="text-xs font-semibold text-[#3D6B4F] tracking-wide uppercase">
                  This item qualifies for free shipping
                </span>
              </div>

              {/* Promo code */}
              <div className="mb-5">
                {coupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200
                                  rounded-xl px-4 py-2.5">
                    <span className="text-xs font-semibold text-green-700">
                      {coupon.code} applied — −{naira(coupon.discount)}
                    </span>
                    <button onClick={() => { setCoupon(null); setPromoCode(''); }}
                      className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="Apply a promocode"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                      className="flex-1 text-center text-sm text-gray-400 placeholder-gray-300
                                 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none
                                 focus:border-navy/40 focus:text-navy"
                    />
                    <button onClick={applyPromo} disabled={applyingPromo || !promoCode.trim()}
                      className="text-xs font-semibold text-navy border border-navy rounded-xl px-3
                                 disabled:opacity-40 hover:bg-navy hover:text-white transition-colors">
                      Apply
                    </button>
                  </div>
                )}
                {promoError && <p className="text-red-500 text-xs mt-1 text-center">{promoError}</p>}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-[#2E6B4F]">{naira(cart.subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-medium text-green-600">−{naira(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping Costs</span>
                  <span className="font-medium text-[#2E6B4F]">{naira(cart.shipping_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 italic">Estimated sales tax+</span>
                </div>
              </div>

              <hr className="border-gray-200 mb-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-navy text-base">Estimated Cost</span>
                <span className="font-bold text-[#2E6B4F] text-xl">{naira(estimatedTotal)}</span>
              </div>

              {/* CTA buttons */}
              <button
                onClick={() => navigate('/checkout', {
                  state: { coupon: coupon || null }
                })}
                className="w-full bg-[#1A2B3C] text-white font-semibold py-4 rounded-xl
                           hover:bg-navy-800 active:scale-[0.99] transition-all tracking-wider mb-3"
              >
                CHECKOUT
              </button>
              <button
                onClick={() => navigate('/checkout', {
                  state: { coupon: coupon || null, payment_method: 'stripe' }
                })}
                className="w-full border-2 border-[#1A2B3C] text-[#1A2B3C] font-semibold py-4 rounded-xl
                           hover:bg-gray-50 active:scale-[0.99] transition-all tracking-wider mb-4"
              >
                CONTINUE WITH STRIPE
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                By continuing, I confirm that I have read and accept the{' '}
                <a href="#" className="text-navy font-semibold hover:underline">Terms and Conditions</a>
                {' '}and the{' '}
                <a href="#" className="text-navy font-semibold hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
