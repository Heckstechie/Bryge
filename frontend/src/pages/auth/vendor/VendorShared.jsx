/**
 * Shared primitives for all vendor auth + onboarding screens.
 * Design tokens:
 *   bg-cream #EDE8DF · navy #1B2F5C · terracotta #C8603A
 *   green #3D6B4F · link-blue #2563EB · muted #8A9BB0
 */

// ─── Logo ────────────────────────────────────────────────────────────────────
export function BrygeLogo() {
  return (
    <span className="text-2xl font-bold text-navy tracking-tight select-none">
      Bryge
    </span>
  );
}

// ─── Pill input (auth screens) ────────────────────────────────────────────────
export function PillInput({ extraClass = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-white border border-[#E2DED8] rounded-full px-5 py-4
                  text-navy text-sm placeholder-[#C0BAB2]
                  focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40
                  transition-all ${extraClass}`}
    />
  );
}

// ─── Rounded-rect input (onboarding forms) ────────────────────────────────────
export function RectInput({ extraClass = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-white border border-[#D4CFC7] rounded-xl px-4 py-3
                  text-navy text-sm placeholder-[#C0BAB2]
                  focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40
                  transition-all ${extraClass}`}
    />
  );
}

// ─── Select (onboarding dropdowns) ───────────────────────────────────────────
export function SelectInput({ children, extraClass = '', ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none bg-white border border-[#D4CFC7] rounded-xl
                    px-4 py-3 text-navy text-sm
                    focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40
                    transition-all ${extraClass}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9BB0]">
        <ChevronDownIcon />
      </span>
    </div>
  );
}

// ─── Navy pill button ─────────────────────────────────────────────────────────
export function NavyButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`w-full bg-navy text-white font-semibold py-4 rounded-full
                  hover:bg-navy-700 active:scale-[0.98] transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed text-base ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Green pill button (welcome modal CTA) ────────────────────────────────────
export function GreenButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`px-8 py-2.5 bg-[#3D6B4F] text-white font-medium rounded-full text-sm
                  hover:bg-[#325c43] active:scale-[0.98] transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Eye toggle for password inputs ──────────────────────────────────────────
export function ToggleEye({ show, onToggle }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0AAB8] hover:text-navy transition-colors"
    >
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

// ─── Business type card (register + onboarding) ───────────────────────────────
export function BusinessTypeCard({ value, selected, onSelect, label, description, icon }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all ${
        selected
          ? 'border-navy bg-navy/5'
          : 'border-[#E2DED8] bg-white hover:border-navy/40'
      }`}
    >
      {icon && (
        <span className="flex-none text-2xl mt-0.5">{icon}</span>
      )}
      <span className="flex-1">
        <span className="block font-semibold text-navy text-sm">{label}</span>
        <span className="block text-[#8A9BB0] text-xs mt-0.5 leading-relaxed">{description}</span>
      </span>
      <span className={`flex-none mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
        selected ? 'border-navy' : 'border-[#C0BAB2]'
      }`}>
        {selected && <span className="w-2.5 h-2.5 rounded-full bg-navy" />}
      </span>
    </button>
  );
}

// ─── OTP input (6 individual boxes) ──────────────────────────────────────────
export function OTPBoxes({ value, onChange }) {
  const digits = (value + '      ').slice(0, 6).split('');

  function handleKey(e, idx) {
    const key = e.key;
    if (key === 'Backspace') {
      const next = value.slice(0, idx);
      onChange(next);
      if (idx > 0) focusBox(idx - 1);
      return;
    }
    if (key === 'ArrowLeft' && idx > 0) { focusBox(idx - 1); return; }
    if (key === 'ArrowRight' && idx < 5) { focusBox(idx + 1); return; }
    if (!/^\d$/.test(key)) return;
    const next = value.slice(0, idx) + key + value.slice(idx + 1);
    onChange(next.slice(0, 6));
    if (idx < 5) focusBox(idx + 1);
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(text);
    focusBox(Math.min(text.length, 5));
  }

  function focusBox(idx) {
    document.getElementById(`otp-box-${idx}`)?.focus();
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-box-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          readOnly
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-semibold
                      bg-white border-2 rounded-2xl text-navy
                      focus:outline-none focus:border-navy transition-colors
                      ${d.trim() ? 'border-navy' : 'border-[#D4CFC7]'}`}
        />
      ))}
    </div>
  );
}

