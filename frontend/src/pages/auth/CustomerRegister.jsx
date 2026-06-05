import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { authApi } from '../../services/api';

export default function CustomerRegister() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const role      = location.state?.role || 'customer';

  useEffect(() => {
    if (role === 'vendor') {
      navigate('/vendor/register');
    }
  }, [role, navigate]);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', password_confirm: '',
  });
  const [showPw, setShowPw]     = useState(false);
  const [showPw2, setShowPw2]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      await authApi.register({ ...form, role });
      navigate('/register/verify', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-3xl px-6 py-8 shadow-sm">
        <h1 className="text-2xl font-bold text-navy text-center mb-1">Create Your Account</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Join thousands of customers already shopping with Bryge
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex gap-3">
            <input
              name="first_name" placeholder="First Name" value={form.first_name}
              onChange={onChange} className="input-field" required
            />
            <input
              name="last_name" placeholder="Last Name" value={form.last_name}
              onChange={onChange} className="input-field" required
            />
          </div>

          <input
            type="email" name="email" placeholder="Email address"
            value={form.email} onChange={onChange}
            className="input-field" autoComplete="email" required
          />

          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              name="password" placeholder="Password"
              value={form.password} onChange={onChange}
              className="input-field pr-10" autoComplete="new-password" required
            />
            <button type="button" tabIndex={-1}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy">
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPw2 ? 'text' : 'password'}
              name="password_confirm" placeholder="Confirm Password"
              value={form.password_confirm} onChange={onChange}
              className="input-field pr-10" autoComplete="new-password" required
            />
            <button type="button" tabIndex={-1}
              onClick={() => setShowPw2((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy">
              {showPw2 ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-navy font-semibold hover:underline">Sign In</Link>
      </p>
    </AuthLayout>
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
