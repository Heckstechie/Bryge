import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../services/api';
import { BrygeLogo, PillInput, NavyButton, ToggleEye, BusinessTypeCard } from './VendorShared';

const BUSINESS_TYPES = [
  {
    value: 'starter',
    label: 'Starter Business',
    description: "I'm testing my ideas with real customers, and preparing to register my company",
  },
  {
    value: 'registered',
    label: 'Registered Business',
    description: 'My business has the approval, documentation, and licenses required to operate legally',
  },
];

export default function VendorRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', business_name: '',
    email: '', phone: '', password: '', password_confirm: '',
  });
  const [businessType, setBusinessType] = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading]         = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFieldErrors(fe => ({ ...fe, [name]: '' }));
    setError('');
  }

  function validate() {
    const e = {};
    if (!form.first_name.trim())    e.first_name       = 'First name is required';
    if (!form.last_name.trim())     e.last_name        = 'Last name is required';
    if (!form.business_name.trim()) e.business_name    = 'Business name is required';
    if (!form.email.trim())         e.email            = 'Email is required';
    if (!form.phone.trim())         e.phone            = 'Phone number is required';
    if (form.password.length < 8)   e.password         = 'Minimum 8 characters';
    if (!/[A-Z]/.test(form.password)) e.password       = 'Must contain an uppercase letter';
    if (!/[0-9]/.test(form.password)) e.password       = 'Must contain a number';
    if (form.password !== form.password_confirm) e.password_confirm = 'Passwords do not match';
    if (!businessType)              e.businessType     = 'Please select your business type';
    return e;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.register({
        first_name:       form.first_name.trim(),
        last_name:        form.last_name.trim(),
        email:            form.email.trim().toLowerCase(),
        password:         form.password,
        password_confirm: form.password_confirm,
        role:             'vendor',
        business_name:    form.business_name.trim(),
        business_phone:   '+234' + form.phone.replace(/\D/g, ''),
      });

      if (data?.dev_auto_verified) {
        // Backend auto-verified the email — skip OTP screen, go straight to login
        navigate('/vendor/login', {
          state: { notice: 'Account created. Please log in to continue.' },
        });
      } else {
        navigate('/vendor/verify-email', {
          state: { email: form.email.trim().toLowerCase() },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'Registration failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="flex-none px-6 pt-8 flex justify-center">
        <BrygeLogo />
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-lg">

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-navy leading-tight mb-3">
              Become A Vendor
            </h1>
            <p className="text-[#8A9BB0] text-base">
              Join hundreds of vendors already selling with Bryge
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>

            {/* First / Last name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <PillInput name="first_name" placeholder="First Name"
                  value={form.first_name} onChange={onChange} autoComplete="given-name" />
                <FieldError msg={fieldErrors.first_name} />
              </div>
              <div>
                <PillInput name="last_name" placeholder="Last Name"
                  value={form.last_name} onChange={onChange} autoComplete="family-name" />
                <FieldError msg={fieldErrors.last_name} />
              </div>
            </div>

            {/* Business name */}
            <div>
              <PillInput name="business_name" placeholder="Business Name"
                value={form.business_name} onChange={onChange} />
              <FieldError msg={fieldErrors.business_name} />
            </div>

            {/* Email */}
            <div>
              <PillInput type="email" name="email" placeholder="Email Address"
                value={form.email} onChange={onChange} autoComplete="email" />
              <FieldError msg={fieldErrors.email} />
            </div>

            {/* Phone — +234 fixed (Nigeria only) */}
            <div>
              <div className="flex gap-2">
                <div className="flex-none flex items-center bg-white border border-[#E2DED8] rounded-full
                                px-4 py-4 text-navy text-sm font-medium whitespace-nowrap select-none">
                  🇳🇬 +234
                </div>
                <div className="flex-1">
                  <PillInput type="tel" name="phone" placeholder="Phone Number"
                    value={form.phone} onChange={onChange}
                    autoComplete="tel-national" inputMode="numeric" />
                </div>
              </div>
              <FieldError msg={fieldErrors.phone} />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <PillInput type={showPw ? 'text' : 'password'} name="password"
                  placeholder="Password" value={form.password} onChange={onChange}
                  autoComplete="new-password" extraClass="pr-12" />
                <ToggleEye show={showPw} onToggle={() => setShowPw(v => !v)} />
              </div>
              <FieldError msg={fieldErrors.password} />
            </div>

            {/* Confirm password */}
            <div>
              <div className="relative">
                <PillInput type={showConfirm ? 'text' : 'password'} name="password_confirm"
                  placeholder="Confirm Password" value={form.password_confirm} onChange={onChange}
                  autoComplete="new-password" extraClass="pr-12" />
                <ToggleEye show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>
              <FieldError msg={fieldErrors.password_confirm} />
            </div>

            {/* Business type */}
            <div className="pt-2">
              <p className="text-navy font-semibold text-sm mb-3">
                What type of business do you own?
              </p>
              <div className="space-y-3">
                {BUSINESS_TYPES.map(bt => (
                  <BusinessTypeCard key={bt.value} {...bt}
                    selected={businessType === bt.value}
                    onSelect={setBusinessType} />
                ))}
              </div>
              <FieldError msg={fieldErrors.businessType} />
            </div>

            {error && <p className="text-red-500 text-sm text-center pt-1">{error}</p>}

            <div className="pt-2">
              <NavyButton type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Continue'}
              </NavyButton>
            </div>

            <p className="text-[#8A9BB0] text-xs text-center leading-relaxed px-2 pb-2">
              By continuing, you agree to Bryge's{' '}
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>

          </form>

          <p className="text-center text-[#8A9BB0] text-sm mt-4 pb-10">
            Already have an account?{' '}
            <Link to="/vendor/login" className="text-blue-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>

        </div>
      </main>
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1.5 px-2">{msg}</p>;
}
