import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const MAX_IMAGES = 5;

// ── Shared input styles ────────────────────────────────────────────────────────
const pillInput = `w-full bg-white border border-[#E2DED8] rounded-full
  px-5 py-3.5 text-navy text-sm placeholder-[#C0BAB2]
  focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy/30
  transition-all`;

const pillSelect = `w-full appearance-none bg-white border border-[#E2DED8] rounded-full
  px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/15
  focus:border-navy/30 transition-all`;

export default function AddProduct() {
  const { id }   = useParams();
  const isEdit   = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories]     = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [commission, setCommission]     = useState(null); // { rate, category_name }

  const [form, setForm] = useState({
    name: '', category_id: '', sub_category_id: '',
    price: '', stock_quantity: '', description: '', weight_kg: '',
  });

  const [previews, setPreviews]           = useState([]); // {url, file, serverId}
  const [dragging, setDragging]           = useState(false);
  const [loading, setLoading]             = useState(false);
  const [fetchLoading, setFetchLoading]   = useState(isEdit);
  const [error, setError]                 = useState('');
  const fileRef = useRef();

  // Load categories
  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // On category change → sub-categories + commission hint
  useEffect(() => {
    if (!form.category_id) {
      setSubCategories([]);
      setCommission(null);
      return;
    }
    const parent = categories.find(c => c.id === form.category_id);
    setSubCategories(parent?.sub_categories || []);
    setForm(f => ({ ...f, sub_category_id: '' }));
    setCommission({
      rate:          parent?.commission_rate ?? 10,
      category_name: parent?.name || '',
    });
  }, [form.category_id, categories]);

  // Load existing product on edit
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/vendor/mine/${id}`)
      .then(({ data }) => {
        const p = data.product;
        setForm({
          name:            p.name            || '',
          category_id:     p.category_id     || '',
          sub_category_id: '',
          price:           p.price           || '',
          stock_quantity:  p.stock_quantity  || '',
          description:     p.description     || '',
          weight_kg:       p.weight_kg       || '',
        });
        setPreviews((p.images || []).map(img => ({
          url: img.url, file: null, serverId: img.id,
        })));
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setFetchLoading(false));
  }, [id, isEdit]);

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  function addFiles(files) {
    const allowed = Array.from(files).slice(0, MAX_IMAGES - previews.length);
    if (!allowed.length) return;
    setPreviews(p => [
      ...p,
      ...allowed.map(file => ({ url: URL.createObjectURL(file), file, serverId: null })),
    ]);
  }

  function removePreview(index) {
    const item = previews[index];
    if (item.url?.startsWith('blob:')) URL.revokeObjectURL(item.url);
    setPreviews(p => p.filter((_, i) => i !== index));
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const categoryId = form.sub_category_id || form.category_id;
      let productId    = id;

      if (!isEdit) {
        const { data } = await api.post('/products', {
          name:           form.name,
          category_id:    categoryId,
          price:          form.price,
          stock_quantity: form.stock_quantity,
          description:    form.description,
          weight_kg:      form.weight_kg || undefined,
        });
        productId = data.product.id;
      } else {
        await api.put(`/products/${id}`, {
          name:           form.name,
          category_id:    categoryId,
          price:          form.price,
          stock_quantity: form.stock_quantity,
          description:    form.description,
          weight_kg:      form.weight_kg || undefined,
        });
      }

      const newFiles = previews.filter(p => p.file).map(p => p.file);
      if (newFiles.length && productId) {
        const fd = new FormData();
        newFiles.forEach(f => fd.append('images', f));
        await api.post(`/products/${productId}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/vendor/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-4 flex items-center">
        <button onClick={() => navigate(-1)}
                className="p-1 text-navy hover:text-navy/70 transition-colors flex-none">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-navy">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
        {/* spacer to keep title truly centred */}
        <span className="w-8" />
      </div>

      <form onSubmit={onSubmit} className="px-4 pb-12 space-y-3.5">

        {/* ── Upload drop zone ── */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl py-8 flex flex-col items-center
                      justify-center cursor-pointer transition-colors select-none ${
            dragging
              ? 'border-navy bg-navy/5'
              : 'border-[#D4CFC7] bg-white hover:border-navy/40'
          }`}
        >
          <CameraIcon />
          <p className="text-sm text-navy/60 mt-2">
            <span className="text-blue-600 font-medium">Click here</span>
            {' '}to upload or drop files here
          </p>
        </div>

        <p className="text-xs text-center text-[#A0AAB8]">
          Up to {MAX_IMAGES} photos · First photo is your cover image
        </p>

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
               onChange={e => addFiles(e.target.files)} />

        {/* ── Photo thumbnails strip ── */}
        {previews.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {previews.map((p, i) => (
              <div key={i}
                   className="relative flex-none w-20 h-20 rounded-xl overflow-hidden bg-[#F0EBE2]">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                {/* Red × button */}
                <button type="button" onClick={e => { e.stopPropagation(); removePreview(i); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full
                             flex items-center justify-center shadow">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                       stroke="white" strokeWidth={3.5} strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[8px] bg-navy/80
                                   text-white px-1.5 py-0.5 rounded-full leading-none">
                    Cover
                  </span>
                )}
              </div>
            ))}
            {/* Add more slot */}
            {previews.length < MAX_IMAGES && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex-none w-20 h-20 rounded-xl border-2 border-dashed
                           border-[#D4CFC7] flex items-center justify-center
                           text-[#C0BAB2] hover:border-navy hover:text-navy
                           transition-colors bg-white">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* ── Form fields ── */}
        <input name="name" placeholder="Product Name" value={form.name}
               onChange={onChange} required className={pillInput} />

        {/* Category */}
        <div className="relative">
          <select name="category_id" value={form.category_id}
                  onChange={onChange} required
                  className={`${pillSelect} ${form.category_id ? 'text-navy' : 'text-[#C0BAB2]'}`}>
            <option value="" disabled>Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown />
        </div>

        {/* Sub-category (always visible, greyed out when no options) */}
        <div className="relative">
          <select name="sub_category_id" value={form.sub_category_id}
                  onChange={onChange}
                  disabled={subCategories.length === 0}
                  className={`${pillSelect} ${
                    form.sub_category_id ? 'text-navy' : 'text-[#C0BAB2]'
                  } ${subCategories.length === 0 ? 'opacity-50' : ''}`}>
            <option value="">Sub-category</option>
            {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown />
        </div>

        <input name="price" type="number" placeholder="Price (₦)" value={form.price}
               onChange={onChange} required min="1" step="0.01" className={pillInput} />

        <input name="stock_quantity" type="number" placeholder="Stock Quantity"
               value={form.stock_quantity} onChange={onChange}
               required min="0" className={pillInput} />

        <textarea name="description" placeholder="Description"
                  value={form.description} onChange={onChange}
                  className={`${pillInput} rounded-2xl resize-none h-32`} />

        <input name="weight_kg" type="number" placeholder="Product Weight((kg))"
               value={form.weight_kg} onChange={onChange}
               min="0" step="0.001" className={pillInput} />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* ── Save button ── */}
        <button type="submit" disabled={loading}
          className="w-full bg-navy text-white font-bold py-4 rounded-full
                     hover:bg-navy/90 active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed text-base mt-2">
          {loading ? 'Saving…' : 'Save Product'}
        </button>

        {/* ── Commission note (shown after category selected) ── */}
        {commission && (
          <p className="text-center text-xs text-[#8A9BB0] pb-2">
            Bryge commission for {commission.category_name}: {commission.rate}%
          </p>
        )}
      </form>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="32" height="32" fill="none" viewBox="0 0 24 24"
         stroke="#C0BAB2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0
               2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  );
}

function ChevronDown() {
  return (
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#A0AAB8]">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
           stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </span>
  );
}
