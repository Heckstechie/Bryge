import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Image constants (replace with Cloudinary URLs when brand assets are ready) ─
const IMG = {
  heroBg: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?auto=format&fit=crop&w=1400&q=80',
  heroWoman: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=900&q=80',
  fabric: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
  accessories: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
  beauty: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=600&q=80',
  foodstuff: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  whyChoose: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
  vendorCta: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
  finalBanner: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80',
};

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin' || user.role === 'sub_admin') return '/admin/dashboard';
    if (user.role === 'vendor') return '/vendor/dashboard';
    return '/shop';
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-navy shadow-lg' : 'bg-navy/60 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/">
          <img src="/brand/logo-wordmark-cream.png" alt="Bryge" className="w-28 h-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/shop" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            Shop
          </Link>
          <a href="#how-it-works" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            How It Works
          </a>
          <Link to="/vendor/register" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            Become a Vendor
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to={dashboardPath()}
              className="bg-rust hover:bg-rust-dark text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-white/80 hover:text-white text-sm font-medium transition-colors hidden sm:block"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-rust hover:bg-rust-dark text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-screen flex overflow-hidden">
      {/* Left — content */}
      <div className="relative z-10 w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-24 pb-16 bg-hiw-bg">
        <span className="inline-flex items-center gap-2 text-rust text-sm font-semibold uppercase tracking-widest mb-6">
          <span className="w-6 h-px bg-rust" />
          Cross-border, made simple
        </span>
        <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          Your Favourite
          <br />
          Nigerian Products,
          <br />
          <span className="text-rust">Delivered Worldwide</span>
        </h1>
        <p className="text-white/70 text-lg mb-10 max-w-md leading-relaxed">
          Shop authentic Nigerian products from verified vendors and have them
          delivered directly to your door — wherever in the world you are.
        </p>
        <div className="flex items-center gap-4">
          <Link
            to="/shop"
            className="bg-rust hover:bg-rust-dark text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-rust/30"
          >
            Shop Now
          </Link>
          <Link
            to="/vendor/register"
            className="border border-white/40 hover:border-white text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:bg-white/10"
          >
            About Us
          </Link>
        </div>

        {/* Stats strip */}
        <div className="flex gap-8 mt-14 pt-8 border-t border-white/10">
          {[
            { n: '2,000+', label: 'Products' },
            { n: '500+', label: 'Verified Vendors' },
            { n: '30+', label: 'Countries Reached' },
          ].map(({ n, label }) => (
            <div key={label}>
              <p className="text-white font-bold text-2xl">{n}</p>
              <p className="text-white/50 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — photo */}
      <div className="hidden md:block w-1/2 relative">
        <img
          src={IMG.heroWoman}
          alt="Woman with a delivery box"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* warm brown tint overlay so it blends with left panel */}
        <div className="absolute inset-0 bg-warm-brown/20" />
      </div>
    </section>
  );
}

// ── Trust Strip ───────────────────────────────────────────────────────────────

const trustItems = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    color: 'bg-sage/20 text-sage',
    title: 'Verified Vendors',
    body: 'Every seller is vetted and approved by Bryge before listing products on our platform.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
    color: 'bg-rust/20 text-rust',
    title: 'Secured Packaging',
    body: 'Products are carefully prepared for long-distance international shipping.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    color: 'bg-navy/10 text-navy',
    title: 'Quality Checked',
    body: 'Products meet Bryge quality standards before being dispatched to customers.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'bg-warm-brown/20 text-warm-brown',
    title: 'Rapid Support',
    body: 'Our support team is available to resolve any issue quickly and efficiently.',
  },
];

