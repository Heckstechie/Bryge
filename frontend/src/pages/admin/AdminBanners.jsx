import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [active, setActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/site/banners');
      setBanners(data.banners || []);
    } catch (err) {
      setBanners([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert('Select an image file');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('cta_text', ctaText);
      fd.append('cta_url', ctaUrl);
      fd.append('active', active ? 'true' : 'false');
      await api.post('/site/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null); setCtaText(''); setCtaUrl(''); setActive(false);
      fetch();
      alert('Banner uploaded');
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally { setSubmitting(false); }
  }

  async function makeActive(id) {
    try {
      await api.patch(`/site/banner/${id}/activate`);
      fetch();
    } catch (err) { alert('Failed to activate'); }
  }

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-navy mb-4">Site Banners</h1>

        <form onSubmit={handleUpload} className="bg-white p-4 rounded-2xl mb-6">
          <div className="mb-3">
            <label className="block text-sm text-navy mb-1">Image</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-navy mb-1">CTA Text (optional)</label>
            <input value={ctaText} onChange={e => setCtaText(e.target.value)} className="input-field" />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-navy mb-1">CTA URL (optional)</label>
            <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} className="input-field" />
          </div>
          <div className="mb-3 flex items-center gap-3">
            <input id="active" type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            <label htmlFor="active" className="text-sm text-navy">Set active (make this banner live)</label>
          </div>
          <button disabled={submitting} className="bg-navy text-white px-4 py-2 rounded-full">
            {submitting ? 'Uploading…' : 'Upload Banner'}
          </button>
        </form>

        <div className="bg-white p-4 rounded-2xl">
          <h2 className="text-lg font-semibold text-navy mb-3">Existing Banners</h2>
          {loading ? <div>Loading…</div> : (
            <div className="space-y-3">
              {banners.map(b => (
                <div key={b.id} className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-3">
                    <img src={b.image_url} alt={b.cta_text || 'banner'} className="w-28 h-12 object-cover rounded" />
                    <div>
                      <div className="text-sm font-semibold text-navy">{b.cta_text || '—'}</div>
                      <div className="text-xs text-[#8A9BB0]">{b.cta_url || 'No URL'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {b.active ? <span className="text-sm text-green-600">Active</span> : (
                      <button onClick={() => makeActive(b.id)} className="text-sm bg-[#3D6B4F] text-white px-3 py-1 rounded">Set Active</button>
                    )}
                  </div>
                </div>
              ))}
              {banners.length === 0 && <div className="text-sm text-[#8A9BB0]">No banners yet</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
