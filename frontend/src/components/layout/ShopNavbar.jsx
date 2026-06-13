import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function ShopNavbar() {
  const { user }       = useAuth();
  const { cartCount }  = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin' || user.role === 'sub_admin') return '/admin/dashboard';
    if (user.role === 'vendor') return '/vendor/dashboard';
    return '/dashboard';
  };

  return (
    <nav className="bg-navy sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/">
          <img src="/brand/logo-wordmark-cream.png" alt="Bryge" className="w-28 h-auto" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/shop"
            className="text-white text-sm font-semibold border-b-2 border-rust pb-0.5">
            Shop
          </Link>
          <Link to="/#how-it-works"
            className="text-white/70 hover:text-white text-sm font-medium transition-colors">
            How It Works
          </Link>
          <Link to="/vendor/register"
            className="text-white/70 hover:text-white text-sm font-medium transition-colors">
            Become a Vendor
          </Link>
        </div>

        {/* Desktop auth + cart */}
        <div className="hidden md:flex items-center gap-3">
          {/* Cart */}
          <Link to="/cart" className="relative text-white/70 hover:text-white transition-colors p-1.5">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rust text-white text-[10px] font-bold
                               rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link to={dashboardPath()}
              className="bg-rust hover:bg-rust-dark text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login"
                className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                Login
              </Link>
              <Link to="/register"
                className="bg-rust hover:bg-rust-dark text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile: cart icon + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link to="/cart" className="relative text-white/80 p-1.5">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rust text-white text-[10px] font-bold
                               rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          <button className="text-white p-1.5" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? (
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-navy border-t border-white/10 px-4 py-4 space-y-1">
          <Link to="/shop" onClick={() => setMenuOpen(false)}
            className="block py-2.5 text-white text-sm font-semibold">
            Shop
          </Link>
          <Link to="/#how-it-works" onClick={() => setMenuOpen(false)}
            className="block py-2.5 text-white/70 hover:text-white text-sm font-medium">
            How It Works
          </Link>
          <Link to="/vendor/register" onClick={() => setMenuOpen(false)}
            className="block py-2.5 text-white/70 hover:text-white text-sm font-medium">
            Become a Vendor
          </Link>
          <div className="pt-3 border-t border-white/10 flex gap-3 items-center">
            {user ? (
              <Link to={dashboardPath()} onClick={() => setMenuOpen(false)}
                className="bg-rust text-white text-sm font-semibold px-5 py-2 rounded-full">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="text-white/80 text-sm font-medium py-2">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="bg-rust text-white text-sm font-semibold px-5 py-2 rounded-full">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
