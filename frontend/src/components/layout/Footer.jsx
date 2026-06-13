import { Link } from 'react-router-dom';

const PAGES = [
  { label: 'Home Page',       to: '/' },
  { label: 'Shop Page',       to: '/shop' },
  { label: 'My Account',      to: '/dashboard' },
  { label: 'Track My Order',  to: '/dashboard/orders' },
  { label: 'Become a Vendor', to: '/vendor/register' },
];

const COMPANY = [
  { label: 'Contact Us',      to: '#' },
  { label: 'About Bryge',     to: '#' },
  { label: 'Reviews',         to: '#' },
  { label: 'Terms of Service',to: '#' },
  { label: 'Privacy Policy',  to: '#' },
];

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0F1419]">
      {/* ── Main card ── */}
      <div className="mx-3 sm:mx-6 lg:mx-10 pt-8">
        <div className="bg-[#F0EDE7] rounded-2xl sm:rounded-3xl px-6 sm:px-10 lg:px-16 pt-10 sm:pt-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10 sm:mb-14">

            {/* Brand column */}
            <div>
              <Link to="/">
                <img src="/brand/logo-full-black.png" alt="Bryge" className="w-28 h-auto mb-4" />
              </Link>
              <p className="text-sm text-[#6B7685] leading-relaxed mb-3">
                For inquiries about your Bryge account, payments, and orders, please send your requests to
              </p>
              <a
                href="mailto:support@bryge.com.ng"
                className="text-sm font-semibold text-navy underline underline-offset-2 hover:text-rust transition-colors break-all"
              >
                support@bryge.com.ng
              </a>
            </div>

            {/* Pages */}
            <div>
              <h4 className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#9AA4B2] mb-5">
                Pages
              </h4>
              <ul className="space-y-3">
                {PAGES.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to}
                      className="text-sm text-[#3D4B5C] hover:text-navy transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#9AA4B2] mb-5">
                Company
              </h4>
              <ul className="space-y-3">
                {COMPANY.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to}
                      className="text-sm text-[#3D4B5C] hover:text-navy transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Socials */}
            <div>
              <h4 className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#9AA4B2] mb-5">
                Our Socials
              </h4>
              <div className="flex items-center gap-3">
                {[
                  { href: '#', icon: <WhatsAppIcon />, label: 'WhatsApp' },
                  { href: '#', icon: <InstagramIcon />, label: 'Instagram' },
                  { href: '#', icon: <FacebookIcon />, label: 'Facebook' },
                ].map(({ href, icon, label }) => (
                  <a key={label} href={href} aria-label={label}
                    className="w-10 h-10 rounded-full bg-[#1A2B20] flex items-center justify-center
                               hover:bg-navy transition-colors">
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="border-t border-[#D6D0C8] py-5">
            <p className="text-xs text-[#9AA4B0]">
              All Rights Reserved {new Date().getFullYear()} Bryge Global Services Limited
            </p>
          </div>
        </div>
      </div>

      {/* ── Payment channels ── */}
      <div className="py-7 px-4 text-center">
        <p className="text-[10px] tracking-[0.22em] text-white/30 uppercase mb-4">
          Your Secure Payment Channels
        </p>
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {[
            { name: 'VISA',       bg: '#1A1F71', text: '#FFFFFF' },
            { name: 'MASTERCARD', bg: '#252525', text: '#EB001B' },
            { name: 'PAYSTACK',   bg: '#01B8C8', text: '#FFFFFF' },
            { name: 'PAYPAL',     bg: '#003087', text: '#FFFFFF' },
            { name: 'STRIPE',     bg: '#635BFF', text: '#FFFFFF' },
          ].map(({ name, bg, text }) => (
            <span key={name}
              className="text-[10px] font-bold tracking-wider px-3 py-1.5 rounded"
              style={{ backgroundColor: bg, color: text }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
