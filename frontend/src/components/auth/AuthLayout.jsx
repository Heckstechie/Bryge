export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-navy tracking-tight">Bryge</span>
        </div>
        {children}
      </div>
    </div>
  );
}
