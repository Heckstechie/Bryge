import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/shop/ProductCard';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

function naira(n) { return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`; }

function StarsFull({ rating, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 20 20"
          fill={s <= Math.round(rating) ? '#F5A623' : '#E5E7EB'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z"/>
        </svg>
      ))}
      {count !== undefined && <span className="text-xs text-gray-400 ml-1">({count} Verified Ratings)</span>}
    </div>
  );
}

export default function ProductDetail() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { addToCart }  = useCart();
  const { user }       = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty]           = useState(1);
  const [adding, setAdding]     = useState(false);
  const [addedMsg, setAddedMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(({ data: res }) => { setData(res); setActiveImg(0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Product not found</div>
  );

  const { product, rating_distribution, reviews, related } = data;
  const images = product.images || [];
  const mainImage = images[activeImg]?.url || images[0]?.url || null;

  // Rating bar widths
  const maxCount = Math.max(...(rating_distribution.map((r) => Number(r.count)) || [1]));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* Back link */}
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy mb-6 group">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
          <span className="group-hover:underline">Go to Shop</span>
        </Link>

        {/* ── Main section ── */}
        <div className="grid grid-cols-2 gap-10 mb-12">

          {/* Left: images */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#F7F5F0] mb-3">
              {mainImage
                ? <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">📦</div>
              }
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImg(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors
                      ${i === activeImg ? 'border-navy' : 'border-transparent'}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: product info */}
          <div>
            {/* Category badge */}
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
              {product.category_name}
            </span>

            <h1 className="text-2xl font-bold text-navy mt-3 mb-1">{product.name}</h1>
            <p className="text-2xl font-bold text-navy mb-1">{naira(product.price)}</p>
            <p className="text-xs text-gray-400 mb-4">Shipping calculated at checkout.</p>

            <p className="text-xs font-semibold text-navy tracking-widest mb-2">PRODUCT DETAILS</p>
            {product.short_description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{product.short_description}</p>
            )}

            <StarsFull rating={product.rating} count={product.review_count} />

            {/* Quantity + Add to cart */}
            <div className="mt-5 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center
                             hover:border-navy text-navy font-semibold transition-colors">−</button>
                <span className="text-navy font-semibold w-6 text-center">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock_quantity, q + 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center
                             hover:border-navy text-navy font-semibold transition-colors">+</button>
              </div>
              {addedMsg && (
                <p className="text-green-600 text-sm font-medium text-center py-1">{addedMsg}</p>
              )}
              <button
                disabled={product.stock_quantity === 0 || adding}
                onClick={async () => {
                  if (!user) return navigate('/login');
                  setAdding(true);
                  setAddedMsg('');
                  try {
                    await addToCart(product.id, null, qty);
                    setAddedMsg('Added to cart ✓');
                    setTimeout(() => setAddedMsg(''), 2500);
                  } catch (err) {
                    setAddedMsg(err.response?.data?.message || err.message || 'Could not add to cart');
                  } finally { setAdding(false); }
                }}
                className="w-full bg-navy text-white font-semibold py-3.5 rounded-xl
                           hover:bg-navy-700 active:scale-[0.99] transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide"
              >
                {adding ? 'Adding…' : 'ADD TO CART'}
              </button>
            </div>

            {/* Delivery details */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-semibold text-navy tracking-widest">DELIVERY DETAILS</p>
              <div className="flex gap-3">
                <span className="text-lg mt-0.5">🚚</span>
                <div>
                  <p className="text-xs font-medium text-navy">International door delivery only</p>
                  <p className="text-xs text-gray-500">Estimated: 7–14 business days</p>
                  <p className="text-xs text-gray-500">Shipping fee calculated at checkout</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg mt-0.5">↩️</span>
                <div>
                  <p className="text-xs font-medium text-navy">Returns</p>
                  <p className="text-xs text-gray-500">Return within 7 days of delivery</p>
                  <p className="text-xs text-gray-500">Item must be unused and in original packaging</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg mt-0.5">🔒</span>
                <div>
                  <p className="text-xs font-medium text-navy">Buyer Protection</p>
                  <p className="text-xs text-gray-500">Your payment is held safely until you confirm your order arrived</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        {product.description && (
          <div className="mb-10">
            <p className="text-xs font-semibold text-navy tracking-widest mb-3">DESCRIPTION</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {/* ── Key features + Specs (placeholder when no structured data) ── */}
        {product.tags?.length > 0 && (
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-navy tracking-widest mb-3">KEY FEATURES</p>
              <ul className="space-y-1">
                {product.tags.map((t, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-gray-400">•</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-navy tracking-widest mb-3">SPECIFICATIONS</p>
              <div className="space-y-1 text-sm text-gray-600">
                {product.weight_kg && (
                  <div className="flex gap-4">
                    <span className="text-gray-400 w-20">Weight</span>
                    <span>{product.weight_kg}kg</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        <div className="grid grid-cols-2 gap-10 mb-12">
          {/* Rating summary */}
          <div>
            <p className="text-sm font-semibold text-navy mb-3">
              Verified Ratings ({product.review_count})
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl font-bold text-navy">
                {Number(product.rating).toFixed(1)}
              </span>
              <StarsFull rating={product.rating} size={18} />
            </div>
            {/* Bar chart */}
            <div className="space-y-1.5">
              {[5,4,3,2,1].map((star) => {
                const row = rating_distribution.find((r) => Number(r.rating) === star);
                const count = Number(row?.count || 0);
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-3">{star}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full bg-[#F5A623] rounded-full" />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-navy">
                Comments from Verified Purchases ({product.review_count})
              </p>
              <button className="text-xs text-[#D45B3E] hover:underline">See All →</button>
            </div>
            <div className="space-y-5">
              {reviews.map((r) => (
                <div key={r.id}>
                  <StarsFull rating={r.rating} size={13} />
                  <p className="text-sm text-gray-700 mt-1.5 mb-1">{r.body}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' })}
                    {' '}by {r.first_name} {r.last_name}
                  </p>
                  {r.verified_purchase && (
                    <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 bg-green-600 rounded-full text-white flex items-center justify-center text-[9px]">✓</span>
                      Verified Purchase
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-navy mb-5">Customers who viewed this also viewed</h2>
            <div className="grid grid-cols-5 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
