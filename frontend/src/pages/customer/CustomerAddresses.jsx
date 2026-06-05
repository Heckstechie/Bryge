import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function Input({ label, ...props }) {
  return (
    <label className="block text-sm text-navy mb-3">
      <span className="block mb-1 font-medium">{label}</span>
      <input {...props} className="w-full bg-white border border-[#E2DED8] rounded-3xl px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-[#3D6B4F]/10" />
    </label>
  );
}

export default function CustomerAddresses() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: null,
    recipient_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    label: 'Home',
    is_default: false,
  });

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customer/addresses');
      setAddresses(data.addresses || []);
    } catch (err) {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  function startEdit(address) {
    setForm({ ...address });
  }

  function resetForm() {
    setForm({
      id: null,
      recipient_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      label: 'Home',
      is_default: false,
    });
  }

  async function save() {
    setSaving(true);
    try {
      if (form.id) {
        await api.patch(`/customer/addresses/${form.id}`, form);
      } else {
        await api.post('/customer/addresses', form);
      }
      await fetch();
      resetForm();
      alert('Saved successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to save address');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/customer/addresses/${id}`);
      await fetch();
    } catch (err) {
      alert('Unable to delete address');
    }
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 text-navy">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <h1 className="text-lg font-bold text-navy">Saved Addresses</h1>
        </div>

        <div className="space-y-3">
          {loading ? (
            [1,2].map((i) => <div key={i} className="h-24 rounded-3xl bg-white animate-pulse" />)
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-[#8A9BB0]">No saved addresses yet.</div>
          ) : addresses.map((address) => (
            <div key={address.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-navy">{address.recipient_name} {address.is_default && <span className="text-xs text-[#3D6B4F] ml-2">Default</span>}</div>
                  <div className="text-xs text-[#8A9BB0] mt-1">{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}, {address.city}, {address.state}, {address.country}</div>
                  {address.postal_code && <div className="text-xs text-[#8A9BB0] mt-1">{address.postal_code}</div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => startEdit(address)} className="text-sm text-[#3D6B4F]">Edit</button>
                  <button onClick={() => remove(address.id)} className="text-sm text-[#C8603A]">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-5 space-y-4">
          <div className="text-sm font-semibold text-navy">{form.id ? 'Edit Address' : 'Add New Address'}</div>
          <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Input label="Recipient Name" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Address Line 1" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
          <Input label="Address Line 2" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input label="Postal Code" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 text-sm text-navy">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            Set as default address
          </label>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="flex-1 bg-[#3D6B4F] text-white py-3 rounded-3xl text-sm font-semibold">{saving ? 'Saving…' : 'Save Address'}</button>
            <button onClick={resetForm} type="button" className="flex-1 bg-[#EDE8DF] text-navy py-3 rounded-3xl text-sm">Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
}
