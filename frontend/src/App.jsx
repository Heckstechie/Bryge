import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// ── Customer auth ─────────────────────────────────────────────────────────────
import Login            from './pages/auth/Login';
import RegisterLanding  from './pages/auth/RegisterLanding';
import RoleSelect       from './pages/auth/RoleSelect';
import CustomerRegister from './pages/auth/CustomerRegister';
import VerifyEmail      from './pages/auth/VerifyEmail';
import ForgotPassword   from './pages/auth/ForgotPassword';
import ResetPassword    from './pages/auth/ResetPassword';

// ── Admin auth ────────────────────────────────────────────────────────────────
import AdminLogin from './pages/auth/admin/AdminLogin';

// ── Admin dashboard ───────────────────────────────────────────────────────────
import AdminDashboard          from './pages/admin/AdminDashboard';
import AdminOrders             from './pages/admin/AdminOrders';
import AdminOrderDetail        from './pages/admin/AdminOrderDetail';
import AdminDisputes           from './pages/admin/AdminDisputes';
import AdminDisputeDetail     from './pages/admin/AdminDisputeDetail';
import AdminVendors            from './pages/admin/AdminVendors';
import AdminVendorDetail       from './pages/admin/AdminVendorDetail';
import AdminVendorApplication  from './pages/admin/AdminVendorApplication';
import AdminProducts           from './pages/admin/AdminProducts';
import AdminCategories   from './pages/admin/AdminCategories';
import AdminPayouts      from './pages/admin/AdminPayouts';
import AdminPayoutDetail from './pages/admin/AdminPayoutDetail';
import AdminSettings              from './pages/admin/AdminSettings';
import AdminPaymentGateways        from './pages/admin/AdminPaymentGateways';
import AdminReports                from './pages/admin/AdminReports';
import AdminVendorPerformance      from './pages/admin/AdminVendorPerformance';
import AdminTransactionHistory     from './pages/admin/AdminTransactionHistory';
import AdminProfile                from './pages/admin/AdminProfile';
import AdminManagement             from './pages/admin/AdminManagement';
import AdminCustomers              from './pages/admin/AdminCustomers';
import AdminCustomerDetail         from './pages/admin/AdminCustomerDetail';
import AdminNotifications          from './pages/admin/AdminNotifications';
import AdminRefunds                from './pages/admin/AdminRefunds';
import AdminAuditLog               from './pages/admin/AdminAuditLog';

// ── Vendor auth ───────────────────────────────────────────────────────────────
import VendorLogin           from './pages/auth/vendor/VendorLogin';
import VendorRegister        from './pages/auth/vendor/VendorRegister';
import VendorVerifyEmail     from './pages/auth/vendor/VendorVerifyEmail';
import VendorEmailVerified   from './pages/auth/vendor/VendorEmailVerified';
import VendorVerifyOTP       from './pages/auth/vendor/VendorVerifyOTP';
import VendorForgotPassword  from './pages/auth/vendor/VendorForgotPassword';
import VendorResetPassword   from './pages/auth/vendor/VendorResetPassword';

// ── Vendor app ────────────────────────────────────────────────────────────────
import VendorDashboard      from './pages/vendor/VendorDashboard';
import BankDetails           from './pages/vendor/BankDetails';
import MyProducts            from './pages/vendor/MyProducts';
import AddProduct            from './pages/vendor/AddProduct';
import VendorOnboarding      from './pages/vendor/onboarding/VendorOnboarding';
import VendorActivate        from './pages/vendor/VendorActivate';
import VendorOrders          from './pages/vendor/VendorOrders';
import VendorWithdraw        from './pages/vendor/VendorWithdraw';
import VendorTransactions    from './pages/vendor/VendorTransactions';
import VendorNotifications   from './pages/vendor/VendorNotifications';
import VendorSettings        from './pages/vendor/VendorSettings';

