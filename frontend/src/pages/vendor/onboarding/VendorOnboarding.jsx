import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  BrygeLogo, NavyButton, RectInput, SelectInput,
  BusinessTypeCard, SidebarSteps, MobileStepBar, WelcomeModal,
} from '../../auth/vendor/VendorShared';

const STEPS = [
  { id: 1, label: 'Profile' },
  { id: 2, label: 'Type' },
  { id: 3, label: 'Registration' },
];

const INDUSTRIES = [
  'Fashion & Apparel', 'Food & Beverages', 'Electronics', 'Health & Beauty',
  'Home & Living', 'Arts & Crafts', 'Agriculture', 'Automotive',
  'Books & Education', 'Sports & Outdoors', 'Jewellery & Accessories', 'Other',
];

const REGISTRATION_TYPES = [
  'Sole Proprietorship', 'Limited Liability Company (LLC)',
  'Public Limited Company (PLC)', 'Partnership', 'Cooperative Society',
  'Non-Governmental Organisation (NGO)', 'Other',
];

const BUSINESS_TYPES = [
  {
    value: 'starter',
    label: 'Starter Business',
    description: "I'm testing my ideas with real customers, and preparing to register my company",
    icon: '📋',
  },
  {
    value: 'registered',
    label: 'Registered Business',
    description: 'My business has the approval, documentation, and licenses required to operate legally',
    icon: '🏢',
  },
];

export default function VendorOnboarding() {
  const navigate = useNavigate();

  const [step, setStep]   = useState(1);
  const [data, setData]   = useState({
    legal_name: '',
    country: 'Nigeria',
    business_type: '',
    industry: '',
    registration_type: '',
  });
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);

  function update(field, val) {
    setData(d => ({ ...d, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  }

  // ── Step validation ──────────────────────────────────────────────────────────
  function validateStep() {
    const e = {};
    if (step === 1) {
      if (!data.legal_name.trim()) e.legal_name = 'Legal business name is required';
      if (!data.country.trim())   e.country = 'Country is required';
    }
    if (step === 2) {
      if (!data.business_type) e.business_type = 'Please select your business type';
    }
    if (step === 3) {
      if (!data.industry)           e.industry = 'Please select an industry';
      if (!data.registration_type)  e.registration_type = 'Please select a registration type';
    }
    return e;
  }

  async function handleNext() {
    const e = validateStep();
    if (Object.keys(e).length) { setErrors(e); return; }

    if (step < 3) {
      setStep(s => s + 1);
      return;
    }

    // Step 3 → submit to backend
    setLoading(true);
    try {
      await api.patch('/vendor/profile', {
        legal_name:        data.legal_name,
        country:           data.country,
        business_type:     data.business_type,
        industry:          data.industry,
        registration_type: data.registration_type,
      });
    } catch {
      // Non-blocking — profile may not exist yet; admin will see it on activation
    } finally {
      setLoading(false);
    }
    setShowModal(true);
  }

  function handleBack() {
    setStep(s => s - 1);
    setErrors({});
  }

  return (
    <>
      {/* ── Two-column layout: sidebar (md+) + content ────────────────────── */}
      <div className="min-h-screen bg-cream flex">

        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-cream border-r border-[#E2DED8] px-7 py-8 min-h-screen">
          <BrygeLogo />
          <nav className="mt-10">
            <SidebarSteps steps={STEPS} current={step} />
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col px-5 sm:px-8 py-8 max-w-2xl">

          {/* Mobile logo */}
          <div className="md:hidden flex justify-center mb-6">
            <BrygeLogo />
          </div>

          {/* Mobile step bar */}
          <div className="md:hidden">
            <MobileStepBar steps={STEPS} current={step} />
          </div>

          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-navy">Welcome to BRYGE!</h1>
            <p className="text-[#8A9BB0] text-sm mt-1 leading-relaxed">
              {step === 2
                ? 'What type of business would you like to sell for?'
                : 'Tell us about the nature of your business. The input you provide will determine the information required for business activation.'}
            </p>
          </div>

          {/* ── Step 1: Profile ───────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-5 flex-1">
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">
                  Legal Business Name
                </label>
                <RectInput
                  placeholder="Enter your registered business name"
                  value={data.legal_name}
                  onChange={e => update('legal_name', e.target.value)}
                />
                {errors.legal_name && <FieldError msg={errors.legal_name} />}
              </div>

              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">
                  What country is your business based?
                </label>
                <SelectInput value={data.country} disabled>
                  <option value="Nigeria">Nigeria</option>
                </SelectInput>
                {errors.country && <FieldError msg={errors.country} />}
              </div>
            </div>
          )}

          {/* ── Step 2: Business Type ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-3 flex-1">
              {BUSINESS_TYPES.map(bt => (
                <BusinessTypeCard
                  key={bt.value}
                  {...bt}
                  selected={data.business_type === bt.value}
                  onSelect={v => update('business_type', v)}
                />
              ))}
              {errors.business_type && <FieldError msg={errors.business_type} />}
            </div>
          )}

          {/* ── Step 3: Registration ──────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-5 flex-1">
              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">
                  Industry / Category
                </label>
                <SelectInput
                  value={data.industry}
                  onChange={e => update('industry', e.target.value)}
                >
                  <option value="">Please select an option</option>
                  {INDUSTRIES.map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </SelectInput>
                {errors.industry && <FieldError msg={errors.industry} />}
              </div>

              <div>
                <label className="block text-navy text-sm font-medium mb-1.5">
                  What type of registration does your business have?
                </label>
                <SelectInput
                  value={data.registration_type}
                  onChange={e => update('registration_type', e.target.value)}
                >
                  <option value="">Please select a registration type</option>
                  {REGISTRATION_TYPES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </SelectInput>
                {errors.registration_type && <FieldError msg={errors.registration_type} />}
              </div>
            </div>
          )}

          {/* ── Navigation buttons ────────────────────────────────────────── */}
          <div className="mt-8 flex flex-col gap-3">
            <NavyButton type="button" onClick={handleNext} disabled={loading}>
              {loading ? 'Saving…' : 'Continue'}
            </NavyButton>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center justify-center gap-1 text-[#8A9BB0] text-sm hover:text-navy transition-colors"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                     strokeWidth={2} strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Welcome modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <WelcomeModal onActivate={() => navigate('/vendor/activate')} />
      )}
    </>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1.5 px-1">{msg}</p>;
}
