import { useState } from 'react';
import { Link } from 'react-router-dom';

const featureCards = [
  {
    title: 'Apply',
    body: 'Tell us about your business, your products and the story behind what you\'re building.',
    tone: 'bg-[#9D470F]',
    icon: 'apply',
  },
  {
    title: 'We’ll Review Your Application',
    body: 'Every application is reviewed carefully to ensure it’s the right fit for BRYGE.',
    tone: 'bg-[#6D8F74]',
    icon: 'review',
  },
  {
    title: 'Let’s Talk',
    body: 'If shortlisted, we’ll invite you to a short discovery call to learn more about your business and answer any questions you may have.',
    tone: 'bg-[#7D5A3E]',
    icon: 'talk',
  },
  {
    title: 'Welcome to BRYGE',
    body: 'Successful applicants will complete onboarding ahead of launch and become part of our Founding Vendor community.',
    tone: 'bg-[#1E3A5F]',
    icon: 'welcome',
  },
];

const launchCategories = [
  {
    title: 'Fabrics & Textiles',
    body: 'Ankara, Akwete, Akwa ocha, aso oke and other traditional wears',
  },
  {
    title: 'Fashion & Ready-to-Wear',
    body: 'Ankara, contemporary aso oke, Agbada tailors, contemporary streetwear, hand-dyed Adire outfits, and everyday Afrocentric apparel.',
  },
  {
    title: 'Accessories & Jewellery',
    body: 'Handcrafted leather bags, statement coral beads, handfans, staffs, auto-gele, and custom-designed cultural fashion accessories.',
  },
  {
    title: 'Nigerian Snacks',
    body: 'Gourmet chin chin, crunchy plantain chips, spiced kuli kuli, premium cashew nuts, local tea blends, and packaged traditional treats.',
  },
  {
    title: 'Lifestyle Products',
    body: 'Heritage-themed journals, Afrocentric stationery, wellness items, and curated gifts celebrating modern Nigerian life.',
  },
  {
    title: 'Art & Handmade goods',
    body: 'Handwoven throw pillows, local art prints, carved woodwork, unique table runners, and hand-carved pottery or contemporary home decor.',
  },
];

const foundingVendorBenefits = [
  {
    title: 'Priority onboarding before launch',
    icon: 'clock',
  },
  {
    title: 'Early visibility on the platform',
    icon: 'eye',
  },
  {
    title: 'Dedicated onboarding support',
    icon: 'support',
  },
  {
    title: 'Access to our growing logistics partnerships',
    icon: 'truck',
  },
  {
    title: 'Opportunities to shape future platform features',
    icon: 'idea',
  },
  {
    title: 'The ability to reach customers beyond Nigeria.',
    icon: 'globe',
  },
  {
    title: 'A long-term partner committed to helping your business grow',
    icon: 'handshake',
  },
];

const imagineCards = [
  'Someone in London discovering your business for the first time.',
  'A bride in Toronto ordering her wedding fabrics.',
  'A Nigerian family in Houston stocking up on skincare that reminds them of home.',
  'Someone in Melbourne falling in love with your handmade products.',
];

const beliefRows = [
  'We believe great businesses deserve great opportunities.',
  'We believe trust should never be compromised for growth.',
  'We believe technology should make trade simpler, not more complicated.',
  'We believe relationships matter more than transactions.',
  'We believe Nigerian businesses deserve to be seen, valued and celebrated across the world',
];

