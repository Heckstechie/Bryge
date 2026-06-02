import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

export default function RegisterLanding() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      {/* Beige card matching design */}
      <div className="bg-[#E5DDD1] rounded-3xl px-6 py-8 shadow-sm">
        <h1 className="text-2xl font-bold text-navy text-center mb-1">Create Your Account</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Join thousands of customers already shopping with Bryge
        </p>

        <button
          type="button"
          className="btn-outline flex items-center justify-center gap-2 mb-4"
          onClick={() => {/* Google OAuth */}}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/register/role')}
        >
          Get Started
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-navy font-semibold hover:underline">
          Sign In
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
