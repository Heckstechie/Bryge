import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../../components/shop/ProductCard';
import FilterSidebar from '../../components/shop/FilterSidebar';
import api from '../../services/api';

const PRICE_RANGE_MAP = {
  '0-5000':    { min_price: 0,     max_price: 5000  },
  '5000-10000':{ min_price: 5000,  max_price: 10000 },
  '10000-15000':{ min_price:10000, max_price: 15000 },
  '15000-20000':{ min_price:15000, max_price: 20000 },
  '20000-25000':{ min_price:20000, max_price: 25000 },
  '25000-30000':{ min_price:25000, max_price: 30000 },
};

function ShopHome({ categories }) {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="bg-[#F5F1E8] py-16 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80" 
              alt="Hero" 
              className="w-full h-auto rounded-[2rem] object-cover"
            />
          </div>
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-navy leading-tight">
              We Left Home. But Home Doesn't Have to Leave You.
            </h1>
            <p className="text-base text-[#65717D] leading-relaxed max-w-md">
              Discover authentic Nigerian products shipped globally. Verified vendors, escrow protection, and seamless cross-border logistics.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/shop?cat=all" className="inline-flex items-center rounded-full bg-[#953F10] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#7a3209] transition">
                Shop Now
              </Link>
              <Link to="/shop?cat=all" className="inline-flex items-center rounded-full border-2 border-navy bg-transparent px-8 py-3.5 text-sm font-semibold text-navy hover:bg-navy/5 transition">
                Browse
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive You, Every Step of the Way */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-navy mb-3">Interactive You, Every Step of the Way</h2>
            <p className="text-base text-[#65717D]">Your journey matters. We guide you from browse to delivery.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Browse & Select', desc: 'Find authentic products from verified vendors', color: 'bg-[#953F10]' },
              { label: 'Secure Checkout', desc: 'Escrow-backed payment protection', color: 'bg-[#6B8F74]' },
              { label: 'Track & Monitor', desc: 'Real-time order and delivery updates', color: 'bg-[#7D5A3E]' },
              { label: 'Receive & Review', desc: 'Delivered safely, then rate your experience', color: 'bg-[#1E3A5F]' },
            ].map((item) => (
              <div key={item.label} className={`${item.color} text-white rounded-[2rem] p-8`}>
                <h3 className="text-lg font-bold mb-3">{item.label}</h3>
                <p className="text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curated Collection - Room Blessing */}
      <section className="bg-[#F5F1E8] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-navy mb-2">Curated Collection</h2>
            <p className="text-base text-[#65717D]">Room Blessing</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              'https://images.unsplash.com/photo-1578500494198-246f612d03b3?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1495195134817-aeb325ef3c61?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1518611505868-48510c2e00f7?auto=format&fit=crop&w=400&q=80',
            ].map((img, i) => (
              <div key={i} className="rounded-[1.5rem] overflow-hidden bg-white aspect-square">
                <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#7D5A3E] text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-base opacity-90">Three simple steps to get what you've been missing</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Browse Verified Vendors', desc: 'Explore authentic Nigerian products from trusted sellers' },
              { num: '2', title: 'Secure Payment', desc: 'Your funds are held in escrow until delivery' },
              { num: '3', title: 'Global Shipping', desc: 'We handle cross-border logistics seamlessly' },
              { num: '4', title: 'Track Your Order', desc: 'Real-time updates from warehouse to doorstep' },
              { num: '5', title: 'Receive & Confirm', desc: 'Payment released to vendor upon safe delivery' },
              { num: '6', title: 'Leave a Review', desc: 'Share your experience and help other customers' },
            ].map((item) => (
              <div key={item.num} className="bg-white/10 rounded-[1.5rem] p-6">
                <div className="text-4xl font-bold mb-3 opacity-50">{item.num}</div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What People Are Ordering Right Now */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-navy mb-3">What People Are Ordering Right Now</h2>
            <p className="text-base text-[#65717D]">Trending products from the Bryge community</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Fabrics & Textiles', icon: '🧵' },
              { name: 'Beauty & Skincare', icon: '✨' },
              { name: 'Foodstuff & Spices', icon: '🌿' },
              { name: 'Home & Accessories', icon: '🏠' },
            ].map((item) => (
              <div key={item.name} className="text-center">
                <div className="text-6xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-navy mb-3">{item.name}</h3>
                <Link to="/shop?cat=all" className="inline-flex items-center rounded-full bg-[#953F10] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#7a3209] transition">
                  Explore
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Bryge */}
      <section className="bg-[#F5F1E8] py-16 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-navy">Why Choose Bryge?</h2>
            <p className="text-base text-[#65717D]">We're not just a marketplace—we're a bridge between you and home.</p>
            <ul className="space-y-4">
              {[
                'Verified seller network ensures product authenticity',
                'Escrow payment system protects both buyers and sellers',
                'Global shipping from Nigeria to 50+ countries',
                'Local Naira payouts for Nigerian vendors',
                'Real-time order tracking and customer support',
                'Dispute resolution and buyer protection guarantee',
              ].map((item) => (
                <li key={item} className="flex gap-3 items-start">
                  <span className="text-[#953F10] font-bold mt-1">✓</span>
                  <span className="text-base text-[#65717D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" 
              alt="Why Bryge" 
              className="w-full h-auto rounded-[2rem] object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#1E3A5F] text-white py-16 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Your Products Deserve a Global Reach</h2>
            <p className="text-base leading-relaxed opacity-90">
              Are you a Nigerian vendor? Join thousands of sellers already shipping globally through Bryge. Reach diaspora customers with confidence.
            </p>
            <Link to="/auth/vendor-register" className="inline-flex items-center rounded-full bg-[#953F10] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#7a3209] transition">
              Become a Vendor
            </Link>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80" 
              alt="Vendor" 
              className="w-full h-auto rounded-[2rem] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-cover bg-center py-20 px-6 relative" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80)'}}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <h2 className="text-4xl font-bold text-white">Haven is Where the Heart Is</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Whether you're buying authentic Nigerian goods or selling to a global audience, Bryge is your home on the internet.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/shop?cat=all" className="inline-flex items-center rounded-full bg-[#953F10] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#7a3209] transition">
              Start Shopping
            </Link>
            <Link to="/auth/vendor-register" className="inline-flex items-center rounded-full border-2 border-white bg-transparent px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition">
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch]         = useState(searchParams.get('q') || '');
  const [inputVal, setInputVal]     = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab]   = useState(searchParams.get('cat') || 'home');
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({
    categories: [], priceRanges: [], rating: null, page: 1,
  });

  // Load categories
  useEffect(() => {
    api.get('/categories/with-counts')
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // Fetch products whenever filters / tab / search change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 16 };

      if (search)           params.search   = search;
      if (filters.rating)   params.rating   = filters.rating;

      // Category from tab OR from filter checkboxes (tab takes priority)
      if (activeTab !== 'all' && activeTab !== 'home') {
        params.category = activeTab;
      } else if (filters.categories.length === 1) {
        params.category = filters.categories[0];
      }

      // Price: if multiple ranges selected, use the outer bounds
      if (filters.priceRanges.length) {
        const ranges = filters.priceRanges.map((k) => PRICE_RANGE_MAP[k]).filter(Boolean);
        params.min_price = Math.min(...ranges.map((r) => r.min_price));
        params.max_price = Math.max(...ranges.map((r) => r.max_price));
      }

      const { data } = await api.get('/products', { params });
      setProducts(data.products || []);
      setPagination(data.pagination || {});
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, filters]);

  useEffect(() => {
    if (activeTab !== 'home') {
      fetchProducts();
    }
  }, [fetchProducts, activeTab]);

  function handleSearch(e) {
    e.preventDefault();
    setSearch(inputVal);
    setFilters((f) => ({ ...f, page: 1 }));
  }

  function clearFilters() {
    setFilters({ categories: [], priceRanges: [], rating: null, page: 1 });
    setSearch('');
    setInputVal('');
    setActiveTab('all');
  }

  // Top category tabs from DB (top-level only) + Home/All prepended
  const topCats = categories.filter((c) => !c.parent_id);
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'all',  label: 'All'  },
    ...topCats.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Search bar ── */}
      <div className="border-b border-gray-100 py-4 px-6">
        <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-5xl mx-auto">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              type="text" placeholder="Search Products"
              value={inputVal} onChange={(e) => setInputVal(e.target.value)}
              className="w-full border border-gray-200 rounded-full pl-9 pr-4 py-2.5 text-sm
                         text-navy placeholder-gray-400 focus:outline-none focus:border-navy/50"
            />
          </div>
          <button type="submit"
            className="bg-navy text-white text-sm font-medium px-6 py-2.5 rounded-full
                       hover:bg-navy-700 transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* ── Category tabs ── */}
      <div className="border-b border-gray-100 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-8 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFilters((f) => ({ ...f, page: 1 })); }}
              className={`py-3 text-sm whitespace-nowrap transition-colors relative font-medium
                ${activeTab === tab.id
                  ? 'text-[#D45B3E]'
                  : 'text-gray-500 hover:text-navy'}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D45B3E] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body: sidebar + grid/home ── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'home' ? (
          <ShopHome categories={categories} />
        ) : (
          <div className="flex gap-7">
            <FilterSidebar
              categories={categories}
              filters={filters}
              onChange={setFilters}
              onClear={clearFilters}
              totalCount={pagination.total}
            />

            {/* Grid */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-2xl animate-pulse aspect-square" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24 text-gray-400">
                  <p className="text-lg font-medium mb-1">No products found</p>
                  <p className="text-sm">Try adjusting your filters or search term</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    {products.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                        <button key={p}
                          onClick={() => setFilters((f) => ({ ...f, page: p }))}
                          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors
                            ${filters.page === p
                              ? 'bg-navy text-white'
                              : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
