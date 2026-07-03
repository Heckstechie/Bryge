import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const IMG = {
  hero: '/Hero%20background%20Image%201.jpeg',
  fabrics: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
  accessories: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
  beauty: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=800&q=80',
  foodstuff: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  whyChoose: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80',
  vendor: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
  finalBanner: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80',
};

const journeyCards = [
  {
    id: 'verified',
    tone: 'bg-[#953F10] text-white',
    title: 'Verified Vendors',
    body: 'Every seller goes through our review process before listing a single product. No surprises.',
  },
  {
    id: 'secure',
    tone: 'bg-[#6B8E73] text-white',
    title: 'Secure Payments',
    body: 'Every seller goes through our review process before listing a single product. No surprises.',
  },
  {
    id: 'quality',
    tone: 'bg-[#7D5A3E] text-white',
    title: 'Quality Checked',
    body: 'Every product listed on Bryge is reviewed before going live. What you see is what you get, no counterfeits, no misleading listings.',
  },
  {
    id: 'support',
    tone: 'bg-[#1E3A5F] text-white',
    title: 'Real Support',
    body: 'Got a question or a problem? Our team actually picks up and responds.',
  },
];

const categories = [
  { name: 'Fabrics', img: IMG.fabrics, slug: 'fabrics' },
  { name: 'Accessories', img: IMG.accessories, slug: 'accessories-jewelry' },
  { name: 'Beauty', img: IMG.beauty, slug: 'beauty' },
  { name: 'Foodstuff', img: IMG.foodstuff, slug: 'foodstuff' },
];

const howSteps = [
  {
    id: 'discover',
    title: 'Discover Trusted Finds',
    body: 'Browse curated products from verified vendors across fashion, food, lifestyle, and more.',
  },
  {
    id: 'order',
    title: 'Place Your Order Securely',
    body: 'Checkout confidently through our secure payment process.',
  },
  {
    id: 'fulfillment',
    title: 'We Coordinate Fulfilment',
    body: 'Bryge manages vendor processing, quality checks, and shipping logistics.',
  },
  {
    id: 'worldwide',
    title: 'Receive Worldwide',
    body: 'Your order is delivered safely to you, wherever you are.',
  },
  {
    id: 'support',
    title: 'Confirm & Support Vendors',
    body: 'Confirm receipt so vendors are paid and service standards stay strong.',
  },
];

const reasons = [
  'Verified vendors only',
  'Escrow-protected transactions',
  'Authentic products from Nigeria',
  'Cross-border delivery coordination',
  'Responsive support from real people',
];

