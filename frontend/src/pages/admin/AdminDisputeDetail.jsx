import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}

const REASON_LABELS = {
  not_received:     'Item Not Received',
  wrong_item:       'Wrong Item Sent',
  damaged:          'Item Damaged',
  not_as_described: 'Not as Described',
  other:            'Other',
};

// ── Resolution Confirm Modal ──────────────────────────────────────────────────
function ResolveModal({ type, dispute, onConfirm, onCancel, loading }) {
  const isVendor = type === 'release_to_vendor';
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 className="text-lg font-bold text-[#0F1A2B] text-center mb-4">
          {isVendor ? 'Release Payment to Vendor?' : 'Refund Customer?'}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-4">You are about to:</p>
        <ul className="text-sm text-gray-600 space-y-1.5 mb-6 mx-4">
          {isVendor ? (
            <>
              <li>- Release {naira(dispute?.vendor_payout_ngn)} to {dispute?.vendor_name}</li>
              <li>- Close dispute #{dispute?.dispute_number}</li>
              <li>- Notify both parties of the decision</li>
            </>
          ) : (
            <>
              <li>- Refund {naira(dispute?.order_total)} to {dispute?.customer_name}</li>
              <li>- Close dispute #{dispute?.dispute_number}</li>
              <li>- Notify both parties of the decision</li>
            </>
          )}
        </ul>
        <div className="flex gap-3 mb-3">
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-[#3D6B4F] text-white font-semibold py-3 rounded-xl text-sm
                       hover:bg-green-700 disabled:opacity-50 transition-all">
            {loading ? '…' : 'Yes, Release Payment'}
          </button>
          <button onClick={onCancel} disabled={loading}
            className="flex-1 bg-[#8B3A2A] text-white font-semibold py-3 rounded-xl text-sm
                       hover:opacity-90 disabled:opacity-50 transition-all">
            Cancel
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center">This action cannot be undone</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDisputeDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [dispute, setDispute]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [resolution, setResolution] = useState(null); // 'release_to_vendor' | 'refund_customer'
  const [resNote, setResNote]       = useState('');
  const [modal, setModal]           = useState(null); // 'release_to_vendor' | 'refund_customer'
  const [resolving, setResolving]   = useState(false);

  // Review note editing
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText]       = useState('');
  const [savingNote, setSavingNote]   = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/disputes/${id}`)
      .then(({ data }) => {
        setDispute(data.dispute);
        setNoteText(data.dispute.resolution_notes || '');
        setResNote(data.dispute.resolution_notes || '');
      })
      .catch(() => navigate('/admin/disputes'))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveNote() {
    setSavingNote(true);
    try {
      await api.patch(`/admin/disputes/${id}/note`, { note: noteText });
      setDispute((prev) => ({ ...prev, resolution_notes: noteText }));
      setResNote(noteText);
      setEditingNote(false);
    } catch {}
    setSavingNote(false);
  }

  async function handleResolve() {
    if (!resolution) return;
    setResolving(true);
    setError('');
    try {
      await api.post(`/admin/disputes/${id}/resolve`, {
        resolution,
        resolution_notes: resNote,
      });
      setModal(null);
      navigate('/admin/disputes/resolved');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve dispute.');
      setModal(null);
    } finally { setResolving(false); }
  }

  if (loading) return (
    <AdminShell title="Dispute Details">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  if (!dispute) return null;

  const isOpen    = dispute.status === 'open';
  const isReview  = dispute.status === 'under_review';
  const isResolved = ['resolved_vendor', 'resolved_customer', 'closed'].includes(dispute.status);
  const canAct    = isOpen || isReview;

  const STATUS_BADGE = {
    open:             'bg-[#8B3A2A]/10 text-[#8B3A2A] border border-[#8B3A2A]/20',
    under_review:     'bg-amber-50 text-amber-700 border border-amber-200',
    resolved_vendor:  'bg-green-50 text-green-700 border border-green-200',
    resolved_customer:'bg-green-50 text-green-700 border border-green-200',
    closed:           'bg-gray-100 text-gray-500 border border-gray-200',
  };

  function statusLabel(s) {
    if (s === 'open')              return 'Open';
    if (s === 'under_review')      return 'Under Review';
    if (s === 'resolved_vendor')   return 'Resolved — Released';
    if (s === 'resolved_customer') return 'Resolved — Refunded';
    if (s === 'closed')            return 'Closed';
    return s;
  }

  function fmtDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).replace(',', ' ·');
  }

  return (
    <AdminShell title="Dispute Details">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-xs text-gray-400">
        <Link to="/admin/disputes" className="hover:text-[#0F1A2B]">Disputes</Link>
        <span>/</span>
        <span className="text-[#0F1A2B] font-medium">{dispute.dispute_number}</span>
      </div>

      {/* Title + badge */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-[#0F1A2B]">Dispute Details</h2>
        <span className={`inline-flex px-3 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[dispute.status] || ''}`}>
          {statusLabel(dispute.status)}
        </span>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-2xl space-y-6">

        {/* ── Dispute Info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#0F1A2B] mb-4">Dispute Info</h3>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Dispute #</p>
              <p className="text-sm font-semibold text-[#D45B3E]">{dispute.dispute_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Order #</p>
              <p className="text-sm text-[#0F1A2B]">{dispute.order_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Reason</p>
              <p className="text-sm text-[#0F1A2B]">{REASON_LABELS[dispute.reason] || dispute.reason}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Opened</p>
              <p className="text-sm text-[#0F1A2B]">{fmtDate(dispute.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Vendor</p>
              <p className="text-sm text-[#0F1A2B]">{dispute.vendor_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Customer</p>
              <p className="text-sm text-[#0F1A2B]">{dispute.customer_name}</p>
            </div>
          </div>
          {dispute.description && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{dispute.description}</p>
            </div>
          )}
        </div>

        {/* ── Review Notes ── */}
        <div>
          <h3 className="text-sm font-bold text-[#0F1A2B] mb-2">Review Notes</h3>
          {dispute.resolution_notes && !editingNote ? (
            <>
              <p className="text-xs text-gray-400 mb-3">
                Added by Admin · {fmtDate(dispute.updated_at)}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-3">
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  "{dispute.resolution_notes}"
                </p>
              </div>
              {canAct && (
                <button onClick={() => setEditingNote(true)}
                  className="px-4 py-2 bg-[#0F1A2B] text-white text-xs font-semibold rounded-xl
                             hover:opacity-90 transition-colors">
                  Edit Note
                </button>
              )}
            </>
          ) : canAct ? (
            <div>
              {!editingNote && (
                <p className="text-xs text-gray-400 mb-2">No review note yet</p>
              )}
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add review notes visible to the admin team..."
                rows={4}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:border-[#0F1A2B]/30 resize-none bg-white"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={saveNote} disabled={savingNote || !noteText.trim()}
                  className="px-4 py-2 bg-[#0F1A2B] text-white text-xs font-semibold rounded-xl
                             hover:opacity-90 disabled:opacity-40 transition-colors">
                  {savingNote ? '…' : 'Save Note'}
                </button>
                {editingNote && (
                  <button onClick={() => { setEditingNote(false); setNoteText(dispute.resolution_notes || ''); }}
                    className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl bg-white">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 italic">
                {dispute.resolution_notes ? `"${dispute.resolution_notes}"` : '—'}
              </p>
            </div>
          )}
        </div>

        {/* ── Resolve This Dispute ── */}
        {canAct && (
          <div>
            <h3 className="text-sm font-bold text-[#0F1A2B] mb-1">Resolve This Dispute</h3>
            <p className="text-xs text-gray-400 mb-4">Based on your review, choose a resolution:</p>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Release to Vendor */}
              <button
                onClick={() => setResolution('release_to_vendor')}
                className={`text-left p-5 rounded-2xl border-2 transition-all
                  ${resolution === 'release_to_vendor'
                    ? 'border-[#0F1A2B] bg-[#0F1A2B]/3'
                    : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <p className="text-sm font-semibold text-[#D45B3E] mb-2">Release to Vendor</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  Vendor fulfilled the order as agreed
                </p>
                <p className="text-xs font-semibold text-[#0F1A2B]">
                  {naira(dispute.vendor_payout_ngn)} · {dispute.vendor_name}
                </p>
              </button>

              {/* Refund Customer */}
              <button
                onClick={() => setResolution('refund_customer')}
                className={`text-left p-5 rounded-2xl border-2 transition-all
                  ${resolution === 'refund_customer'
                    ? 'border-[#0F1A2B] bg-[#0F1A2B]/3'
                    : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <p className="text-sm font-semibold text-[#D45B3E] mb-2">Refund Customer</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  Customer deserves a full refund
                </p>
                <p className="text-xs font-semibold text-[#0F1A2B]">
                  {naira(dispute.order_total)} · {dispute.customer_name}
                </p>
              </button>
            </div>

            {/* Resolution Note */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-[#0F1A2B] mb-2">Resolution Note:</p>
              <textarea
                value={resNote}
                onChange={(e) => setResNote(e.target.value)}
                placeholder="Explain the resolution decision to both the customer and vendor..."
                rows={5}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:border-[#0F1A2B]/30 resize-none bg-gray-50"
              />
            </div>

            <button
              onClick={() => { if (resolution) setModal(resolution); }}
              disabled={!resolution}
              className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all
                ${resolution
                  ? 'bg-[#8B3A2A] text-white hover:opacity-90'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              Confirm Resolution
            </button>
          </div>
        )}

        {/* Resolved state — Resolution Summary */}
        {isResolved && (
          <div>
            <h3 className="text-sm font-bold text-[#0F1A2B] mb-4">Resolution Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex">
                <span className="w-32 text-xs text-gray-400 flex-shrink-0">Resolution:</span>
                <span className="text-xs text-[#0F1A2B]">
                  {dispute.status === 'resolved_vendor' ? 'Payment Released to Vendor' : 'Refund Issued to Customer'}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-xs text-gray-400 flex-shrink-0">Amount:</span>
                <span className="text-xs text-[#0F1A2B]">
                  {dispute.status === 'resolved_vendor'
                    ? `${naira(dispute.vendor_payout_ngn)} released to ${dispute.vendor_name}`
                    : `${naira(dispute.order_total)} refunded to ${dispute.customer_name}`}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-xs text-gray-400 flex-shrink-0">Resolved by:</span>
                <span className="text-xs text-[#0F1A2B]">
                  {dispute.resolved_by_email ? dispute.resolved_by_email.split('@')[0] : 'Admin'}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-xs text-gray-400 flex-shrink-0">Resolved on:</span>
                <span className="text-xs text-[#0F1A2B]">{fmtDateTime(dispute.resolved_at)}</span>
              </div>
            </div>

            {dispute.resolution_notes && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#0F1A2B] mb-2">
                  Resolution Note sent to both parties:
                </p>
                <p className="text-xs text-gray-500 leading-relaxed italic">
                  "{dispute.resolution_notes}"
                </p>
              </div>
            )}

            <button className="text-xs text-[#3D6B4F] hover:underline font-medium">
              Download Resolution Report →
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {modal && (
        <ResolveModal
          type={modal}
          dispute={dispute}
          loading={resolving}
          onConfirm={handleResolve}
          onCancel={() => setModal(null)}
        />
      )}
    </AdminShell>
  );
}