// ─── Envelope illustration (verify email screens) ─────────────────────────────
export function EnvelopeIllustration({ verified = false }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="140" viewBox="0 0 180 140" fill="none"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="10" y="30" width="160" height="100" rx="10" fill="#F0EBE2" />
        <rect x="10" y="30" width="160" height="100" rx="10" fill="url(#envGrad)" />
        <path d="M10 38 Q90 0 170 38 L170 30 Q90 -10 10 30 Z" fill="#E5DDD3" />
        <path d="M45 30 L90 60 L135 30 Z" fill="#C8603A" />
        <path d="M45 30 L90 60 L90 55 L50 28 Z" fill="#B85530" opacity="0.4"/>
        <path d="M135 30 L90 60 L90 55 L130 28 Z" fill="#D4714B" opacity="0.3"/>
        <path d="M10 130 L75 80" stroke="#D8D0C5" strokeWidth="1" />
        <path d="M170 130 L105 80" stroke="#D8D0C5" strokeWidth="1" />
        <ellipse cx="90" cy="136" rx="60" ry="5" fill="#C8BFB4" opacity="0.35"/>
        <defs>
          <linearGradient id="envGrad" x1="90" y1="30" x2="90" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#000000" stopOpacity="0.04"/>
          </linearGradient>
        </defs>
      </svg>
      {verified && (
        <span className="absolute -right-2 top-1/2 -translate-y-1/2 bg-[#4CAF50] rounded-full p-2 shadow-md">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white"
               strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </span>
      )}
    </div>
  );
}

