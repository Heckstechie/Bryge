export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src="/brand/logo-full-black.png" alt="Bryge" className="w-44 h-auto" />
        </div>
        {children}
      </div>
    </div>
  );
}
