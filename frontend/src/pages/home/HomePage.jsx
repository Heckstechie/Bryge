import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const IMG = {
  hero: '/Hero%20background%20Image%201.jpeg',
  fabrics: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
  accessories: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
  beauty: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=800&q=80',
  foodstuff: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  whyChoose: '/brand/why-choose-bryge.jpeg',
  vendor: '/brand/vendor-cta.jpeg',
  finalBanner: '/brand/final-banner.jpeg',
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
  {
    title: 'Verified Vendors Only',
    body: 'Every vendor on Bryge goes through a manual verification process. No random sellers, no fake listings - just real people selling real products.',
  },
  {
    title: 'Your Money Is Always Protected',
    body: "We hold your payment in escrow until you confirm your order arrived safely. Your money never reaches the vendor until you're satisfied.",
  },
  {
    title: 'Authentic Cultural Products',
    body: 'Every product on Bryge is sourced directly from Nigerian artisans and verified sellers. Authentic quality, straight from the source.',
  },
  {
    title: 'Seamless Cross-Border Delivery',
    body: 'Bryge handles all the logistics - pickup, packaging, and international delivery. You order, we handle the rest. No stress, no middlemen.',
  },
  {
    title: 'Real Support When You Need It',
    body: "Our support team actually responds. Whether it's a question, a concern or a problem - we're here every step of the way.",
  },
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
            <div className="max-w-[680px] text-white">
              <h1 className="font-instrument text-[54px] font-semibold leading-[1.14] tracking-[-0.02em]">
                You Left Home. But
                <br />
                Home Doesn&apos;t Have to
                <br />
                Leave You.
              </h1>

              <p className="font-instrument mt-5 max-w-[560px] text-[14px] leading-[1.4] font-medium text-white/90">
                Shop your favourite products from verified vendors, delivered
                <br />
                straight to you, no stress, no hassle.
              </p>

              <div className="mt-8 flex items-center gap-4">
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
            From fabrics to flavours, browse authentic
            <br />
            products curated just for you.
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
        <p className="truncate text-[16px] font-semibold text-navy">{product.name}</p>
        <p className="mt-1 text-[24px] font-medium text-[#6B8F74]">₦{Number(product.price || 8500).toLocaleString()}</p>
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
    <section className="bg-white py-12 sm:py-14">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-0 px-5 sm:px-8 lg:grid-cols-2">
        <div className="bg-white pr-6 sm:pr-10 lg:pr-12 lg:min-h-[620px] lg:flex lg:flex-col">
          <h2 className="font-instrument text-[40px] font-semibold leading-[1.06] text-[#1E3A5F]">Why Choose Bryge</h2>
          <p className="mt-3 max-w-[420px] text-[16px] leading-[1.2] text-[#1E3A5F]">
            We didn&apos;t just build a marketplace. We
            <br />
            built trust
          </p>

          <div className="relative mt-8 pl-0 lg:mt-10 lg:flex-1 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute left-[56px] top-1 bottom-1 w-px bg-[#9BAABE]" />
            {reasons.map((reason, index) => (
              <div key={reason.title} className="grid grid-cols-[72px_1fr] items-start gap-4 lg:py-2">
                <span className="relative z-10 text-[30px] font-semibold leading-none text-[#7F91AA]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-instrument text-[20px] font-semibold leading-[1.12] text-[#1E3A5F]">{reason.title}</h3>
                  <p className="mt-3 text-[16px] leading-[1.2] text-[#1E3A5F]">{reason.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden">
          <img src={IMG.whyChoose} alt="Why choose Bryge" className="h-full min-h-[620px] w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

function VendorCtaSection() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-8 rounded-[18px] bg-[#1E3A5F] p-8 md:grid-cols-2 md:items-center md:gap-10 md:p-10 lg:p-12">
          <div className="max-w-[520px]">
            <h2 className="font-instrument text-[40px] font-semibold leading-[1.2] text-white">
              Your Products Deserve a
              <br />
              Global Stage
            </h2>
            <p className="font-instrument mt-5 max-w-[500px] text-[16px] leading-[1.25] text-white">
              Thousands of Nigerians abroad are looking for exactly what
              <br />
              you sell. Join Bryge and start reaching them today.
            </p>
            <Link
              to="/vendor/register"
              className="mt-8 inline-flex min-w-[190px] justify-center rounded-2xl bg-[#F5F1E8] px-6 py-3 text-[17px] font-medium text-[#1E3A5F]"
            >
              Become a Vendor
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl md:h-full">
            <img src={IMG.vendor} alt="Vendor" className="h-[280px] w-full object-cover md:h-full md:min-h-[320px]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalBannerSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative h-[620px] sm:h-[700px]">
        <img src={IMG.finalBanner} alt="City background" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#0E1C31]/72" />

        <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
          <div>
            <h2 className="font-instrument text-[40px] font-semibold leading-[1.15] text-white">
              Home Is Closer
              <br />
              Than You Think
            </h2>
            <p className="font-instrument mt-6 max-w-[760px] text-[16px] font-medium leading-[1.35] text-white/95">
              Start shopping today and get your favourite products
              <br />
              delivered straight to your door
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex min-w-[280px] justify-center rounded-[20px] bg-white px-8 py-4 text-[16px] font-medium text-[#1E3A5F]"
            >
              Shop the Marketplace
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