// ─── Lock + Key illustration (forgot / reset password) ───────────────────────
export function LockKeyIllustration() {
  return (
    <div className="inline-flex items-center justify-center relative">
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Lock body */}
        <rect x="20" y="68" width="90" height="70" rx="12" fill="#C8603A"/>
        <rect x="20" y="68" width="90" height="70" rx="12" fill="url(#lockShade)"/>
        {/* Lock shackle / arch */}
        <path d="M35 68 L35 44 Q35 20 65 20 Q95 20 95 44 L95 68"
              stroke="#E8D5B0" strokeWidth="14" strokeLinecap="round" fill="none"/>
        {/* Keyhole circle */}
        <circle cx="65" cy="100" r="10" fill="#1B2F5C" opacity="0.5"/>
        {/* Keyhole slot */}
        <rect x="62" y="100" width="6" height="14" rx="3" fill="#1B2F5C" opacity="0.5"/>
        {/* Key */}
        <circle cx="125" cy="42" r="14" stroke="#1B2F5C" strokeWidth="6" fill="none"/>
        <rect x="131" y="38" width="22" height="7" rx="3" fill="#1B2F5C"/>
        <rect x="148" y="45" width="6" height="8" rx="2" fill="#1B2F5C"/>
        <rect x="140" y="45" width="6" height="6" rx="2" fill="#1B2F5C"/>
        {/* Drop shadow */}
        <ellipse cx="65" cy="142" rx="45" ry="5" fill="#C8BFB4" opacity="0.35"/>
        <defs>
          <linearGradient id="lockShade" x1="65" y1="68" x2="65" y2="138"
                          gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#000000" stopOpacity="0.06"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Onboarding step tracker (desktop sidebar) ────────────────────────────────
export function SidebarSteps({ steps, current }) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((s, i) => {
        const state = current > s.id ? 'done' : current === s.id ? 'active' : 'upcoming';
        const isLast = i === steps.length - 1;
        return (
          <div key={s.id} className="flex gap-3 items-start">
            {/* Circle + line column */}
            <div className="flex flex-col items-center">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-none z-10 transition-colors ${
                state === 'active' ? 'bg-navy text-white' :
                state === 'done'   ? 'bg-navy text-white' :
                'border-2 border-[#D4CFC7] text-[#A0AAB8] bg-cream'
              }`}>
                {state === 'done' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke="white" strokeWidth={3} strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                ) : s.id}
              </span>
              {!isLast && (
                <span className={`w-0.5 flex-1 min-h-[28px] transition-colors ${
                  state === 'done' ? 'bg-navy' : 'bg-[#D4CFC7]'
                }`} />
              )}
            </div>
            {/* Label */}
            <div className="pb-7 pt-1">
              <span className={`text-sm font-medium transition-colors ${
                state === 'upcoming' ? 'text-[#A0AAB8]' : 'text-navy'
              }`}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Onboarding step tracker (mobile top bar) ─────────────────────────────────
export function MobileStepBar({ steps, current }) {
  return (
    <div className="flex items-center w-full mb-8">
      {steps.map((s, i) => {
        const state = current > s.id ? 'done' : current === s.id ? 'active' : 'upcoming';
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-none transition-colors ${
                state === 'active' ? 'bg-navy text-white' :
                state === 'done'   ? 'bg-navy text-white' :
                'border-2 border-[#D4CFC7] text-[#A0AAB8]'
              }`}>
                {state === 'done' ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="white" strokeWidth={3} strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                ) : s.id}
              </span>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                state === 'upcoming' ? 'text-[#A0AAB8]' : 'text-navy'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 transition-colors ${
                state === 'done' ? 'bg-navy' : 'bg-[#D4CFC7]'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Welcome modal ────────────────────────────────────────────────────────────
export function WelcomeModal({ onActivate }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-cream rounded-3xl shadow-xl w-full max-w-sm p-8 text-center">
        <h2 className="text-xl font-bold text-navy mb-3">Welcome to BRYGE</h2>
        <p className="text-[#8A9BB0] text-sm leading-relaxed mb-6">
          Your business is in test mode so you can start using BRYGE right away.
          To start publishing products, submit your compliance forms.
        </p>
        <GreenButton onClick={onActivate}>
          Submit Compliance Forms
        </GreenButton>
      </div>
    </div>
  );
}

// ─── Document row (activate screen) ──────────────────────────────────────────
export function DocRow({ label, status, onUpload }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#EDE8DF] last:border-0">
      <div className="flex items-center gap-3">
        <span className={`flex-none w-5 h-5 rounded-full flex items-center justify-center text-xs ${
          status === 'uploaded'
            ? 'bg-[#3D6B4F] text-white'
            : 'border-2 border-[#D4CFC7]'
        }`}>
          {status === 'uploaded' && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                 stroke="white" strokeWidth={3} strokeLinecap="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          )}
        </span>
        <span className="text-navy text-sm">{label}</span>
      </div>
      <button
        type="button"
        onClick={onUpload}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-none ${
          status === 'uploaded'
            ? 'border-[#3D6B4F] bg-[#3D6B4F]/10'
            : 'border-[#D4CFC7] hover:border-navy'
        }`}
      >
        {status === 'uploaded'
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3D6B4F" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A0AAB8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        }
      </button>
    </div>
  );
}

// ─── Yes / No pill toggle ────────────────────────────────────────────────────
export function YesNoToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-[#D4CFC7] overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-6 py-2 text-sm font-semibold transition-colors ${
          value ? 'bg-navy text-white' : 'bg-white text-[#8A9BB0]'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-6 py-2 text-sm font-semibold transition-colors ${
          !value ? 'bg-navy text-white' : 'bg-white text-[#8A9BB0]'
        }`}
      >
        No
      </button>
    </div>
  );
}

// ─── Inner horizontal step bar (for sub-steps within a section) ───────────────
export function InnerStepBar({ steps, current }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((s, i) => {
        const state = current > s.id ? 'done' : current === s.id ? 'active' : 'upcoming';
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 flex-none">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-none transition-colors ${
                state === 'active' ? 'bg-navy text-white' :
                state === 'done'   ? 'bg-navy text-white' :
                'bg-[#D4CFC7] text-[#8A9BB0]'
              }`}>
                {state === 'done' ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="white" strokeWidth={3} strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                ) : s.id}
              </span>
              <span className={`text-sm font-medium whitespace-nowrap hidden sm:block ${
                state === 'upcoming' ? 'text-[#A0AAB8]' : 'text-navy'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 transition-colors ${
                state === 'done' ? 'bg-navy' : 'bg-[#D4CFC7]'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── File drop zone ───────────────────────────────────────────────────────────
import { useRef, useState as useDropState } from 'react';

export function FileDropZone({ onFile, file, accept = '.pdf,.jpg,.jpeg,.png' }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useDropState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                  transition-colors select-none ${
        dragging
          ? 'border-navy bg-navy/5'
          : file
          ? 'border-[#3D6B4F] bg-[#3D6B4F]/5'
          : 'border-[#D4CFC7] hover:border-navy/40 bg-white'
      }`}
    >
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">📄</span>
          <p className="text-[#3D6B4F] text-sm font-medium">{file.name}</p>
          <p className="text-[#8A9BB0] text-xs">Click to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <UploadCloudIcon />
          <p className="text-[#8A9BB0] text-sm">Drag files here or click to upload</p>
          <p className="text-[#C0BAB2] text-xs">JPG, JPEG, PNG or PDF · Max 10 MB</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ─── Labeled field wrapper ────────────────────────────────────────────────────
export function Field({ label, error, optional, children }) {
  return (
    <div>
      <label className="block text-navy text-sm font-medium mb-1.5">
        {label}{optional && <span className="text-[#A0AAB8] font-normal ml-1">(Optional)</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5 px-1">{error}</p>}
    </div>
  );
}

// ─── SVG icons ────────────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

function UploadCloudIcon() {
  return (
    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#A0AAB8" strokeWidth={1.5}
         strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}
