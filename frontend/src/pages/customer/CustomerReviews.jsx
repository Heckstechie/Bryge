import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function CustomerReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/customer/reviews')
      .then(({ data }) => { if (mounted) setReviews(data.reviews || []); })
      .catch(() => setReviews([]))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 text-navy">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
          </button>
          <h1 className="text-lg font-bold text-navy">My Reviews</h1>
        </div>

        <div className="space-y-4">
          {loading ? (
            [1,2,3].map((i) => <div key={i} className="h-28 rounded-3xl bg-white animate-pulse" />)
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-[#8A9BB0]">
              You haven't reviewed anything yet.
            </div>
          ) : reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-navy">{review.product_name}</div>
                <div className="text-xs text-[#8A9BB0]">{new Date(review.created_at).toLocaleDateString('en-GB')}</div>
              </div>
              <div className="flex items-center gap-1 mb-3 text-[#C8603A]">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              {review.title && <div className="text-sm font-semibold text-navy mb-1">{review.title}</div>}
              <p className="text-sm text-[#8A9BB0] leading-relaxed">{review.body || 'No comment provided.'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
