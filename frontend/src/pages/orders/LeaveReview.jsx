import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1 text-[#C8603A] text-lg">
      {[1,2,3,4,5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className="leading-none">
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

export default function LeaveReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get(`/orders/${id}`)
      .then(({ data }) => {
        if (!mounted) return;
        setOrder(data.order);
        setReviews((data.vendor_orders || []).flatMap((vo) => (vo.items || []).map((item) => ({
          order_item_id: item.id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          rating: 5,
          title: '',
          body: '',
        }))));
      })
      .catch(() => navigate('/orders'));
    return () => { mounted = false; };
  }, [id, navigate]);

  async function save() {
    setSaving(true);
    try {
      await Promise.all(reviews.map((review) =>
        api.post('/customer/reviews', {
          order_item_id: review.order_item_id,
          rating: review.rating,
          title: review.title,
          body: review.body,
        })
      ));
      alert('Reviews submitted');
      navigate('/customer/settings/reviews');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit reviews');
    } finally {
      setSaving(false);
    }
  }

  if (!order) {
    return <div className="min-h-screen bg-cream flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 text-navy">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <h1 className="text-lg font-bold text-navy">Leave a Review</h1>
        </div>

        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div key={review.order_item_id} className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-[#F0EBE2] overflow-hidden">
                  {review.product_image ? <img src={review.product_image} alt={review.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy">{review.product_name}</div>
                  <div className="text-xs text-[#8A9BB0]">Qty: {review.quantity}</div>
                </div>
              </div>
              <div className="mb-4">
                <Stars value={review.rating} onChange={(value) => {
                  const next = [...reviews];
                  next[index].rating = value;
                  setReviews(next);
                }} />
              </div>
              <input
                type="text"
                value={review.title}
                placeholder="Write a title"
                onChange={(e) => {
                  const next = [...reviews];
                  next[index].title = e.target.value;
                  setReviews(next);
                }}
                className="w-full bg-[#F5F1E8] rounded-3xl px-4 py-3 text-sm text-navy mb-3 border border-transparent focus:border-[#3D6B4F]/20 focus:outline-none"
              />
              <textarea
                value={review.body}
                placeholder="Write a comment"
                onChange={(e) => {
                  const next = [...reviews];
                  next[index].body = e.target.value;
                  setReviews(next);
                }}
                rows={4}
                className="w-full bg-[#F5F1E8] rounded-3xl px-4 py-3 text-sm text-navy border border-transparent focus:border-[#3D6B4F]/20 focus:outline-none"
              />
            </div>
          ))}

          <button onClick={save} disabled={saving} className="w-full bg-[#C8603A] text-white py-3 rounded-3xl font-semibold">
            {saving ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
