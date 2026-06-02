import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { authApi } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-3xl px-6 py-8 shadow-sm text-center">
        {/* Lock illustration */}
        <div className="text-6xl mb-4">🔐</div>

        <h1 className="text-2xl font-bold text-navy mb-1">Forgot Password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your email account to reset your password
        </p>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If that email is registered, we&apos;ve sent a reset link. Check your inbox.
            </p>
            <Link to="/login" className="btn-primary block">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="input-field text-center"
              autoComplete="email"
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Remember it?{' '}
        <Link to="/login" className="text-navy font-semibold hover:underline">Sign In</Link>
      </p>
    </AuthLayout>
  );
}
