import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { BrygeLogo, NavyButton, PillInput, ToggleEye } from './VendorShared';

export default function VendorLogin() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const { state }   = useLocation();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email.trim().toLowerCase(), form.password);
      if (user.role !== 'vendor') {
        setError('This account is not registered as a vendor.');
        return;
      }
      // Route based on approval status
      if (user.vendor_status === 'active') {
        navigate('/vendor/dashboard');
      } else {
        // pending / rejected / suspended → onboarding wizard or status screen
        navigate('/vendor/activate');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <VendorAuthShell>
      <div className="w-full max-w-md mx-auto">

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-navy leading-tight mb-3">
            Welcome back
          </h1>
          <p className="text-[#8A9BB0] text-base">Sign in to your Vendor account</p>
        </div>

        {/* Notice from redirect (e.g. post-registration in dev mode) */}
        {state?.notice && (
          <div className="mb-5 bg-[#3D6B4F]/10 border border-[#3D6B4F]/30 rounded-xl
                          px-4 py-3 text-center">
            <p className="text-[#3D6B4F] text-sm font-medium">{state.notice}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <PillInput
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            required
          />

          <div className="relative">
            <PillInput
              type={showPw ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
              extraClass="pr-12"
              required
            />
            <ToggleEye show={showPw} onToggle={() => setShowPw(v => !v)} />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center pt-1">{error}</p>
          )}

          <div className="pt-2">
            <NavyButton type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </NavyButton>
          </div>
        </form>

        {/* Forgot */}
        <p className="text-center mt-6">
          <Link to="/vendor/forgot-password" className="text-blue-600 text-sm hover:underline">
            Forgot your password?
          </Link>
        </p>
      </div>

      {/* Bottom link */}
      <div className="mt-auto pt-10 text-center text-[#8A9BB0] text-sm">
        Don't have an account?{' '}
        <Link to="/vendor/register" className="text-blue-600 font-medium hover:underline">
          Create one
        </Link>
      </div>
    </VendorAuthShell>
  );
}

/* ─── Shell wrapper used by all vendor auth screens ───────────────────────── */
export function VendorAuthShell({ children, centerContent = true }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top logo */}
      <header className="flex-none px-6 pt-8 flex justify-center">
        <BrygeLogo />
      </header>

      {/* Main area */}
      <main
        className={`flex-1 flex flex-col px-6 py-10 ${
          centerContent ? 'items-center justify-center' : 'items-center'
        }`}
      >
        <div className="w-full max-w-md flex flex-col flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
