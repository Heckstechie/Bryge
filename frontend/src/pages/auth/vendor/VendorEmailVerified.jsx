import { Link } from 'react-router-dom';
import { BrygeLogo, EnvelopeIllustration } from './VendorShared';

export default function VendorEmailVerified() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="flex-none px-6 pt-8 flex justify-center">
        <BrygeLogo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-6">

          {/* Envelope with green verified badge */}
          <EnvelopeIllustration verified={true} />

          {/* Heading */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4">
              Email Verified
            </h1>
            <p className="text-[#8A9BB0] text-base leading-relaxed">
              Your email has been verified successfully.
              <br />
              You can now sign in to your vendor account.
            </p>
          </div>

          {/* Login link */}
          <Link
            to="/vendor/login"
            className="text-blue-600 font-medium text-base hover:underline"
          >
            Click here to login
          </Link>

        </div>
      </main>
    </div>
  );
}