function JourneyIcon({ id }) {
  if (id === 'verified') {
    return (
      <svg className="h-4 w-4 text-[#7FBF35]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.5 14.4 6l4-.6-.6 4 3.5 2.6-3.5 2.6.6 4-4-.6L12 21.5 9.6 18l-4 .6.6-4L2.7 12l3.5-2.6-.6-4 4 .6L12 2.5Zm3.3 8.2-4.1 4.2a1 1 0 0 1-1.4 0l-1.8-1.8 1.4-1.4 1.1 1.1 3.4-3.5 1.4 1.4Z" />
      </svg>
    );
  }

  if (id === 'secure') {
    return (
      <svg className="h-4 w-4 text-[#1E3A5F]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a6 6 0 0 1 6 6v2h.8A2.2 2.2 0 0 1 21 12.2v7.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 19.8v-7.6A2.2 2.2 0 0 1 5.2 10H6V8a6 6 0 0 1 6-6Zm0 10a2.2 2.2 0 0 0-1 4.1V18h2v-1.9a2.2 2.2 0 0 0-1-4.1Zm0-8a4 4 0 0 0-4 4v2h8V8a4 4 0 0 0-4-4Z" />
      </svg>
    );
  }

  if (id === 'quality') {
    return (
      <svg className="h-4 w-4 text-[#1E3A5F]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.2 4 5v6.4c0 5 3.4 9.7 8 10.9 4.6-1.2 8-5.9 8-10.9V5l-8-2.8Zm-1.1 13.9-3.1-3.1 1.4-1.4 1.7 1.7 4-4 1.4 1.4-5.4 5.4Z" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4 text-[#1E3A5F]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.7 12.7-1.4 1.4-3.9-3.9V7h2v4.4Z" />
    </svg>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-screen min-h-[640px]">
        <img src={IMG.hero} alt="Bryge hero" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/10" />

        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-[640px] text-white">
              <h1 className="font-instrument text-[54px] font-semibold leading-[1.08] tracking-[-0.02em]">
                You Left Home. But
                <br />
                Home Doesn&apos;t Have to
                <br />
                Leave You.
              </h1>

              <p className="font-instrument mt-3 max-w-[520px] text-[14px] leading-snug font-medium text-white/90">
                Shop your favourite products from verified vendors, delivered
                <br />
                straight to you, no stress, no hassle.
              </p>

              <div className="mt-6 flex items-center gap-2.5">
                <Link
                  to="/shop"
                  className="rounded-xl bg-rust px-8 py-3 text-[17px] font-medium text-white transition-colors hover:bg-rust-dark"
                >
                  Shop Now
                </Link>
                <Link
                  to="/about"
                  className="rounded-xl bg-white px-8 py-3 text-[17px] font-medium text-navy"
                >
                  About Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  return (
    <section className="bg-[#F5F1E8] py-16 sm:py-20 md:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 md:px-9">
        <div className="mb-10 flex items-start justify-between gap-6 sm:mb-12">
          <div>
            <h2 className="font-instrument max-w-[400px] text-[32px] sm:text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-[#1E3A5F]">
            We've Got You, Every
            <br />
            Step of the Way
            </h2>
            <p className="mt-4 max-w-[420px] text-[17px] leading-[1.35] text-[#1E3A5F]/70">
              Shopping across borders can feel risky. We built Bryge so it never has to.
            </p>
          </div>

          <Link to="/about" className="mt-1 rounded-2xl bg-[#953F10] px-8 py-3 text-[17px] font-medium text-white text-center">
            About Us
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
          {journeyCards.map((card) => (
            <article key={card.id} className={`relative min-h-[180px] rounded-xl px-5 pb-5 pt-14 ${card.tone}`}>
              <div className="absolute left-0 top-8 rounded-r-full bg-[#F5F1E8] px-4 py-2 pr-6 text-sm font-medium text-[#1E3A5F]">
                <span className="inline-flex items-center gap-2">
                  <JourneyIcon id={card.id} />
                  <span>{card.title}</span>
                </span>
              </div>
              <p className="mt-[35px] mb-[35px] text-[15px] leading-[1.35] text-white/95">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className="bg-[#F5F1E8] py-16 sm:py-20">
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <div className="mb-12 text-center">
          <h2 className="font-instrument text-[40px] font-semibold leading-[1.15] text-navy">
            Everything You've
            <br />
            Been Missing
          </h2>
          <p className="font-instrument mx-auto mt-3 max-w-[500px] text-[16px] leading-[1.25] text-[#1E3A5F]/70">
            From fabrics to flavours, browse authentic products curated just for you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {categories.map((item) => (
            <Link key={item.name} to={`/shop?category=${item.slug}`} className="group relative overflow-hidden rounded-2xl">
              <div className="aspect-[4/5]">
                <img src={item.img} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              </div>
              <div className="absolute inset-x-3 bottom-4 rounded-2xl border border-[#C8895D] bg-[#F5F1E8] px-4 py-2.5 text-center text-[17px] font-medium text-[#1E3A5F]">
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const iconMap = {
    discover: (
      <svg className="h-8 w-8 text-[#1E3A5F]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 7.1 17.1l2.9 2.9 1.4-1.4-2.9-2.9A10 10 0 0 0 12 2Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z" />
        <path d="m10.8 12.7-1.6-1.6-1.4 1.4 3 3 5.4-5.4-1.4-1.4-4 4Z" />
      </svg>
    ),
    order: (
      <svg className="h-8 w-8 text-[#1E3A5F]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 4h2l2.2 9.1A2 2 0 0 0 9.2 15H18a2 2 0 0 0 1.9-1.4L22 7H7.1L6.6 5H3V4Zm7 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
      </svg>
    ),
    fulfillment: (
      <svg className="h-8 w-8 text-[#1E3A5F]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 3h8v2H8V3Zm-3 4h4v4H5V7Zm10 0h4v4h-4V7ZM5 13h4v4H5v-4Zm10 0h4v4h-4v-4Zm-6 6h6v2H9v-2Z" />
      </svg>
    ),
    worldwide: (
      <svg className="h-8 w-8 text-[#1E3A5F]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 11h11v5H3v-5Zm11 1 2.6-3H20l1 3v4h-2a2 2 0 1 1-4 0h-1v-4Zm-9 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
      </svg>
    ),
    support: (
      <svg className="h-8 w-8 text-[#1E3A5F]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a8 8 0 0 0-8 8v5.2A2.8 2.8 0 0 0 6.8 18H9v-6H6v-2a6 6 0 1 1 12 0v2h-3v6h2.2a2.8 2.8 0 0 0 2.8-2.8V10a8 8 0 0 0-8-8Z" />
      </svg>
    ),
  };

  return (
    <section className="bg-[#F5F1E8] py-14 sm:py-18">
      <div className="mx-auto w-full max-w-[1060px] px-5 sm:px-6">
        <div className="rounded-[22px] bg-[#7D5A3E] p-[50px]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-transparent px-2 py-1 md:col-span-1">
              <h2 className="font-instrument text-[40px] font-semibold leading-[1.05] text-[#F5F1E8]">How It Works</h2>
              <p className="mt-3 max-w-[260px] text-[16px] leading-[1.25] text-[#F5F1E8]">
                From browsing to your doorstep, We made ridiculously simple
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex min-w-[148px] justify-center rounded-2xl bg-[#F5F1E8] px-7 py-3 text-[17px] font-medium text-[#1E3A5F]"
              >
                Shop Now
              </Link>
            </div>

            {howSteps.slice(0, 2).map((step) => (
              <article key={step.id} className="rounded-xl bg-[#F5F1E8] p-5">
                {iconMap[step.id]}
                <h3 className="mt-4 font-instrument text-[20px] font-semibold leading-[1.15] text-[#1E3A5F]">{step.title}</h3>
                <p className="mt-3 text-[16px] leading-[1.25] text-[#1E3A5F]">{step.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {howSteps.slice(2).map((step) => (
              <article key={step.id} className="rounded-xl bg-[#F5F1E8] p-5">
                {iconMap[step.id]}
                <h3 className="mt-4 font-instrument text-[20px] font-semibold leading-[1.15] text-[#1E3A5F]">{step.title}</h3>
                <p className="mt-3 text-[16px] leading-[1.25] text-[#1E3A5F]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }) {
  const primaryImage = product.images?.find((img) => img.is_primary)?.url ?? product.images?.[0]?.url;

  return (
    <article className="overflow-hidden rounded-md border border-[#ECE4D8] bg-white">
      <div className="aspect-square border-b border-[#ECE4D8] bg-[#F6F2EB]">
        {primaryImage ? (
          <img src={primaryImage} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <img src="/brand/logo-icon-navy.png" alt="Bryge" className="h-10 w-10 opacity-85" />
          </div>
        )}
      </div>
      <div className="px-2 py-2 text-center">
        <p className="truncate text-[11px] font-semibold text-navy">{product.name}</p>
        <p className="mt-1 text-[10px] font-medium text-[#8A755F]">?{Number(product.price || 8500).toLocaleString()}</p>
      </div>
      <div className="px-2 pb-2">
        <Link
          to={`/shop/product/${product.id}`}
          className="block rounded-full bg-rust px-6 py-3 text-center text-[16px] font-medium text-white"
        >
          Add to Cart
        </Link>
      </div>
    </article>
  );
}

function ProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .get('/products?limit=4')
      .then((res) => {
        if (!active) return;
        setProducts(res.data.products?.slice(0, 4) ?? []);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const placeholders = [
    { id: 'mock-1', name: 'Wrist Beads', price: 8500, images: [] },
    { id: 'mock-2', name: 'Wrist Beads', price: 8500, images: [] },
    { id: 'mock-3', name: 'Wrist Beads', price: 8500, images: [] },
    { id: 'mock-4', name: 'Wrist Beads', price: 8500, images: [] },
  ];

  const items = products.length > 0 ? products : placeholders;

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-instrument text-[40px] font-semibold leading-tight text-navy">
            What People Are
            <br />
            Ordering Right Now
          </h2>
          <p className="mt-2 text-[16px] text-[#1E3A5F]">Join thousands of customers already bringing home closer</p>
        </div>

        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="animate-pulse overflow-hidden rounded-md border border-[#ECE4D8] bg-white">
                <div className="aspect-square bg-[#F0E8DC]" />
                <div className="space-y-2 px-2 py-3">
                  <div className="h-3 rounded bg-[#F0E8DC]" />
                  <div className="h-3 w-2/3 rounded bg-[#F0E8DC]" />
                  <div className="h-6 rounded-full bg-[#F0E8DC]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function WhyChooseSection() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-4 sm:px-6 md:grid-cols-2">
        <div className="rounded-md bg-[#F7F4EE] p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-navy">Why Choose Bryge</h2>
          <div className="mt-4 space-y-3">
            {reasons.map((reason, index) => (
              <div key={reason} className="grid grid-cols-[20px_1fr] items-start gap-2.5 border-b border-[#E7DECF] pb-2.5">
                <span className="text-[11px] font-semibold text-[#9B8C7C]">{String(index + 1).padStart(2, '0')}</span>
                <p className="text-[11px] leading-snug text-[#4A5A71]">{reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-md">
          <img src={IMG.whyChoose} alt="Why choose Bryge" className="h-full min-h-[280px] w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

function VendorCtaSection() {
  return (
    <section className="bg-white py-10 sm:py-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-[#1E3A5F] p-4 sm:grid-cols-[1fr_140px] sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold leading-tight text-white">
              Your Products Deserve a
              <br />
              Global Stage
            </h2>
            <p className="mt-2 max-w-sm text-[12px] text-white/80">Join Bryge and reach customers around the world.</p>
            <Link
              to="/vendor/register"
              className="mt-4 inline-flex justify-center rounded-full bg-white px-4 py-1.5 text-[17px] font-medium text-[#1E3A5F]"
            >
              Become a Vendor
            </Link>
          </div>

          <div className="overflow-hidden rounded-md">
            <img src={IMG.vendor} alt="Vendor" className="h-[120px] w-full object-cover sm:h-[100px]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalBannerSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[280px] sm:h-[340px]">
        <img src={IMG.finalBanner} alt="City background" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#0E1C31]/65" />

        <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
              Home Is Closer
              <br />
              Than You Think
            </h2>
            <p className="mt-2 text-xs text-white/85">Bring home to your doorstep, wherever you live.</p>
            <Link
              to="/shop"
              className="mt-4 inline-flex justify-center rounded-full bg-white px-4 py-1.5 text-[17px] font-medium text-navy"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream [&>section+section]:pt-[90px]">
      <HeroSection />
      <JourneySection />
      <CategoriesSection />
      <HowItWorksSection />
      <ProductsSection />
      <WhyChooseSection />
      <VendorCtaSection />
      <FinalBannerSection />
    </div>
  );
}
