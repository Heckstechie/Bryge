import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch]         = useState(searchParams.get('q') || '');
  const [inputVal, setInputVal]     = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab]   = useState(searchParams.get('cat') || 'all');
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

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

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

      {/* ── Body: sidebar + grid ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-7">
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
    </div>
  );
}
