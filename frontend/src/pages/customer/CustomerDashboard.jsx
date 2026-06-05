import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function CustomerDashboard() {
  const [banner, setBanner] = useState(null);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/site/banner')
      .then(({ data }) => { if (mounted) setBanner(data.banner); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingBanner(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingOrders(true);
    api.get('/orders?limit=3')
      .then(({ data }) => { if (mounted) setOrders(data.orders || []); })
      .catch(() => { if (mounted) setOrders([]); })
      .finally(() => { if (mounted) setLoadingOrders(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-navy">Welcome back</h1>
        </header>

        {/* KPI cards (placeholder) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#C8603A] text-white rounded-xl p-4"> 
            <div className="text-sm">Total Orders</div>
            <div className="text-xl font-bold">0</div>
          </div>
          <div className="bg-[#3D6B4F] text-white rounded-xl p-4"> 
            <div className="text-sm">Total Spent</div>
            <div className="text-xl font-bold">₦0.00</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <a href="/orders" className="rounded-3xl bg-white p-4 text-center text-sm font-semibold text-navy shadow-sm hover:shadow-md transition">My Orders</a>
          <a href="/notifications" className="rounded-3xl bg-white p-4 text-center text-sm font-semibold text-navy shadow-sm hover:shadow-md transition">Notifications</a>
          <a href="/customer/settings" className="rounded-3xl bg-white p-4 text-center text-sm font-semibold text-navy shadow-sm hover:shadow-md transition">Account</a>
        </div>

        {/* Banner */}
        <div className="mb-6">
          {loadingBanner ? (
            <div className="w-full h-40 bg-[#EDE8DF] rounded-xl animate-pulse" />
          ) : banner ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={banner.image_url} alt={banner.cta_text || 'Promotion'} className="w-full h-44 object-cover" />
              {banner.cta_text && (
                <a href={banner.cta_url || '#'}
                   className="absolute right-4 bottom-4 bg-navy text-white px-4 py-2 rounded-full">
                  {banner.cta_text}
                </a>
              )}
            </div>
          ) : (
            <div className="w-full h-44 bg-[#F5F1E8] rounded-xl flex items-center justify-center text-sm text-[#8A9BB0]">
              No active promotions
            </div>
          )}
        </div>

        {/* Recent orders (real data) */}
        <section className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">My Orders</h2>
            <a href="/orders" className="text-sm text-[#8A9BB0]">View All &gt;</a>
          </div>

          {loadingOrders ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (<div key={i} className="bg-white rounded-2xl h-28 animate-pulse"/>))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-6 text-center px-6 text-sm text-[#8A9BB0]">
              No orders yet
              <div className="mt-2">Your orders will appear here once placed.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="bg-white rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[#F0EBE2] overflow-hidden flex-none">
                    {o.first_image ? <img src={o.first_image} alt="thumb" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-navy truncate">{o.order_ref || o.order_number || `Order ${o.id}`}</div>
                        <div className="text-xs text-[#8A9BB0] mt-1">Placed on {new Date(o.created_at).toLocaleDateString('en-GB')}</div>
                      </div>
                      <div className="text-sm font-bold text-navy">₦{Number(o.total_ngn).toLocaleString('en-NG')}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <a href={`/orders/${o.id}`} className="bg-[#C8603A] text-white px-4 py-2 rounded-full text-sm">Order Details</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