function TrustStrip() {
  return (
    <section className="bg-cream py-14 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {trustItems.map(({ icon, color, title, body }) => (
          <div key={title} className="bg-white rounded-2xl p-6 shadow-sm">
            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${color}`}>
              {icon}
            </span>
            <h3 className="font-semibold text-navy text-sm mb-1.5">{title}</h3>
            <p className="text-warm-brown text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────

const categories = [
  { name: 'Fabrics', img: IMG.fabric, slug: 'fabrics' },
  { name: 'Accessories', img: IMG.accessories, slug: 'accessories-jewelry' },
  { name: 'Beauty', img: IMG.beauty, slug: 'beauty' },
  { name: 'Foodstuff', img: IMG.foodstuff, slug: 'foodstuff' },
];

function CategoriesSection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-navy text-3xl md:text-4xl font-bold mb-3">
            Everything You've Been Missing
          </h2>
          <p className="text-warm-brown text-base max-w-xl mx-auto">
            From handwoven fabrics to fresh produce, we built Bryge to bring it all to you.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(({ name, img, slug }) => (
            <Link
              key={name}
              to={`/shop?category=${slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] block"
            >
              <img
                src={img}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <span className="absolute bottom-4 left-4 text-white font-semibold text-lg">
                {name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

const steps = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'Discover Trusted Finds',
    body: 'Explore curated Nigerian products from verified vendors you can count on.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Place Your Order Securely',
    body: 'Checkout securely through Paystack, Stripe, or PayPal. Your funds are protected.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'We Coordinate Fulfillment',
    body: 'Bryge handles every step — preparing, packing, and getting it ready for pickup.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Receive Worldwide',
    body: 'Your products arrive safely, wherever you are in the world.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </svg>
    ),
    title: 'Confirm & Support Vendors',
    body: 'Confirm delivery to release payment to the vendor. Support the people behind the product.',
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-hiw-bg py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Title card */}
          <div className="md:col-span-1 flex flex-col justify-between bg-white/5 border border-white/10 rounded-2xl p-8">
            <div>
              <h2 className="text-white text-3xl md:text-4xl font-bold leading-tight mb-4">
                How It Works
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                From browsing to your doorstep — we've got every step covered so
                you can focus on what matters.
              </p>
            </div>
            <Link
              to="/shop"
              className="mt-8 inline-flex items-center justify-center bg-rust hover:bg-rust-dark text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors self-start"
            >
              Shop Now
            </Link>
          </div>

          {/* Steps grid — 2 cols × 3 rows would overflow so we use a 2×3 on the remaining 2 cols */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {steps.map(({ icon, title, body }) => (
              <div
                key={title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rust/20 text-rust mb-4">
                  {icon}
                </span>
                <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Featured Products ─────────────────────────────────────────────────────────

function ProductCard({ product }) {
  const primaryImage = product.images?.find((i) => i.is_primary)?.url ?? product.images?.[0]?.url;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative aspect-square bg-cream overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-sand" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM4 5a2 2 0 012-2h12a2 2 0 012 2v2H4V5z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-navy font-semibold text-sm truncate mb-1">{product.name}</p>
        <p className="text-rust font-bold text-base mb-4">
          ₦{Number(product.price).toLocaleString()}
        </p>
        <Link
          to={`/shop/product/${product.id}`}
          className="block w-full text-center bg-rust hover:bg-rust-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          Add to Cart
        </Link>
      </div>
    </div>
  );
}

function FeaturedProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?limit=4')
      .then((res) => setProducts(res.data.products?.slice(0, 4) ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const placeholders = Array.from({ length: 4 }, (_, i) => ({
    id: `ph-${i}`,
    name: 'Earrings',
    price: 8500,
    images: [],
  }));

  const items = products.length > 0 ? products : (!loading ? placeholders : []);

  return (
    <section className="bg-cream py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-navy text-3xl md:text-4xl font-bold mb-3">
            What People Are Ordering Right Now
          </h2>
          <p className="text-warm-brown text-base">
            Join thousands of customers already bringing home closer.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-sand" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-sand rounded w-3/4" />
                  <div className="h-4 bg-sand rounded w-1/2" />
                  <div className="h-9 bg-sand rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 border-2 border-navy text-navy font-semibold px-8 py-3 rounded-full hover:bg-navy hover:text-white transition-all duration-200"
          >
            View All Products
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Why Choose Bryge ──────────────────────────────────────────────────────────

const reasons = [
  {
    n: '01',
    title: 'Verified Vendors',
    body: 'Every vendor on Bryge goes through a thorough verification process to ensure quality and authenticity.',
  },
  {
    n: '02',
    title: 'Your Money is Always Protected',
    body: 'We hold your payment securely until your order arrives safely. Shop without any worry.',
  },
  {
    n: '03',
    title: 'Authentic Cultural Products',
    body: 'Straight from Nigerian artisans and merchants — products you cannot find anywhere else abroad.',
  },
  {
    n: '04',
    title: 'Seamless Cross-Border Delivery',
    body: 'Bryge handles all logistics — pickup, packaging, customs, and international delivery.',
  },
  {
    n: '05',
    title: 'Best Support When You Need It',
    body: 'Our support team is always available whenever you have a question or encounter an issue.',
  },
];

function WhyChooseSection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left — reasons */}
        <div>
          <h2 className="text-navy text-3xl md:text-4xl font-bold mb-10">
            Why Choose Bryge
          </h2>
          <div className="space-y-7">
            {reasons.map(({ n, title, body }) => (
              <div key={n} className="flex gap-5">
                <span className="text-rust/30 font-bold text-2xl leading-none w-10 flex-shrink-0 pt-0.5">
                  {n}
                </span>
                <div>
                  <h3 className="text-navy font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-warm-brown text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — photo */}
        <div className="relative rounded-3xl overflow-hidden aspect-[4/5]">
          <img
            src={IMG.whyChoose}
            alt="Happy customer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}

// ── Vendor CTA ────────────────────────────────────────────────────────────────

function VendorCTASection() {
  return (
    <section className="bg-navy py-0 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
        {/* Left — text */}
        <div className="flex flex-col justify-center px-8 md:px-16 py-16 lg:py-20">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-5 leading-tight">
            Your Products Deserve
            <br />a Global Stage
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-10 max-w-md">
            Thousands of Nigerians abroad are searching for exactly what you sell.
            Join Bryge and start reaching global customers today.
          </p>
          <Link
            to="/vendor/register"
            className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white hover:text-navy transition-all duration-200 self-start"
          >
            Become a Vendor
          </Link>
        </div>

        {/* Right — photo */}
        <div className="relative min-h-[340px] lg:min-h-0">
          <img
            src={IMG.vendorCta}
            alt="Vendor with products"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-navy/30" />
        </div>
      </div>
    </section>
  );
}

// ── Final Banner ──────────────────────────────────────────────────────────────

function FinalBannerSection() {
  return (
    <section className="relative min-h-[420px] flex items-center justify-center overflow-hidden">
      <img
        src={IMG.finalBanner}
        alt="City skyline"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-dark-navy/70" />
      <div className="relative z-10 text-center px-6 py-20">
        <h2 className="text-white text-4xl md:text-5xl font-bold mb-5 leading-tight">
          Home is Closer
          <br />Than You Think
        </h2>
        <p className="text-white/70 text-lg mb-10 max-w-lg mx-auto">
          Bryge brings Nigeria to your door — authentic, affordable, and always with you.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-rust hover:bg-rust-dark text-white font-semibold px-10 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-rust/30"
        >
          Start Shopping
        </Link>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-dark-navy py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <img src="/brand/logo-wordmark-cream.png" alt="Bryge" className="w-24 h-auto mb-1" />
          <p className="text-white/40 text-sm">Cross-border, made simple.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm">
          {[
            { label: 'Shop', to: '/shop' },
            { label: 'Become a Vendor', to: '/vendor/register' },
            { label: 'Login', to: '/login' },
          ].map(({ label, to }) => (
            <Link key={label} to={to} className="text-white/50 hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </div>

        <p className="text-white/30 text-sm text-center md:text-right">
          © {new Date().getFullYear()} Bryge Global Services Limited. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <TrustStrip />
      <CategoriesSection />
      <HowItWorksSection />
      <FeaturedProductsSection />
      <WhyChooseSection />
      <VendorCTASection />
      <FinalBannerSection />
      <Footer />
    </div>
  );
}
