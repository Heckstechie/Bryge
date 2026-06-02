import { useState } from 'react';
import { Link } from 'react-router-dom';

function naira(n) {
  return `₦${Number(n).toLocaleString('en-NG')}`;
}

function Stars({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width="11" height="11" viewBox="0 0 20 20" fill={s <= Math.round(rating) ? '#F5A623' : '#E5E7EB'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z"/>
        </svg>
      ))}
      <span className="text-xs text-gray-400 ml-0.5">({count})</span>
    </div>
  );
}

export default function ProductCard({ product }) {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <Link
      to={`/shop/product/${product.id}`}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100
                 hover:shadow-md transition-shadow duration-200 block"
    >
      {/* Wishlist button */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setWishlisted((v) => !v); }}
        className="absolute top-3 right-3 z-10 text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg width="18" height="18" fill={wishlisted ? '#EF4444' : 'none'} viewBox="0 0 24 24"
          stroke={wishlisted ? '#EF4444' : 'currentColor'} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
        </svg>
      </button>

      {/* Image */}
      <div className="aspect-square bg-[#F7F5F0] flex items-center justify-center overflow-hidden">
        {product.primary_image ? (
          <img
            src={product.primary_image} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-gray-300">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-3">
        <p className="text-xs text-gray-400 mb-0.5">{product.category_name}</p>
        <p className="text-sm text-navy font-medium leading-tight line-clamp-2 mb-1">{product.name}</p>
        <p className="text-base font-bold text-navy">{naira(product.price)}</p>
        <p className="text-xs text-gray-500 mb-1.5">
          {product.stock_quantity > 0
            ? `${product.stock_quantity} Available In Stock`
            : <span className="text-red-500">Out of Stock</span>}
        </p>
        <Stars rating={product.rating} count={product.review_count} />
      </div>
    </Link>
  );
}
