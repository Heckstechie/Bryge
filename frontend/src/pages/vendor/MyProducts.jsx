import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function naira(n) { return `₦${Number(n).toLocaleString('en-NG')}`; }

const TABS = [
  { key: 'all',          label: 'All'          },
  { key: 'active',       label: 'Active'       },
  { key: 'out_of_stock', label: 'Out of Stock' },
  { key: 'inactive',     label: 'Inactive'     },
];

// Status badge: label + tailwind classes
const STATUS_BADGE = {
  active:       { label: 'Active',       cls: 'bg-[#3D6B4F] text-white'       },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-[#8A9BB0] text-white'       },
  suspended:    { label: 'Inactive',     cls: 'bg-[#A0AAB8] text-white'       },
  inactive:     { label: 'Inactive',     cls: 'bg-[#A0AAB8] text-white'       },
  draft:        { label: 'Draft',        cls: 'bg-amber-400 text-white'        },
};

export default function MyProducts() {
  const navigate = useNavigate();
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (search)              params.search  = search;
      const { data } = await api.get('/products/vendor/mine', { params });
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function toggle(product) {
    // Can't toggle out-of-stock
    if (product.status === 'out_of_stock') return;
    setToggling(product.id);
    try {
      const { data } = await api.patch(`/products/${product.id}/toggle`);
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, status: data.status } : p)
      );
    } catch { /* silent */ }
    finally { setToggling(null); }
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Header ── */}
      <div className="bg-cream px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate(-1)}
                  className="p-1 text-navy hover:text-navy/70 transition-colors">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M15.75 19.5 8.25 12l7.5-7.5"/>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-navy">My Products</h1>
          <button onClick={() => navigate('/vendor/products/add')}
                  className="p-1 text-navy hover:text-navy/70 transition-colors">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
          </button>
        </div>

        {/* Search — pill shape */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C0BAB2]">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
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

      {/* ── Product list ── */}
      <div className="px-4 pb-10">
        {loading ? (
          <div className="space-y-3 mt-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-navy font-medium mb-1">No products found</p>
            <p className="text-[#8A9BB0] text-sm">
              {activeTab === 'all' ? 'Tap + to add your first product' : `No ${activeTab.replace('_', ' ')} products`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden mt-3
                          divide-y divide-[#F0EBE2]">
            {products.map(product => {
              const badge     = STATUS_BADGE[product.status] || STATUS_BADGE.draft;
              const isActive  = product.status === 'active';
              const canToggle = product.status !== 'out_of_stock';

              return (
                <div key={product.id}
                     className="flex items-center gap-3 px-4 py-4
                                hover:bg-[#FAF8F4] transition-colors">

                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-[#F0EBE2] overflow-hidden flex-none">
                    {product.primary_image
                      ? <img src={product.primary_image} alt={product.name}
                             className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    }
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0 cursor-pointer"
                       onClick={() => navigate(`/vendor/products/edit/${product.id}`)}>
                    <p className="text-sm font-semibold text-navy leading-snug truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#8A9BB0] mt-0.5">
                      Category: {product.category_name || '—'}
                    </p>
                    <p className="text-xs text-[#8A9BB0] mt-0.5">
                      Price: {naira(product.price)}{' '}
                      <span className="text-[#C0BAB2] mx-1">·</span>
                      Stock: {product.stock_quantity}
                    </p>
                    <span className={`inline-block text-[10px] font-semibold
                                     px-2.5 py-0.5 rounded-md mt-1.5 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Toggle switch */}
                  <button
                    type="button"
                    disabled={!canToggle || toggling === product.id}
                    onClick={() => toggle(product)}
                    aria-label={isActive ? 'Deactivate' : 'Activate'}
                    className={`relative w-12 h-6 rounded-full flex-none transition-colors
                                duration-200 focus:outline-none ${
                      !canToggle ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    } ${isActive ? 'bg-[#3D6B4F]' : 'bg-[#C0BAB2]'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow
                                     transition-transform duration-200 ${
                      isActive ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
