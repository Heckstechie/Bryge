const PRICE_RANGES = [
  { label: '₦0 – ₦5,000',       min: 0,     max: 5000  },
  { label: '₦5,000 – ₦10,000',  min: 5000,  max: 10000 },
  { label: '₦10,000 – ₦15,000', min: 10000, max: 15000 },
  { label: '₦15,000 – ₦20,000', min: 15000, max: 20000 },
  { label: '₦20,000 – ₦25,000', min: 20000, max: 25000 },
  { label: '₦25,000 – ₦30,000', min: 25000, max: 30000 },
];

const RATINGS = [4.5, 4.0, 3.5, 3.0];

function Stars({ n }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width="12" height="12" viewBox="0 0 20 20"
          fill={s <= Math.floor(n) || (s === Math.ceil(n) && n % 1 >= 0.5) ? '#F5A623' : '#E5E7EB'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z"/>
        </svg>
      ))}
    </span>
  );
}

export default function FilterSidebar({ categories, filters, onChange, onClear, totalCount }) {
  const [showAllCats, setShowAllCats] = useState(false);
  const topCats = categories.filter((c) => !c.parent_id);
  const visible = showAllCats ? topCats : topCats.slice(0, 5);

  function toggleCategory(id) {
    const current = filters.categories || [];
    onChange({
      ...filters,
      categories: current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
      page: 1,
    });
  }

  function togglePrice(range) {
    const key = `${range.min}-${range.max}`;
    const current = filters.priceRanges || [];
    onChange({
      ...filters,
      priceRanges: current.includes(key) ? current.filter((p) => p !== key) : [...current, key],
      page: 1,
    });
  }

  function setRating(r) {
    onChange({ ...filters, rating: filters.rating === r ? null : r, page: 1 });
  }

  return (
    <aside className="w-60 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-navy text-sm">Filter</span>
          <button onClick={onClear} className="text-xs text-[#D45B3E] font-medium hover:underline">
            Clear All
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">{totalCount?.toLocaleString() || 0}+ Products</p>
        <hr className="border-gray-100 mb-4" />

        {/* Category */}
        <Section title="Category">
          {visible.map((cat) => (
            <label key={cat.id} className="flex items-center justify-between cursor-pointer group py-0.5">
              <div className="flex items-center gap-2">
                <input type="checkbox"
                  checked={(filters.categories || []).includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="accent-navy w-3.5 h-3.5 rounded"
                />
                <span className="text-sm text-gray-600 group-hover:text-navy">{cat.name}</span>
              </div>
              <span className="text-xs text-gray-400">({cat.product_count || 0})</span>
            </label>
          ))}
          {topCats.length > 5 && (
            <button onClick={() => setShowAllCats((v) => !v)}
              className="text-xs text-[#D45B3E] font-medium mt-2 hover:underline">
              {showAllCats ? 'Show less' : 'Show more'}
            </button>
          )}
        </Section>

        <hr className="border-gray-100 my-4" />

        {/* Ratings */}
        <Section title="Ratings">
          {RATINGS.map((r) => (
            <label key={r} className="flex items-center justify-between cursor-pointer group py-0.5">
              <div className="flex items-center gap-2">
                <input type="radio" name="rating"
                  checked={filters.rating === r}
                  onChange={() => setRating(r)}
                  className="accent-navy w-3.5 h-3.5"
                />
                <Stars n={r} />
                <span className="text-xs text-gray-500">{r} & up</span>
              </div>
            </label>
          ))}
        </Section>

        <hr className="border-gray-100 my-4" />

        {/* Price */}
        <Section title="Price">
          {PRICE_RANGES.map((range) => {
            const key = `${range.min}-${range.max}`;
            return (
              <label key={key} className="flex items-center justify-between cursor-pointer group py-0.5">
                <div className="flex items-center gap-2">
                  <input type="checkbox"
                    checked={(filters.priceRanges || []).includes(key)}
                    onChange={() => togglePrice(range)}
                    className="accent-navy w-3.5 h-3.5 rounded"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-navy">{range.label}</span>
                </div>
              </label>
            );
          })}
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3">
        <span className="font-semibold text-navy text-sm">{title}</span>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          className={`transition-transform ${open ? '' : 'rotate-180'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 15 7-7 7 7"/>
        </svg>
      </button>
      {open && <div className="space-y-1">{children}</div>}
    </div>
  );
}

// useState needs to be imported — add it here since this file uses it
import { useState } from 'react';
