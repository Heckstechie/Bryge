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

export default function CustomerPersonalInfo() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get('/customer/profile')
      .then(({ data }) => { if (mounted) setProfile(data.profile); })
      .catch(() => { if (mounted) setLoadError('Unable to load profile. Please try again.'); });
    return () => { mounted = false; };
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api.patch('/customer/profile', {
        first_name: profile.first_name,
        last_name: profile.last_name,
        date_of_birth: profile.date_of_birth || null,
        country: profile.country,
        city: profile.city,
      });
      alert('Saved successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-red-500">{loadError}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-navy underline">
          Try again
        </button>
      </div>
    );
  }

  if (!profile) {
    return <div className="min-h-screen bg-cream flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 text-navy">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <h1 className="text-lg font-bold text-navy">Personal Information</h1>
        </div>

        <div className="bg-white rounded-3xl p-5 space-y-4">
          <div className="text-xs uppercase tracking-[0.2em] text-[#8A9BB0]">Account</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#F5F1E8] p-4">
              <div className="text-xs font-semibold text-[#8A9BB0]">Email</div>
              <div className="mt-2 text-sm text-navy">{profile.email}</div>
            </div>
            <div className="rounded-3xl bg-[#F5F1E8] p-4">
              <div className="text-xs font-semibold text-[#8A9BB0]">Member since</div>
              <div className="mt-2 text-sm text-navy">{new Date(profile.created_at).toLocaleDateString('en-GB')}</div>
            </div>
          </div>

          <Input label="First name" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
          <Input label="Last name" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
          <Input label="City" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
          <Input label="Country" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
          <Input label="Date of Birth" type="date" value={profile.date_of_birth || ''} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} />

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-[#3D6B4F] text-white py-3 rounded-3xl font-semibold"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
