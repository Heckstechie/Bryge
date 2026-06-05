import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

export default function RoleSelect() {
  const navigate = useNavigate();

  function pick(role) {
    if (role === 'vendor') {
      navigate('/vendor/register');
    } else {
      navigate('/register/details', { state: { role } });
    }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-3xl px-6 py-8 shadow-sm">
        <h1 className="text-2xl font-bold text-navy text-center mb-1">
          Choose how you&apos;d like to continue
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Book cleaning services or find flexible jobs in just a few steps
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => pick('customer')}
            className="btn-outline text-base"
          >
            I&apos;m a Shopper
          </button>

          <button
            type="button"
            onClick={() => pick('vendor')}
            className="btn-outline text-base"
          >
            I&apos;m a Vendor
          </button>
        </div>
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
