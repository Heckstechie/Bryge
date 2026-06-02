import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }); }

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function Modal({ type, businessName, onConfirm, onCancel, loading }) {
  const isApprove = type === 'approve';
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 className="text-lg font-bold text-[#0F1A2B] text-center mb-3">
          {isApprove ? 'Approve This Vendor?' : 'Reject This Application?'}
        </h2>
        {isApprove ? (
          <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
            <strong>{businessName}</strong> will receive an email and can start listing products immediately.
          </p>
        ) : (
          <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
            This action will permanently reject <strong>{businessName}</strong>'s application.
          </p>
        )}
        <div className="flex gap-3">
          {isApprove ? (
            <>
              <button onClick={onConfirm} disabled={loading}
                className="flex-1 bg-[#3D6B4F] text-white font-semibold py-3 rounded-xl text-sm
                           hover:bg-green-700 disabled:opacity-50 transition-all">
                {loading ? '…' : 'Yes, Approve'}
              </button>
              <button onClick={onCancel} disabled={loading}
                className="flex-1 bg-[#8B3A2A] text-white font-semibold py-3 rounded-xl text-sm
                           hover:opacity-90 disabled:opacity-50 transition-all">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={onConfirm} disabled={loading}
                className="flex-1 bg-[#3D6B4F] text-white font-semibold py-3 rounded-xl text-sm
                           hover:bg-green-700 disabled:opacity-50 transition-all">
                {loading ? '…' : 'Reject Application'}
              </button>
              <button onClick={onCancel} disabled={loading}
                className="flex-1 bg-[#8B3A2A] text-white font-semibold py-3 rounded-xl text-sm
                           hover:opacity-90 disabled:opacity-50 transition-all">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminVendorApplication() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // 'approve' | 'reject' | null
  const [actioning, setActioning] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get(`/admin/vendors/applications/${id}`)
      .then(({ data: res }) => setData(res.application))
      .catch(() => navigate('/admin/vendors/applications'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(type) {
    setActioning(true);
    setError('');
    try {
      if (type === 'approve') {
        await api.post(`/admin/vendors/${id}/approve`);
      } else {
        await api.post(`/admin/vendors/${id}/reject`);
      }
      setModal(null);
      navigate('/admin/vendors/applications', { state: { success: `Application ${type}d` } });
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      setModal(null);
    } finally { setActioning(false); }
  }

  if (loading) return (
    <AdminShell title="Vendor Application">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  if (!data) return null;

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
  const location = [data.city, data.state, data.country].filter(Boolean).join(', ');

  return (
    <AdminShell title="Vendor Application">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-xs text-gray-400">
        <Link to="/admin/vendors" className="hover:text-[#0F1A2B]">Vendors</Link>
        <span>/</span>
        <Link to="/admin/vendors/applications" className="hover:text-[#0F1A2B]">Applications</Link>
        <span>/</span>
        <span className="text-[#0F1A2B] font-medium">{data.business_name}</span>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-3xl">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-[#0F1A2B]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-[#0F1A2B]/40">
              {data.business_name?.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F1A2B]">{data.business_name}</h2>
            <p className="text-xs text-gray-400">Applied {fmtDate(data.created_at)}</p>
          </div>
        </div>

        {/* Two-column info */}
        <div className="grid grid-cols-2 gap-x-16 gap-y-5 mb-8">
          {/* Left col */}
          <div className="space-y-5">
            <div>
              <p className="text-xs text-gray-400 mb-1">Business Name</p>
              <p className="text-sm font-semibold text-[#0F1A2B]">{data.business_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Phone No</p>
              <p className="text-sm text-[#0F1A2B]">{data.business_phone || data.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Date Applied</p>
              <p className="text-sm text-[#0F1A2B]">{fmtDate(data.created_at)}</p>
            </div>
            {data.registration_number && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Business Credentials</p>
                <p className="text-sm text-[#0F1A2B]">{data.registration_number}</p>
              </div>
            )}
          </div>

          {/* Right col */}
          <div className="space-y-5">
            <div>
              <p className="text-xs text-gray-400 mb-1">Personal Info</p>
              <p className="text-sm text-[#0F1A2B]">{fullName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Email</p>
              <p className="text-sm text-[#0F1A2B]">{data.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Address</p>
              <p className="text-sm text-[#0F1A2B]">{location || data.address || '—'}</p>
            </div>
            {data.verification_documents?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Documents</p>
                <div className="flex flex-wrap gap-2">
                  {data.verification_documents.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                      className="text-xs text-[#D45B3E] hover:underline">
                      Document {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {data.status === 'pending' && (
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button
              onClick={() => setModal('approve')}
              className="px-8 py-2.5 bg-[#3D6B4F] text-white text-sm font-semibold rounded-xl
                         hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => setModal('reject')}
              className="px-8 py-2.5 bg-[#8B3A2A] text-white text-sm font-semibold rounded-xl
                         hover:opacity-90 transition-colors"
            >
              Reject
            </button>
          </div>
        )}

        {data.status !== 'pending' && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              This application was already{' '}
              <span className={`font-semibold ${data.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                {data.status === 'active' ? 'approved' : 'rejected'}
              </span>.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <Modal
          type={modal}
          businessName={data.business_name}
          loading={actioning}
          onConfirm={() => handleAction(modal)}
          onCancel={() => setModal(null)}
        />
      )}
    </AdminShell>
  );
}
