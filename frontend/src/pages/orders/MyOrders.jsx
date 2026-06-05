import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB');
}

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG')}`; }

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/orders').then(({ data }) => {
      if (!mounted) return;
      setOrders(data.orders || []);
    }).catch(() => setOrders([])).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="p-1 text-navy">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-navy">My Orders</h1>
          <span className="w-8" />
        </div>
      </div>

      <div className="px-4 pb-10">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (<div key={i} className="bg-white rounded-2xl h-28 animate-pulse"/>))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-28 text-center px-6">
            <h2 className="text-xl font-bold text-navy mb-3">No orders yet</h2>
            <p className="text-[#8A9BB0] text-sm leading-relaxed">Your orders will appear here once placed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="bg-white rounded-2xl p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#F0EBE2] overflow-hidden flex-none">
                  {o.thumbnail ? <img src={o.thumbnail} alt="thumb" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-navy truncate">{o.order_ref || o.order_number || `Order ${o.id}`}</div>
                      <div className="text-xs text-[#8A9BB0] mt-1">Placed on {fmtDate(o.created_at)}</div>
                    </div>
                    <div className="text-sm font-bold text-navy">{naira(o.total_ngn)}</div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => navigate(`/orders/${o.id}`)} className="bg-[#C8603A] text-white px-4 py-2 rounded-full text-sm">Order Details</button>
                      {o.status === 'delivered' && (
                        <button onClick={() => navigate(`/orders/${o.id}/review`)} className="bg-[#3D6B4F] text-white px-4 py-2 rounded-full text-sm">Leave Review</button>
                      )}
                    </div>
                    <span className="text-xs text-[#8A9BB0]">Status: <strong className="text-navy">{o.status}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