const faqItems = [
  {
    question: 'Is BRYGE live yet?',
    answer: 'Not yet. We’re currently onboarding our Founding Vendors ahead of our official launch.',
  },
  {
    question: 'Does it cost anything to apply?',
    answer: 'No. Submitting an application is completely free.',
  },
  {
    question: 'Do I need export experience?',
    answer:
      'Not at all. Many of the businesses we’re speaking with are exploring international sales for the first time. We’ll guide successful applicants through our onboarding process.',
  },
  {
    question: 'Do I need a registered business?',
    answer:
      'We encourage businesses to be formally registered, but registration isn’t required to apply. Additional documentation may be requested during onboarding.',
  },
  {
    question: 'Will every business be accepted?',
    answer:
      'No. We’re intentionally onboarding in phases to ensure every business receives the attention and support it deserves.',
  },
  {
    question: 'How long does the process take?',
    answer: 'We’ll carefully review every application and contact shortlisted businesses with the next steps.',
  },
  {
    question: 'My products don’t fit your listed categories. Can I still apply?',
    answer: 'Absolutely. If you believe your business aligns with what BRYGE is building, we’d love to hear from you.',
  },
];

function FeatureIcon({ type }) {
  if (type === 'apply') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2.3 14 6.6l4.7.4-3.5 3 1.1 4.6L12 12.2 7.7 14.6l1.1-4.6-3.5-3 4.7-.4L12 2.3Z" />
      </svg>
    );
  }

  if (type === 'review') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2.5A4.5 4.5 0 0 0 7.5 7v1H6.8A1.8 1.8 0 0 0 5 9.8v8.4A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.8V9.8A1.8 1.8 0 0 0 17.2 8h-.7V7A4.5 4.5 0 0 0 12 2.5Zm-2.5 5A2.5 2.5 0 0 1 12 5a2.5 2.5 0 0 1 2.5 2.5V8h-5V7.5Zm6.1 4.1-4.1 4.2a1 1 0 0 1-1.4 0l-1.7-1.8 1.4-1.4 1 1 3.4-3.4 1.4 1.4Z" />
      </svg>
    );
  }

  if (type === 'talk') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M4 5h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-3.8 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm14 3h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1v2l-3-2h-2a2 2 0 0 1-2-2v-1h2a4 4 0 0 0 4-4V8Z" />
      </svg>
    );
  }

  if (type === 'welcome') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M3 18h18v2H3v-2Zm1-2h4v-6H4v6Zm6 0h4V4h-4v12Zm6 0h4v-9h-4v9Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M4 19h16v2H4v-2Zm1-3h3V9H5v7Zm5 0h4V5h-4v11Zm6 0h3v-5h-3v5Z" />
    </svg>
  );
}

