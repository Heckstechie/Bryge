import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SECTIONS = [
  { title: 'Personal Information', description: 'Update your name and address details', path: '/customer/settings/personal' },
  { title: 'Saved Addresses', description: 'Manage shipping addresses', path: '/customer/settings/addresses' },
  { title: 'Notification Preferences', description: 'Choose which alerts you receive', path: '/customer/settings/notifications' },
  { title: 'My Reviews', description: 'View or edit product reviews', path: '/customer/settings/reviews' },
  { title: 'Dispute History', description: 'Track any order disputes', path: '/customer/settings/disputes' },
];

export default function CustomerSettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 text-navy">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <h1 className="text-lg font-bold text-navy">Account Settings</h1>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((item) => (
            <button key={item.title}
              onClick={() => navigate(item.path)}
              className="w-full text-left bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-navy">{item.title}</div>
                  <div className="text-xs text-[#8A9BB0] mt-1">{item.description}</div>
                </div>
                <span className="text-[#8A9BB0]">›</span>
              </div>
            </button>
          ))}
          {SECTIONS.map((item) => (
            <button key={item.title}
              onClick={() => navigate(item.path)}
              className="w-full text-left bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-navy">{item.title}</div>
                  <div className="text-xs text-[#8A9BB0] mt-1">{item.description}</div>
                </div>
                <span className="text-[#8A9BB0]">›</span>
              </div>
            </button>
          ))}

          <button
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="w-full mt-4 bg-[#C8603A] text-white rounded-3xl px-4 py-4 font-semibold hover:bg-[#b5523e] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
