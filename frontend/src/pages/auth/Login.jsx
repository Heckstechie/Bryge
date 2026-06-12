import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function Login() {
  const { afterVerify } = useAuth();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login({ email: form.email, password: form.password });
      afterVerify(data.user, data.access_token, data.refresh_token);
      const role = data.user.role;
      if (role === 'admin' || role === 'sub_admin') {
        window.location.href = '/admin/dashboard';
      } else if (role === 'vendor') {
        window.location.href = data.user.vendor_status === 'active' ? '/vendor/dashboard' : '/vendor/activate';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-3xl px-6 py-8 shadow-sm">
        <h1 className="text-2xl font-bold text-navy text-center mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Sign in to your Bryge account</p>

        {/* Google SSO */}
        <button
          type="button"
          className="btn-outline flex items-center justify-center gap-2 mb-5"
          onClick={() => {/* Google OAuth flow */}}
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <hr className="flex-1 border-sand" />
          <span className="text-xs text-gray-400">or</span>
          <hr className="flex-1 border-sand" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            className="input-field"
            autoComplete="email"
            required
          />

          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              className="input-field pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy"
              tabIndex={-1}
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/forgot-password" className="text-sm text-navy underline underline-offset-2">
            Forgot your password?
          </Link>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-navy font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
    </svg>
  );
}