function BenefitIcon({ type }) {
  if (type === 'eye') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    );
  }

  if (type === 'support') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12a8 8 0 0 1 16 0" />
        <path d="M4 12v4a2 2 0 0 0 2 2h1v-6H4Z" />
        <path d="M20 12v4a2 2 0 0 1-2 2h-1v-6h3Z" />
        <path d="M9 18h3a2 2 0 0 0 2-2v-1" />
      </svg>
    );
  }

  if (type === 'truck') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7h11v10H3z" />
        <path d="M14 10h3l3 3v4h-6z" />
        <circle cx="7" cy="18" r="1.5" />
        <circle cx="17" cy="18" r="1.5" />
      </svg>
    );
  }

  if (type === 'idea') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3 11.2V16h6v-1.8A6 6 0 0 0 12 3Z" />
      </svg>
    );
  }

  if (type === 'globe') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18" />
        <path d="M12 3a14 14 0 0 0 0 18" />
      </svg>
    );
  }

  if (type === 'handshake') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12.5 8 8l3 3" />
        <path d="M21 12.5 16 8l-3 3" />
        <path d="M8 8h3l2 2h3" />
        <path d="M7 15.5 10.5 19a2 2 0 0 0 2.8 0L16 16.3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function VendorLanding() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navyWordmarkFilter = 'brightness(0) saturate(100%) invert(19%) sepia(38%) saturate(1081%) hue-rotate(172deg) brightness(93%) contrast(93%)';

  return (
    <div id="top" className="min-h-screen bg-[#F3F3F3]">
      <header className="sticky top-0 z-50 border-b border-[#D5DCE5] bg-[#F3F3F3]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6 md:px-8">
          <Link to="/vendor" className="shrink-0">
            <img
              src="/brand/logo-full-black.png"
              alt="Bryge"
              className="h-auto w-28"
              style={{ filter: navyWordmarkFilter }}
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#why-bryge" className="text-[16px] font-medium text-navy/85 transition-colors hover:text-navy">Why BRYGE</a>
            <a href="#founding-vendors" className="text-[16px] font-medium text-navy/85 transition-colors hover:text-navy">Founding Vendors</a>
            <a href="#how-it-works" className="text-[16px] font-medium text-navy/85 transition-colors hover:text-navy">How It Works</a>
            <a href="#faq" className="text-[16px] font-medium text-navy/85 transition-colors hover:text-navy">FAQ</a>
          </nav>

          <Link
            to="https://tally.so/r/zxOg9q"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full bg-rust px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rust-dark md:inline-flex"
          >
            Apply as Founding Vendor
          </Link>

          <button
            type="button"
            onClick={() => setMobileNavOpen((value) => !value)}
            className="inline-flex items-center justify-center rounded-md p-2 text-navy lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 18 18 6" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
            )}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-[#D5DCE5] bg-[#F3F3F3] px-6 py-4 lg:hidden">
            <nav className="space-y-3">
              <a href="#why-bryge" onClick={() => setMobileNavOpen(false)} className="block text-[16px] font-medium text-navy/90">Why BRYGE</a>
              <a href="#founding-vendors" onClick={() => setMobileNavOpen(false)} className="block text-[16px] font-medium text-navy/90">Founding Vendors</a>
              <a href="#how-it-works" onClick={() => setMobileNavOpen(false)} className="block text-[16px] font-medium text-navy/90">How It Works</a>
              <a href="#faq" onClick={() => setMobileNavOpen(false)} className="block text-[16px] font-medium text-navy/90">FAQ</a>
              <Link
                to="https://tally.so/r/zxOg9q"
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileNavOpen(false)}
                className="mt-4 inline-flex rounded-full bg-rust px-5 py-2.5 text-sm font-semibold text-white"
              >
                Apply as Founding Vendor
              </Link>
            </nav>
          </div>
        )}
      </header>

      <section className="relative h-[460px] sm:h-[520px] md:h-[580px] overflow-hidden">
        <img
          src="/brand/Vendor%20Header.jpg"
          alt="Vendor hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#10213A]/80" />
        <div className="relative mx-auto flex h-full w-full max-w-6xl items-center px-6 md:px-8">
          <div className="max-w-[520px] text-white">
            <h1 className="font-instrument text-[30px] font-medium leading-tight sm:text-[34px] md:text-[40px]">
              Your Products Deserve a
              <br />
              Global Stage
            </h1>
            <p className="mt-4 max-w-[480px] text-[16px] text-white/90">
              Sell to Nigerians abroad who are already looking for what you make. No cold pitching. Just a direct line to your market.
            </p>
            <Link
              to="https://tally.so/r/zxOg9q"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors duration-200 hover:bg-[#1E3A5F] hover:text-white active:bg-[#1E3A5F] active:text-white"
            >
              Start Selling Today
            </Link>
          </div>
        </div>
      </section>

      <section id="why-bryge" className="scroll-mt-20 bg-[#F3F3F3] px-6 py-[90px] md:scroll-mt-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-[16px] font-semibold tracking-wide text-[#6F89A7]">Founding Vendor Applications Now Open</p>
          <h2 className="mt-3 max-w-[620px] font-instrument text-[30px] font-medium leading-tight text-navy md:text-[36px]">
            You've built something worth
            <br />
            sharing with the world.
          </h2>
          <div className="mt-7 max-w-[900px] space-y-4 border-l border-[#6F89A7] pl-4 text-sm leading-7 text-[#5F7087] md:text-base">
            <p>
              Maybe you've spent years building your business. You've perfected your craft. Refined your craftsmanship. Learnt through trial and error. Served loyal customers. Stayed consistent when business was slow.
            </p>
            <p>
              You know the quality of what you create. The challenge isn't your products. It's reaching the people who would love them.
            </p>
            <p>
              Selling beyond Nigeria can feel overwhelming. International logistics. Payments. Finding trusted customers. Knowing where to begin.
            </p>
            <p>
              That's where BRYGE comes in.
            </p>
            <p>
              We're building a trusted cross-border marketplace connecting exceptional Nigerian businesses with customers around the world.
            </p>
            <p>
              We're currently inviting a select group of businesses to become our Founding Vendors ahead of launch. If you're ready to take your business beyond borders, we'd love to hear your story.
            </p>
          </div>

          <div className="mt-12 rounded-2xl bg-[#1E3A5F] p-[40px] text-white md:mt-16 md:p-[50px]">
            <h3 className="font-instrument text-[25px] font-medium leading-[1.05] md:text-[44px]">Why BRYGE exists</h3>
            <div className="mt-4 max-w-[940px] space-y-4 text-[16px] leading-[1.35] text-white/95 md:mt-8 md:text-[20px] md:leading-[1.2]">
              <p>Nigeria is home to remarkable businesses.</p>
              <p>Businesses built on craftsmanship, creativity, resilience and years of experience.</p>
              <p>Yet too many remain difficult for global customers to discover, trust and purchase from.</p>
              <p>
                Not because the quality isn&apos;t there.
                <br />
                But because selling internationally often comes with unnecessary complexity.
              </p>
              <p>BRYGE exists to change that.</p>
              <p>We&apos;re building the bridge between trusted Nigerian businesses and customers around the world.</p>
              <p>
                By bringing together secure payments, trusted logistics and carefully selected businesses, we&apos;re creating a
                simpler way for great products to reach the people looking for them.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="founding-vendors" className="scroll-mt-20 bg-[#F3F3F3] px-6 py-[90px] md:scroll-mt-24 md:px-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[1fr_480px] lg:items-start lg:gap-16">
          <div className="max-w-[620px]">
            <h2 className="font-instrument text-[30px] font-medium leading-[1.1] text-navy md:text-[36px]">
              Great businesses shouldn&apos;t be
              <br />
              limited by geography.
            </h2>

            <div className="mt-10 space-y-4 text-[16px] leading-[1.25] text-[#4E6078]">
              <p>You might be creating beautiful Ankara dresses in Lagos.</p>
              <p>Handcrafting leather goods in Kano.</p>
              <p>Weaving vibrant Aso Oke fabrics in Enugu.</p>
              <p>Designing jewellery that people constantly ask about.</p>
              <p>Or building a family business that&apos;s served your community for decades.</p>
              <p>
                Whatever you create, your customers shouldn&apos;t be limited to
                <br />
                the people who happen to walk past your shop.
              </p>
            </div>

            <div className="mt-10 border-l border-[#8FA0B5] pl-4">
              <p className="text-[25px] font-semibold leading-[1.15] text-[#8698AE] md:text-[24px]">
                Your products deserve to be discovered.
                <br />
                Not because they&apos;re Nigerian.
                <br />
                Because they&apos;re exceptional.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[480px] overflow-hidden lg:mx-0">
            <img
              src="/brand/Great%20businesses.jpg"
              alt="Artisan crafting fabric"
              className="h-full min-h-[420px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#1E3A5F] px-6 py-[90px] md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-instrument text-[30px] font-medium leading-[1.1] text-white md:text-[36px]">
            Why we&apos;re inviting businesses before launch
          </h2>

          <div className="mt-5 max-w-[920px] space-y-4 text-[16px] leading-[1.3] text-white/90">
            <p>We&apos;re building BRYGE differently.</p>
            <p>Rather than opening the platform to thousands of businesses from day one, we&apos;re intentionally growing in phases.</p>
            <p>We&apos;re looking for businesses that care about quality, consistency and long-term relationships.</p>
            <p>
              Businesses that take pride in what they create.
              <br />
              Businesses that want to grow alongside us.
            </p>
          </div>

          <p className="my-[30px] max-w-[760px] font-instrument text-[25px] font-medium leading-[1.2] text-white md:text-[24px]">
            Our Founding Vendors won&apos;t simply join BRYGE.
            <br />
            They&apos;ll help shape it.
          </p>

          <div className="relative mt-10 overflow-hidden">
            <img
              src="/brand/Why%20we%E2%80%99re%20inviting.jpg"
              alt="Bryge founding vendor conversation"
              className="h-[420px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#F3F3F3] px-6 py-[90px] md:px-10">
        <div className="mx-auto max-w-6xl text-navy">
          <h2 className="font-instrument text-[30px] font-medium leading-[1.1] text-navy md:text-[36px]">
            Why become a Founding Vendor?
          </h2>

          <div className="mt-6 max-w-[780px] space-y-4 text-[16px] leading-[1.35] text-[#5F7087]">
            <p>Building something meaningful takes time.</p>
            <p>So does building trust.</p>
            <p>
              As one of our Founding Vendors, you&apos;ll have the opportunity to join BRYGE before our public launch and grow
              with us from the very beginning.
            </p>
            <p>You&apos;ll receive:</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {foundingVendorBenefits.map((item) => (
              <article
                key={item}
                className="min-h-[92px] rounded-[14px] border border-[#C8D2E0] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
              >
                <div className="h-6 w-6 text-[#6B8F74]">
                  <BenefitIcon type={item.icon} />
                </div>
                <p className="mt-4 max-w-[240px] text-[16px] leading-[1.25] text-[#5F7087]">{item.title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F3EC] px-6 py-[90px] md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-instrument text-[30px] font-medium leading-[1.1] text-navy md:text-[36px]">Imagine what could be possible.</h2>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-9">
            {imagineCards.map((card, index) => (
              <article
                key={card}
                className={`rounded-[14px] border border-[#D5DCE5] bg-white p-5 md:p-7 ${index === 1 ? 'md:translate-y-10' : ''} ${index === 2 ? 'md:translate-y-2' : ''} ${index === 3 ? 'md:translate-y-12' : ''}`}
              >
                <p className="text-[34px] leading-none text-[#1E2430]">&ldquo;</p>
                <p className="mt-3 text-[16px] leading-[1.3] text-[#4F6484]">{card}</p>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-20 max-w-[520px] text-center text-[16px] leading-[1.3] text-[#4F6484]">
            The right customers already exist.
            <br />
            Sometimes they simply need a bridge to find you.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-[90px] md:px-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[420px_1fr] lg:items-center lg:gap-14">
          <div className="mx-auto w-full max-w-[420px] overflow-hidden lg:mx-0">
            <img
              src="/brand/we%20are%20building.jpg"
              alt="Artisan weaving fabric"
              className="h-full min-h-[520px] w-full object-cover"
            />
          </div>

          <div className="max-w-[760px] text-navy">
            <h2 className="font-instrument text-[30px] font-medium leading-[1.12] text-navy md:text-[36px]">
              We&apos;re building with people, not
              <br />
              just products.
            </h2>

            <div className="mt-8 space-y-5 text-[16px] leading-[1.32] text-[#4F6484]">
              <p>Behind every product is a person. Behind every business is a story.</p>

              <p>
                At BRYGE, we&apos;re interested in more than what you sell.
                <br />
                We want to know the people behind the businesses we partner with.
              </p>

              <p>
                The founders.
                <br />
                The families.
                <br />
                The late nights.
                <br />
                The early mornings.
                <br />
                The years you&apos;ve spent perfecting your craft.
              </p>

              <p>
                Because lasting partnerships aren&apos;t built on transactions.
                <br />
                They&apos;re built on trust.
              </p>

              <p>
                As BRYGE grows, we hope to celebrate the stories behind the businesses we work with and
                <br />
                shine a light on the people building remarkable things across Nigeria.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F3F3] px-6 py-[90px] md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-instrument text-[30px] font-medium leading-[1.1] text-navy md:text-[36px]">Our Initial Launch Categories</h2>
          <p className="mt-4 max-w-[420px] text-[16px] leading-[1.28] text-[#5F7087]">
            We&apos;re currently welcoming applications from businesses across our initial launch categories.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
            <div className="relative">
              <div className="absolute bottom-0 left-[52px] top-0 w-px bg-[#9FB0C3] md:left-[66px]" aria-hidden="true" />
              <div className="space-y-7">
                {launchCategories.map((category, index) => (
                  <div key={category.title} className="grid grid-cols-[42px_1fr] gap-5 md:grid-cols-[56px_1fr] md:gap-10">
                    <p className="text-[25px] leading-none text-[#97A8BD]">{String(index + 1).padStart(2, '0')}</p>
                    <div className="pl-1 md:pl-2">
                      <h3 className="text-[20px] font-medium leading-[1.2] text-navy">{category.title}</h3>
                      <p className="mt-2 max-w-[460px] text-[16px] leading-[1.25] text-[#5F7087]">{category.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[620px] lg:mx-0">
              <div className="relative h-[560px] w-full md:h-[620px]">
                <div className="absolute right-0 top-0 z-20 overflow-hidden">
                  <img src="/brand/Who%20sells%201.jpg" alt="Market transaction" className="h-[250px] w-[330px] object-cover md:h-[300px] md:w-[380px]" />
                </div>
                <div className="absolute left-0 top-[140px] z-30 overflow-hidden">
                  <img src="/brand/who%20sells%202.jpg" alt="Fashion studio" className="h-[280px] w-[290px] object-cover md:h-[340px] md:w-[350px]" />
                </div>
                <div className="absolute bottom-0 right-0 z-10 overflow-hidden">
                  <img src="/brand/Who%20sells%203.jpg" alt="Home-based vendor" className="h-[180px] w-[300px] object-cover md:h-[210px] md:w-[360px]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
            <p className="text-[16px] leading-[1.3] text-[#5F7087]">
              If your products don&apos;t fit neatly into one of these categories but you believe they&apos;re a great fit for BRYGE,
              we&apos;d still love to hear from you.
            </p>
            <div className="hidden h-12 w-px bg-[#9FB0C3] md:block" />
            <p className="text-[16px] leading-[1.3] text-[#5F7087]">
              We&apos;re launching intentionally with a carefully selected range of categories, with additional categories planned
              as BRYGE grows.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-cream px-6 py-[90px] md:scroll-mt-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-[560px] font-instrument text-[30px] font-medium leading-[1.08] text-navy md:text-[36px]">How it works</h2>
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
            {featureCards.map((card) => (
              <article key={card.title} className={`relative min-h-[220px] rounded-xl px-5 pt-14 ${card.tone}`}>
                <div className="absolute left-0 top-8 rounded-r-full bg-[#F5F1E8] px-4 py-2 pr-6 text-sm font-medium text-[#1E3A5F]">
                  <span className="inline-flex items-center gap-2">
                    <FeatureIcon type={card.icon} />
                    <span>{card.title}</span>
                  </span>
                </div>
                <p className="mb-[50px] mt-[50px] text-[15px] leading-[1.35] text-white/95">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F3F3F3] px-6 py-[90px] md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-instrument text-[30px] font-medium leading-[1.1] text-navy md:text-[36px]">What we believe</h2>

          <div className="relative mt-10">
            <div className="absolute bottom-0 left-[70px] top-0 w-px bg-[#9FB0C3] md:left-[92px]" aria-hidden="true" />
            <div className="space-y-8 md:space-y-10">
              {beliefRows.map((belief, index) => (
                <div key={belief} className="grid grid-cols-[44px_1fr] gap-4 md:grid-cols-[72px_1fr] md:gap-6">
                  <p className="relative z-10 text-[25px] font-medium leading-none text-[#97A8BD]">{String(index + 1).padStart(2, '0')}</p>
                  <p className="max-w-[900px] pl-5 text-[19px] font-medium leading-[1.2] text-[#5F7087] md:pl-8">{belief}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 bg-[#F5F3EC] px-6 py-[90px] md:scroll-mt-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-instrument text-[30px] font-medium leading-[1.08] text-navy md:text-[36px]">Frequently Asked Questions</h2>

          <div className="mx-auto mt-12 max-w-[900px]">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;

              return (
                <div key={item.question} className="border-b border-[#D3D8DF]">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-instrument text-[20px] font-medium leading-[1.2] text-navy">{item.question}</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-6 w-6 shrink-0 text-[#7C8EA6] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {isOpen && (
                    <p className="pb-7 pr-8 text-[16px] leading-[1.45] text-navy/95">{item.answer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F3F3F3] px-[6px] py-[90px] md:px-10">
        <div className="mx-auto w-full max-w-[1240px] px-0 sm:px-10">
          <div className="grid grid-cols-1 gap-8 rounded-[18px] bg-[#1E3A5F] px-[40px] pt-[40px] pb-[40px] md:grid-cols-2 md:items-center md:gap-10 md:px-10 md:pb-10 lg:px-12 lg:pb-12">
            <div className="max-w-[520px] px-0 pb-6 md:pb-0">
              <h3 className="font-instrument text-[30px] font-medium leading-[1.2] text-white md:text-[40px]">
                Your Products Deserve a
                <br />
                Global Stage
              </h3>
              <p className="font-instrument mt-5 max-w-[500px] text-[16px] leading-[1.25] text-white">
                Thousands of Nigerians abroad are looking for exactly what
                <br />
                you sell. Join Bryge and start reaching them today.
              </p>
              <Link
                to="https://tally.so/r/zxOg9q"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex min-w-[190px] justify-center rounded-2xl bg-[#F5F1E8] px-6 py-3 text-[17px] font-medium text-[#1E3A5F]"
              >
                Become a Vendor
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl px-0 pb-0 md:h-full">
              <img src="/brand/vendor-cta.jpeg" alt="Vendor call to action" className="h-[280px] w-full object-cover md:h-full md:min-h-[320px]" />
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#1E3A5F] px-6 py-14 md:px-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            <div>
              <img src="/brand/logo-wordmark-cream.png" alt="Bryge" className="h-auto w-32" />
              <p className="mt-5 text-[16px] leading-[1.3] text-white/85">Bridging Markets, Building trust.</p>
            </div>

            <div className="space-y-4 text-[16px] text-white/90">
              <a href="mailto:vendors@bryge.com.ng" className="inline-flex items-center gap-2 transition-colors hover:text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                vendors@bryge.com.ng
              </a>
              <a href="https://x.com/brygehq" target="_blank" rel="noreferrer" className="block transition-colors hover:text-white">@brygehq</a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="block transition-colors hover:text-white">LinkedIn</a>
            </div>

            <nav className="space-y-4 text-[16px] text-white/90 md:justify-self-end md:text-right">
              <a href="#why-bryge" className="block transition-colors hover:text-white">Why BRYGE</a>
              <a href="#how-it-works" className="block transition-colors hover:text-white">How It Works</a>
              <a href="#faq" className="block transition-colors hover:text-white">FAQ</a>
              <a href="https://tally.so/r/zxOg9q" target="_blank" rel="noreferrer" className="block transition-colors hover:text-white">Apply</a>
            </nav>
          </div>

          <div className="mt-10 border-t border-white/15 pt-7">
            <div className="flex flex-col gap-4 text-[15px] text-white/75 md:flex-row md:items-center md:justify-between">
              <p>© 2026 BRYGE. All rights reserved.</p>
              <a href="#top" className="inline-flex items-center gap-2 transition-colors hover:text-white">
                Back to top
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 18V6" />
                  <path d="m7 11 5-5 5 5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