// ── Shop (public storefront) ──────────────────────────────────────────────────
import ShopPage          from './pages/shop/ShopPage';
import ProductDetail     from './pages/shop/ProductDetail';
import CartPage          from './pages/shop/CartPage';
import CheckoutPage      from './pages/shop/CheckoutPage';
import OrderConfirmation from './pages/orders/OrderConfirmation';

// ── Route guards ──────────────────────────────────────────────────────────────

function ProtectedRoute({ children, allow }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <RoleRedirect role={user.role} user={user} />;
  return children;
}

function RoleRedirect({ role, user }) {
  if (role === 'admin' || role === 'sub_admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'vendor') {
    // Active vendors → dashboard; pending/rejected/suspended → onboarding wizard
    return user?.vendor_status === 'active'
      ? <Navigate to="/vendor/dashboard" replace />
      : <Navigate to="/vendor/activate"  replace />;
  }
  return <Navigate to="/shop" replace />;   // customers
}

// Admin-specific guest guard — redirects to /admin/login instead of /login
function AdminGuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user && (user.role === 'admin' || user.role === 'sub_admin'))
    return <Navigate to="/admin/dashboard" replace />;
  if (user) return <RoleRedirect role={user.role} user={user} />;
  return children;
}

function Spinner() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* ── Customer auth ── */}
      <Route path="/login"            element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"         element={<GuestRoute><RegisterLanding /></GuestRoute>} />
      <Route path="/register/role"    element={<GuestRoute><RoleSelect /></GuestRoute>} />
      <Route path="/register/details" element={<GuestRoute><CustomerRegister /></GuestRoute>} />
      <Route path="/register/verify"  element={<VerifyEmail />} />
      <Route path="/forgot-password"  element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password"   element={<ResetPassword />} />

      {/* ── Vendor auth ── */}
      <Route path="/vendor/login"           element={<GuestRoute><VendorLogin /></GuestRoute>} />
      <Route path="/vendor/register"        element={<GuestRoute><VendorRegister /></GuestRoute>} />
      <Route path="/vendor/verify-email"    element={<VendorVerifyEmail />} />
      <Route path="/vendor/verify-otp"      element={<VendorVerifyOTP />} />
      <Route path="/vendor/email-verified"  element={<VendorEmailVerified />} />
      <Route path="/vendor/forgot-password" element={<GuestRoute><VendorForgotPassword /></GuestRoute>} />
      <Route path="/vendor/reset-password"  element={<VendorResetPassword />} />

      {/* ── Vendor onboarding ── */}
      <Route path="/vendor/onboarding"
        element={<ProtectedRoute allow={['vendor']}><VendorOnboarding /></ProtectedRoute>} />
      <Route path="/vendor/activate"
        element={<ProtectedRoute allow={['vendor']}><VendorActivate /></ProtectedRoute>} />

      {/* ── Vendor app ── */}
      <Route path="/vendor/dashboard"
        element={<ProtectedRoute allow={['vendor']}><VendorDashboard /></ProtectedRoute>} />
      <Route path="/vendor/bank-details"
        element={<ProtectedRoute allow={['vendor']}><BankDetails /></ProtectedRoute>} />

      {/* ── Vendor product management ── */}
      <Route path="/vendor/products"
        element={<ProtectedRoute allow={['vendor']}><MyProducts /></ProtectedRoute>} />
      <Route path="/vendor/products/add"
        element={<ProtectedRoute allow={['vendor']}><AddProduct /></ProtectedRoute>} />
      <Route path="/vendor/products/edit/:id"
        element={<ProtectedRoute allow={['vendor']}><AddProduct /></ProtectedRoute>} />

      {/* ── Vendor orders ── */}
      <Route path="/vendor/orders"
        element={<ProtectedRoute allow={['vendor']}><VendorOrders /></ProtectedRoute>} />

      {/* ── Vendor wallet ── */}
      <Route path="/vendor/withdraw"
        element={<ProtectedRoute allow={['vendor']}><VendorWithdraw /></ProtectedRoute>} />
      <Route path="/vendor/transactions"
        element={<ProtectedRoute allow={['vendor']}><VendorTransactions /></ProtectedRoute>} />
      <Route path="/vendor/notifications"
        element={<ProtectedRoute allow={['vendor']}><VendorNotifications /></ProtectedRoute>} />
      <Route path="/vendor/settings"
        element={<ProtectedRoute allow={['vendor']}><VendorSettings /></ProtectedRoute>} />

      {/* ── Public storefront ── */}
      <Route path="/shop"               element={<ShopPage />} />
      <Route path="/shop/product/:id"   element={<ProductDetail />} />
      <Route path="/cart"               element={<ProtectedRoute allow={['customer']}><CartPage /></ProtectedRoute>} />
      <Route path="/checkout"           element={<ProtectedRoute allow={['customer']}><CheckoutPage /></ProtectedRoute>} />
      <Route path="/order-confirmation/:id" element={<ProtectedRoute allow={['customer']}><OrderConfirmation /></ProtectedRoute>} />
      <Route path="/orders/:id"         element={<ProtectedRoute allow={['customer']}><OrderConfirmation /></ProtectedRoute>} />

      {/* ── Admin ── */}
      <Route path="/admin/login"
        element={<AdminGuestRoute><AdminLogin /></AdminGuestRoute>} />
      <Route path="/admin/dashboard"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/orders"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/customers"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminCustomers /></ProtectedRoute>} />
      <Route path="/admin/customers/:id"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminCustomerDetail /></ProtectedRoute>} />
      <Route path="/admin/notifications"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminNotifications /></ProtectedRoute>} />
      <Route path="/admin/orders/:id"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminOrderDetail /></ProtectedRoute>} />
      <Route path="/admin/disputes"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminDisputes /></ProtectedRoute>} />
      <Route path="/admin/disputes/under-review"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminDisputes /></ProtectedRoute>} />
      <Route path="/admin/disputes/resolved"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminDisputes /></ProtectedRoute>} />
      <Route path="/admin/disputes/:id"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminDisputeDetail /></ProtectedRoute>} />

      {/* Vendors — specific sub-routes before /:id */}
      <Route path="/admin/vendors/applications/:id"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminVendorApplication /></ProtectedRoute>} />
      <Route path="/admin/vendors/applications"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminVendors /></ProtectedRoute>} />
      <Route path="/admin/vendors/suspended"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminVendors /></ProtectedRoute>} />
      <Route path="/admin/vendors/:id"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminVendorDetail /></ProtectedRoute>} />
      <Route path="/admin/vendors"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminVendors /></ProtectedRoute>} />

      {/* Products */}
      <Route path="/admin/products"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminProducts /></ProtectedRoute>} />

      <Route path="/admin/payouts"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminPayouts /></ProtectedRoute>} />
      <Route path="/admin/payouts/completed"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminPayouts /></ProtectedRoute>} />
      <Route path="/admin/payouts/withdrawals"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminPayouts /></ProtectedRoute>} />
      <Route path="/admin/payouts/:id"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminPayoutDetail /></ProtectedRoute>} />
      <Route path="/admin/categories"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminCategories /></ProtectedRoute>} />
      <Route path="/admin/reports"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/reports/vendor-performance"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminVendorPerformance /></ProtectedRoute>} />
      <Route path="/admin/reports/transactions"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminTransactionHistory /></ProtectedRoute>} />
      <Route path="/admin/refunds"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminRefunds /></ProtectedRoute>} />
      <Route path="/admin/audit-log"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminAuditLog /></ProtectedRoute>} />
      <Route path="/admin/settings"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/settings/payment-gateways"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminPaymentGateways /></ProtectedRoute>} />
      <Route path="/admin/settings/admin-management"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminManagement /></ProtectedRoute>} />
      <Route path="/admin/profile"
        element={<ProtectedRoute allow={['admin','sub_admin']}><AdminProfile /></ProtectedRoute>} />

      {/* ── Default ── */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
