import { useNavigate } from 'react-router-dom';

export default function CustomerDisputeHistory() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 text-navy">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <h1 className="text-lg font-bold text-navy">Dispute History</h1>
        </div>

        <div className="bg-white rounded-3xl p-8 text-center text-[#8A9BB0]">
          There are no disputes to show right now.
          <div className="mt-3 text-sm">If you need help with an order, contact support from the main settings screen.</div>
        </div>
      </div>
    </div>
  );
}
