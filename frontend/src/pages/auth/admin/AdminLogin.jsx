import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authApi } from '../../../services/api';

export default function AdminLogin() {
  const { afterVerify } = useAuth();
  const navigate        = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Use dedicated admin endpoint — bypasses normalizeEmail, role-gated server-side
      const { data } = await authApi.adminLogin({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      // Store tokens + hydrate context via afterVerify (same as email verification flow)
      afterVerify(data.user, data.access_token, data.refresh_token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#C8DCFA] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-xl px-16 py-14">

        {/* Title */}
        <div className="text-center mb-9">
          <h1 className="text-2xl font-semibold text-navy tracking-tight mb-2">
            Admin Login
          </h1>
          <p className="text-[#8A9BBE] text-sm">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            className="w-full border border-gray-200 rounded-full px-5 py-3.5 text-sm text-navy
                       placeholder-[#B0BFDA] bg-white focus:outline-none focus:ring-2
                       focus:ring-navy/20 focus:border-navy/40 transition-all"
            autoComplete="email"
            required
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              className="w-full border border-gray-200 rounded-full px-5 py-3.5 text-sm text-navy
                         placeholder-[#B0BFDA] bg-white focus:outline-none focus:ring-2
                         focus:ring-navy/20 focus:border-navy/40 transition-all pr-12"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0BFDA] hover:text-navy transition-colors"
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center pt-1">{error}</p>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white font-medium py-3.5 rounded-full
                         hover:bg-navy-700 active:scale-[0.99] transition-all duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
    </svg>
  );
}
