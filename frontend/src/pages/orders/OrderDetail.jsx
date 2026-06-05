import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB');
}

function Step({ done, label, time }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full ${done ? 'bg-green-600' : 'bg-gray-300'}`} />
        <div className="w-px h-full bg-gray-200" />
      </div>
      <div>
        <div className="text-sm font-semibold text-navy">{label}</div>
        {time && <div className="text-xs text-[#8A9BB0] mt-1">{fmtDateTime(time)}</div>}
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get(`/orders/${id}`).then(({ data }) => {
      if (!mounted) return;
      setOrder(data.order ? data.order : data);
    }).catch(() => navigate('/orders')).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id, navigate]);

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin"/></div>;
  if (!order) return null;

  const steps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'processing', label: 'Vendor Preparing' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  // Build timeline from order.status_history if available, otherwise derive
  const history = order.status_history || [];

  return (
    <div className="min-h-screen bg-cream">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="p-1 text-navy">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-navy">Order Tracking</h1>
          <span className="w-8" />
        </div>
      </div>

      <div className="px-4 pb-10 space-y-6">
        <div className="bg-white rounded-2xl p-4">
          <div className="mb-4">
            <div className="text-sm text-[#8A9BB0]">{order.order_ref || order.order_number}</div>
            <div className="text-lg font-bold text-navy">Placed on {new Date(order.created_at).toLocaleDateString('en-GB')}</div>
            <div className="text-xs text-[#8A9BB0] mt-1">Status: <span className="font-semibold text-navy">{order.status}</span></div>
          </div>

          <div className="space-y-6">
            {steps.map(s => {
              const evt = history.find(h => h.status === s.key);
              const done = !!evt || order.status === s.key || (order.status === 'delivered' && s.key === 'delivered');
              return <Step key={s.key} done={done} label={s.label} time={evt?.at || null} />;
            })}
          </div>

          <div className="mt-6">
            {order.status !== 'delivered' ? (
              <button className="w-full bg-[#C8603A] text-white py-3 rounded-xl">Track My Order</button>
            ) : (
              <button className="w-full bg-[#3D6B4F] text-white py-3 rounded-xl">Order Delivered</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <div className="font-semibold text-navy mb-4">Items in this order</div>
          <div className="space-y-3">
            {order.vendor_orders?.flatMap((vo) => (
              vo.items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-[#EDE8DF] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#F0EBE2] overflow-hidden">
                      {item.product_image ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-navy truncate">{item.product_name}</div>
                      <div className="text-xs text-[#8A9BB0] mt-1">Qty: {item.quantity}</div>
                      <div className="text-xs text-[#8A9BB0] mt-1">Vendor: {vo.business_name || 'Unknown'}</div>
                    </div>
                    <div className="text-sm font-semibold text-navy">₦{Number(item.total_price_ngn).toLocaleString('en-NG')}</div>
                  </div>
                </div>
              ))
            ))}
          </div>
        </div>

        {order.status === 'delivered' && (
          <div className="bg-white rounded-2xl p-4">
            <div className="text-sm text-[#8A9BB0] mb-3">Leave feedback for your delivered items</div>
            <button onClick={() => navigate(`/orders/${order.id}/review`)} className="w-full bg-[#3D6B4F] text-white py-3 rounded-xl">Leave a Review</button>
          </div>
        )}
      </div>
    </div>
  );
}
