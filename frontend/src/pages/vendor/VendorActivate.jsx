import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  BrygeLogo, NavyButton, RectInput, SelectInput,
  DocRow, YesNoToggle, InnerStepBar, FileDropZone, Field,
} from '../auth/vendor/VendorShared';

// ── Nationalities ─────────────────────────────────────────────────────────────
const NATIONALITIES = [
  'Afghan','Albanian','Algerian','American','Angolan','Argentine','Armenian',
  'Australian','Austrian','Azerbaijani','Bahraini','Bangladeshi','Barbadian',
  'Belarusian','Belgian','Bolivian','Bosnian','Botswanan','Brazilian','British',
  'Bulgarian','Burkinabe','Burundian','Cambodian','Cameroonian','Canadian',
  'Chadian','Chilean','Chinese','Colombian','Congolese','Costa Rican',
  'Croatian','Cuban','Cypriot','Czech','Danish','Dominican','Dutch',
  'Ecuadorian','Egyptian','Emirati','Eritrean','Estonian','Ethiopian',
  'Finnish','French','Gabonese','Gambian','Georgian','German','Ghanaian',
  'Greek','Guatemalan','Guinean','Guyanese','Haitian','Honduran','Hungarian',
  'Icelandic','Indian','Indonesian','Iranian','Iraqi','Irish','Israeli',
  'Italian','Ivorian','Jamaican','Japanese','Jordanian','Kazakhstani',
  'Kenyan','Kuwaiti','Laotian','Latvian','Lebanese','Liberian','Libyan',
  'Lithuanian','Macedonian','Malagasy','Malawian','Malaysian','Malian',
  'Maltese','Mauritanian','Mauritian','Mexican','Moldovan','Mongolian',
  'Moroccan','Mozambican','Namibian','Nepalese','New Zealander','Nicaraguan',
  'Nigerian','Nigerien','Norwegian','Omani','Pakistani','Panamanian',
  'Paraguayan','Peruvian','Filipino','Polish','Portuguese','Qatari',
  'Romanian','Russian','Rwandan','Saudi','Senegalese','Serbian',
  'Sierra Leonean','Singaporean','Slovak','Slovenian','Somali',
  'South African','South Korean','Spanish','Sri Lankan','Sudanese','Swedish',
  'Swiss','Syrian','Tanzanian','Thai','Togolese','Trinidadian','Tunisian',
  'Turkish','Ugandan','Ukrainian','Uruguayan','Venezuelan','Vietnamese',
  'Yemeni','Zambian','Zimbabwean',
];

// ── Nigerian states ────────────────────────────────────────────────────────────
const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

// ── Document sets ─────────────────────────────────────────────────────────────
const REGISTERED_DOCS = [
  { id: 'cac',       label: 'Certificate of Incorporation / Registration' },
  { id: 'memart',    label: 'Memorandum and Articles of Association' },
  { id: 'tin',       label: 'Tax Identification Number (TIN)' },
  { id: 'directors', label: 'Particulars of Directors' },
  { id: 'address',   label: 'Proof of Business Address' },
  { id: 'shares',    label: 'Statement of Share Capital and Return of Allotment' },
  { id: 'id_dir',    label: 'Proof of Identity for Directors (Government-issued ID)' },
  { id: 'id_share',  label: 'Proof of Identity for Shareholders (owning ≥ 51%)' },
];

const STARTER_DOCS = [
  { id: 'valid_id',  label: 'Valid Government-Issued ID (Passport / National ID / Driver\'s License)' },
  { id: 'address',   label: 'Proof of Business Address' },
  { id: 'bvn',       label: 'Bank Verification Number (BVN) — printout or screenshot' },
  { id: 'photo',     label: 'Passport Photograph' },
];

// ── Sidebar sections ──────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'documents',    label: 'Documents' },
  { id: 'business',     label: 'Business' },
  { id: 'registration', label: 'Registration' },
  { id: 'people',       label: 'People' },
  { id: 'banking',      label: 'Banking' },
  { id: 'agreement',    label: 'Service Agreement' },
  { id: 'summary',      label: 'Summary' },
];

export default function VendorActivate() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [section, setSection]       = useState('documents');
  const [uploads, setUploads]       = useState({});   // compliance docs: {docId: {file, name}}
  const [agreed, setAgreed]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Accumulated data from each completed section
  const [sectionData, setSectionData] = useState({
    business: null, registration: null, people: null, agreement: null,
  });
  // Files from individual sections (not the compliance doc list)
  const [sectionFiles, setSectionFiles] = useState({
    business_proof: null, reg_doc: null, people_proof: null,
  });

  // Track section completion for Summary
  const [done, setDone] = useState({
    documents: false, business: false, registration: false,
    people: false, banking: false, agreement: false,
  });

  const fileInputRef = useRef(null);
  const [pendingDoc, setPendingDoc] = useState(null);

  const businessType = user?.business_type || 'registered';
  const docs = businessType === 'starter' ? STARTER_DOCS : REGISTERED_DOCS;
  const uploadedCount = docs.filter(d => uploads[d.id]).length;

  function triggerUpload(docId) { setPendingDoc(docId); fileInputRef.current?.click(); }
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !pendingDoc) return;
    setUploads(u => ({ ...u, [pendingDoc]: { file, name: file.name } }));
    e.target.value = '';
    setPendingDoc(null);
  }

  // Complete a section — optionally store its data + files
  function completeSection(id, nextId, data = null, files = null) {
    setDone(d => ({ ...d, [id]: true }));
    if (data)  setSectionData(prev  => ({ ...prev,  [id]: data  }));
    if (files) setSectionFiles(prev => ({ ...prev, ...files }));
    setSection(nextId);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const fd = new FormData();

      // ── Attach structured text data as a single JSON field ────────────────
      fd.append('data', JSON.stringify({
        business_type: businessType,
        business:      sectionData.business,
        registration:  sectionData.registration,
        people:        sectionData.people,
        agreement:     sectionData.agreement,
      }));

      // ── Compliance document files (doc_cac, doc_tin, …) ──────────────────
      Object.entries(uploads).forEach(([docId, { file }]) => {
        if (file) fd.append(`doc_${docId}`, file, file.name);
      });

      // ── Section-level files ───────────────────────────────────────────────
      if (sectionFiles.business_proof)
        fd.append('business_proof', sectionFiles.business_proof, sectionFiles.business_proof.name);
      if (sectionFiles.reg_doc)
        fd.append('reg_doc', sectionFiles.reg_doc, sectionFiles.reg_doc.name);
      if (sectionFiles.people_proof)
        fd.append('people_proof', sectionFiles.people_proof, sectionFiles.people_proof.name);

      await api.post('/vendor/activate', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-[#3D6B4F]/10 rounded-full flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
               stroke="#3D6B4F" strokeWidth={2} strokeLinecap="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-navy mb-3">Application Submitted!</h1>
        <p className="text-[#8A9BB0] text-sm leading-relaxed max-w-xs">
          Your compliance documents have been submitted for review.
          We'll notify you once your account is activated — usually within 2 business days.
        </p>
        <button onClick={() => navigate('/vendor/dashboard')}
          className="mt-8 px-8 py-3 bg-navy text-white font-semibold rounded-full
                     hover:bg-navy-700 transition-all text-sm">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="md:w-52 shrink-0 flex md:flex-col bg-cream
                        md:border-r border-b border-[#E2DED8]
                        px-4 md:px-6 py-4 md:py-8 md:min-h-screen">
        <div className="hidden md:block mb-8"><BrygeLogo /></div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 w-full">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`whitespace-nowrap flex items-center gap-2 text-left px-3 py-2 rounded-lg
                          text-sm font-medium transition-colors flex-none md:flex-auto ${
                section === s.id
                  ? 'text-navy font-semibold bg-navy/5'
                  : 'text-[#8A9BB0] hover:text-navy hover:bg-navy/5'
              }`}>
              {done[s.id] && (
                <span className="w-4 h-4 rounded-full bg-[#3D6B4F] flex items-center justify-center flex-none">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
              )}
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 px-5 sm:px-10 py-8 max-w-3xl">
        <div className="md:hidden flex justify-center mb-6"><BrygeLogo /></div>

        {/* Documents */}
        {section === 'documents' && (
          <DocumentsSection
            docs={docs}
            uploads={uploads}
            uploadedCount={uploadedCount}
            onUpload={triggerUpload}
            onNext={() => completeSection('documents', 'business')}
          />
        )}

        {/* Business */}
        {section === 'business' && (
          <BusinessSection
            user={user}
            onBack={() => setSection('documents')}
            onNext={(data, files) => completeSection('business', 'registration', data, files)}
          />
        )}

        {/* Registration */}
        {section === 'registration' && (
          <RegistrationSection
            onBack={() => setSection('business')}
            onNext={(data, files) => completeSection('registration', 'people', data, files)}
          />
        )}

        {/* People */}
        {section === 'people' && (
          <PeopleSection
            onBack={() => setSection('registration')}
            onNext={(data, files) => completeSection('people', 'banking', data, files)}
          />
        )}

        {/* Banking */}
        {section === 'banking' && (
          <BankingSection
            onBack={() => setSection('people')}
            onNext={() => completeSection('banking', 'agreement')}
          />
        )}

        {/* Service Agreement */}
        {section === 'agreement' && (
          <AgreementSection
            agreed={agreed}
            setAgreed={setAgreed}
            user={user}
            onBack={() => setSection('banking')}
            onNext={(data) => {
              setAgreed(true);
              completeSection('agreement', 'summary', data, null);
            }}
            onNavigate={setSection}
          />
        )}

        {/* Summary */}
        {section === 'summary' && (
          <SummarySection
            done={done}
            docs={docs}
            uploadedCount={uploadedCount}
            agreed={agreed}
            submitting={submitting}
            submitError={submitError}
            onBack={() => setSection('agreement')}
            onNavigate={setSection}
            onSubmit={handleSubmit}
          />
        )}

        {/* Hidden doc-list file input */}
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
               className="hidden" onChange={handleFileChange} />
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function DocumentsSection({ docs, uploads, uploadedCount, onUpload, onNext }) {
  return (
    <>
      <SectionHeader
        title="Activate your business"
        subtitle="Based on your business type, you will be required to submit the documents below during the business activation process."
      />

      {/* Progress */}
      <div className="flex items-center gap-3 mb-5 bg-white rounded-2xl px-4 py-3 border border-[#E2DED8]">
        <div className="flex-1 h-2 bg-[#EDE8DF] rounded-full overflow-hidden">
          <div className="h-full bg-[#3D6B4F] rounded-full transition-all duration-500"
               style={{ width: `${(uploadedCount / docs.length) * 100}%` }} />
        </div>
        <span className="text-xs font-medium text-navy whitespace-nowrap">
          {uploadedCount}/{docs.length} uploaded
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2DED8] px-5">
        {docs.map(d => (
          <DocRow key={d.id} label={d.label}
            status={uploads[d.id] ? 'uploaded' : 'pending'}
            onUpload={() => onUpload(d.id)} />
        ))}
      </div>

      <p className="mt-4 text-sm text-[#8A9BB0]">
        You can{' '}
        <button className="text-blue-600 hover:underline font-medium"
                onClick={() => window.history.back()}>
          edit your industry/category and registration type
        </button>
        {' '}to view updated document requirements.
      </p>

      <SectionNav onNext={onNext} nextLabel="Next" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS SECTION — 4 sub-steps
// ═══════════════════════════════════════════════════════════════════════════════
const BIZ_STEPS = [
  { id: 1, label: 'Profile' },
  { id: 2, label: 'Contact' },
  { id: 3, label: 'Address' },
  { id: 4, label: 'Verify' },
];

function BusinessSection({ user, onBack, onNext }) {
  const [sub, setSub] = useState(1);

  const [profile, setProfile] = useState({
    legal_name: '', trading_name: '', same_name: false,
    description: '', projected_sales: '', website: '',
  });
  const [contact, setContact] = useState({
    business_email: user?.email || '', phone: '',
    has_socials: false, facebook: '', twitter: '', instagram: '',
  });
  const [address, setAddress] = useState({
    line1: '', line2: '', city: '', state: '', lga: '',
    same_office: true,
    off_line1: '', off_line2: '', off_city: '', off_state: '', off_lga: '',
  });
  const [proofFile, setProofFile] = useState(null);
  const [errors, setErrors] = useState({});

  function upProfile(k, v) { setProfile(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); }
  function upContact(k, v) { setContact(c => ({ ...c, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); }
  function upAddress(k, v) { setAddress(a => ({ ...a, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); }

  function validateProfile() {
    const e = {};
    if (!profile.legal_name.trim()) e.legal_name = 'Legal business name is required';
    if (profile.description.length > 0 && profile.description.length < 100)
      e.description = 'Description must be at least 100 characters';
    return e;
  }
  function validateContact() {
    const e = {};
    if (!contact.business_email.trim()) e.business_email = 'Business email is required';
    if (!contact.phone.trim()) e.phone = 'Phone number is required';
    return e;
  }
  function validateAddress() {
    const e = {};
    if (!address.line1.trim()) e.line1 = 'Address line 1 is required';
    if (!address.city.trim())  e.city  = 'City is required';
    if (!address.state)        e.state = 'State is required';
    return e;
  }

  function handleNext() {
    let e = {};
    if (sub === 1) e = validateProfile();
    if (sub === 2) e = validateContact();
    if (sub === 3) e = validateAddress();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (sub < 4) { setSub(s => s + 1); setErrors({}); }
    else onNext(
      { profile, contact, address },
      { business_proof: proofFile || null }
    );
  }
  function handleBack() {
    if (sub > 1) { setSub(s => s - 1); setErrors({}); }
    else onBack();
  }

  return (
    <>
      <InnerStepBar steps={BIZ_STEPS} current={sub} />

      {/* ── Step 1: Profile ─────────────────────────────────────────────── */}
      {sub === 1 && (
        <>
          <SectionHeader
            title="Tell us more about your business"
            subtitle="We would need to verify your identification and business registration information."
          />
          <div className="flex flex-col gap-5">
            <Field label="Is your legal business name correct?" error={errors.legal_name}>
              <RectInput placeholder="Legal business name"
                value={profile.legal_name}
                onChange={e => upProfile('legal_name', e.target.value)} />
            </Field>

            <Field label="Trading name">
              <RectInput
                placeholder="Trading name"
                value={profile.same_name ? profile.legal_name : profile.trading_name}
                disabled={profile.same_name}
                onChange={e => upProfile('trading_name', e.target.value)}
                extraClass={profile.same_name ? 'opacity-60' : ''}
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={profile.same_name}
                       onChange={e => upProfile('same_name', e.target.checked)}
                       className="w-4 h-4 accent-navy rounded" />
                <span className="text-sm text-[#8A9BB0]">Same as business name</span>
              </label>
            </Field>

            <Field label="Business description" error={errors.description}>
              <textarea
                placeholder="Describe your business"
                value={profile.description}
                onChange={e => upProfile('description', e.target.value)}
                rows={4}
                className="w-full bg-white border border-[#D4CFC7] rounded-xl px-4 py-3
                           text-navy text-sm placeholder-[#C0BAB2] resize-none
                           focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40"
              />
              <p className="text-[#C0BAB2] text-xs mt-1 px-1">
                {profile.description.length}/100 characters minimum
              </p>
            </Field>

            <Field label="Projected monthly sales volume">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BB0] text-sm font-medium">
                  ₦
                </span>
                <RectInput placeholder="0" inputMode="numeric"
                  value={profile.projected_sales}
                  onChange={e => upProfile('projected_sales', e.target.value.replace(/\D/g, ''))}
                  extraClass="pl-8" />
              </div>
            </Field>

            <Field label="Website" optional>
              <RectInput placeholder="https://yourbusiness.com"
                value={profile.website}
                onChange={e => upProfile('website', e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {/* ── Step 2: Contact ─────────────────────────────────────────────── */}
      {sub === 2 && (
        <>
          <SectionHeader
            title="How can we reach you?"
            subtitle="The channels you indicate below would help us to get in touch with you. We will email you with regular updates."
          />
          <div className="flex flex-col gap-5">
            <Field label="Business email" error={errors.business_email}>
              <RectInput type="email" placeholder="business@example.com"
                value={contact.business_email}
                onChange={e => upContact('business_email', e.target.value)} />
            </Field>

            <Field label="Phone number" error={errors.phone}>
              <div className="flex gap-2">
                <div className="flex-none flex items-center bg-white border border-[#D4CFC7]
                                rounded-xl px-3 py-3 text-navy text-sm font-medium
                                whitespace-nowrap select-none">
                  🇳🇬 +234
                </div>
                <RectInput type="tel" inputMode="numeric" placeholder="08012345678"
                  value={contact.phone}
                  onChange={e => upContact('phone', e.target.value.replace(/\D/g, ''))} />
              </div>
            </Field>

            <div>
              <p className="text-navy text-sm font-medium mb-2">
                Do you have social media accounts for your business?
              </p>
              <YesNoToggle value={contact.has_socials}
                           onChange={v => upContact('has_socials', v)} />
            </div>

            {contact.has_socials && (
              <>
                <Field label="Facebook username">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AAB8] text-xs">
                      facebook.com/
                    </span>
                    <RectInput placeholder="username" extraClass="pl-28"
                      value={contact.facebook}
                      onChange={e => upContact('facebook', e.target.value)} />
                  </div>
                </Field>
                <Field label="Twitter / X username">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AAB8] text-xs">
                      twitter.com/
                    </span>
                    <RectInput placeholder="username" extraClass="pl-24"
                      value={contact.twitter}
                      onChange={e => upContact('twitter', e.target.value)} />
                  </div>
                </Field>
                <Field label="Instagram username">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AAB8] text-xs">
                      instagram.com/
                    </span>
                    <RectInput placeholder="username" extraClass="pl-28"
                      value={contact.instagram}
                      onChange={e => upContact('instagram', e.target.value)} />
                  </div>
                </Field>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Step 3: Address ─────────────────────────────────────────────── */}
      {sub === 3 && (
        <>
          <SectionHeader
            title="How can we find you?"
            subtitle="Enter your registered business address. This is the address listed on all your business registration documents."
          />
          <div className="flex flex-col gap-4">
            <AddressForm
              prefix=""
              values={address}
              onChange={upAddress}
              errors={errors}
            />

            <div className="pt-2">
              <p className="text-navy text-sm font-medium mb-2">
                Is your registered business address the same as your office address?
              </p>
              <YesNoToggle value={address.same_office}
                           onChange={v => upAddress('same_office', v)} />
            </div>

            {!address.same_office && (
              <div className="mt-3 pt-5 border-t border-[#E2DED8]">
                <h3 className="text-navy font-semibold mb-1">Enter your current office address</h3>
                <p className="text-[#8A9BB0] text-xs mb-4 leading-relaxed">
                  Your current office address would be an office or home where you operate from.
                </p>
                <AddressForm
                  prefix="off_"
                  values={address}
                  onChange={upAddress}
                  errors={errors}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Step 4: Verify address ───────────────────────────────────────── */}
      {sub === 4 && (
        <>
          <SectionHeader title="Verify your business address" />
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-[#E2DED8] p-5">
              <p className="text-navy text-sm font-semibold mb-3">
                Please upload a proof of address that:
              </p>
              <ul className="space-y-2 text-[#8A9BB0] text-sm list-disc list-inside mb-5">
                {address.line1 && (
                  <li>Confirms your address at: <span className="text-navy font-medium">
                    {[address.line1, address.city, address.state].filter(Boolean).join(', ')}, Nigeria
                  </span></li>
                )}
                <li>Are less than 6 months old and in JPG, JPEG, PNG or PDF</li>
              </ul>

              <p className="text-navy text-sm font-semibold mb-3">
                We accept any ONE of the following documents:
              </p>
              <ul className="space-y-2 text-[#8A9BB0] text-sm">
                {['Bank statement', 'Utility bills (e.g electricity, water or DSTV bills)',
                  'Tax assessment', 'Letter from a government authority'].map(d => (
                  <li key={d} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C0BAB2] flex-none" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <FileDropZone file={proofFile} onFile={setProofFile} />

            {!proofFile && (
              <button type="button" className="text-blue-600 text-sm text-center hover:underline"
                      onClick={onNext}>
                Don't have these documents on hand? <span className="font-semibold">Skip and upload later</span>
              </button>
            )}
          </div>
        </>
      )}

      <SectionNav
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={sub === 4 ? 'Save & Continue' : 'Next'}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION SECTION — 2 sub-steps
// ═══════════════════════════════════════════════════════════════════════════════
const REG_STEPS = [
  { id: 1, label: 'Information' },
  { id: 2, label: 'Verify' },
];

function RegistrationSection({ onBack, onNext }) {
  const [sub, setSub] = useState(1);
  const [form, setForm] = useState({ nepza: '', tin: '' });
  const [regFile, setRegFile] = useState(null);
  const [errors, setErrors] = useState({});

  function upForm(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); }

  function handleNext() {
    if (sub === 1) {
      setSub(2); setErrors({});
    } else {
      onNext(
        { nepza: form.nepza, tin: form.tin },
        { reg_doc: regFile || null }
      );
    }
  }
  function handleBack() {
    if (sub > 1) { setSub(1); setErrors({}); } else onBack();
  }

  return (
    <>
      <InnerStepBar steps={REG_STEPS} current={sub} />

      {sub === 1 && (
        <>
          <SectionHeader
            title="Enter your business registration information"
            subtitle="Provide your registered business details so Bryge can verify your business information."
          />
          <div className="flex flex-col gap-5">
            <Field label="NEPZA Number" optional>
              <RectInput placeholder="0000"
                value={form.nepza}
                onChange={e => upForm('nepza', e.target.value)} />
              <p className="text-[#A0AAB8] text-xs mt-1 px-1">
                Required only if operating in a Free Trade Zone.
              </p>
            </Field>

            <Field label="Tax Identification Number (TIN)" error={errors.tin}>
              <RectInput placeholder="01234567-0123"
                value={form.tin}
                onChange={e => upForm('tin', e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {sub === 2 && (
        <>
          <SectionHeader
            title="Verify your business registration"
            subtitle="Upload your CAC certificate or other registration documents for verification."
          />
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-[#E2DED8] p-5">
              <p className="text-navy text-sm font-semibold mb-3">
                We accept any of the following:
              </p>
              <ul className="space-y-2 text-[#8A9BB0] text-sm">
                {['Certificate of Incorporation (CAC)',
                  'Business Name Registration Certificate',
                  'Corporate Affairs Commission (CAC) Filing Receipt',
                  'Other government-issued registration document'].map(d => (
                  <li key={d} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C0BAB2] flex-none" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <FileDropZone file={regFile} onFile={setRegFile} />

            {!regFile && (
              <button type="button" className="text-blue-600 text-sm text-center hover:underline"
                      onClick={onNext}>
                Don't have this document?{' '}
                <span className="font-semibold">Skip and upload later</span>
              </button>
            )}
          </div>
        </>
      )}

      <SectionNav onBack={handleBack} onNext={handleNext}
                  nextLabel={sub === 2 ? 'Save & Continue' : 'Next'} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PEOPLE SECTION — 4 sub-steps: Profile → Identity → Address → Verify
// ═══════════════════════════════════════════════════════════════════════════════
const PEOPLE_STEPS = [
  { id: 1, label: 'Profile' },
  { id: 2, label: 'Identity' },
  { id: 3, label: 'Address' },
  { id: 4, label: 'Verify' },
];

const ID_TYPES = [
  'International Passport',
  'National Identity Card (NIN)',
  "Driver's License",
  "Voter's Card",
];

function PeopleSection({ onBack, onNext }) {
  const [sub, setSub]         = useState(1);
  const [errors, setErrors]   = useState({});

  const [profile, setProfile] = useState({
    first_name: '', last_name: '', dob: '', nationality: '',
    role_owner: false, role_director: false, role_shareholder: false,
  });
  const [identity, setIdentity] = useState({ bvn_consent: false, id_type: '' });
  const [address, setAddress]   = useState({
    line1: '', line2: '', city: '', country: 'Nigeria', state: '', lga: '',
  });
  const [proofFile, setProofFile] = useState(null);

  function upProfile(k, v) { setProfile(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); }
  function upIdentity(k, v) { setIdentity(i => ({ ...i, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); }
  function upAddress(k, v)  { setAddress(a => ({ ...a, [k]: v }));  setErrors(e => ({ ...e, [k]: '' })); }

  function validateProfile() {
    const e = {};
    if (!profile.first_name.trim()) e.first_name = 'First name is required';
    if (!profile.last_name.trim())  e.last_name  = 'Last name is required';
    if (!profile.dob.trim())        e.dob        = 'Date of birth is required';
    if (!profile.nationality)       e.nationality = 'Nationality is required';
    if (!profile.role_owner && !profile.role_director && !profile.role_shareholder)
      e.roles = 'Select at least one role';
    return e;
  }
  function validateAddress() {
    const e = {};
    if (!address.line1.trim()) e.line1 = 'Address line 1 is required';
    if (!address.city.trim())  e.city  = 'City is required';
    if (!address.state)        e.state = 'State is required';
    return e;
  }

  function handleNext() {
    let e = {};
    if (sub === 1) e = validateProfile();
    if (sub === 3) e = validateAddress();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (sub < 4) { setSub(s => s + 1); setErrors({}); }
    else onNext(
      { profile, identity, address },
      { people_proof: proofFile || null }
    );
  }
  function handleBack() {
    if (sub > 1) { setSub(s => s - 1); setErrors({}); }
    else onBack();
  }

  const firstName = profile.first_name.trim() || 'the representative';

  return (
    <>
      <InnerStepBar steps={PEOPLE_STEPS} current={sub} />

      {/* ── Step 1: Profile ─────────────────────────────────────────────── */}
      {sub === 1 && (
        <>
          <SectionHeader
            title="Tell us about the business representative"
            subtitle="A business representative is either an owner, director or shareholder of your business."
          />
          <div className="flex flex-col gap-5">
            <Field label="Legal First Name" error={errors.first_name}>
              <RectInput placeholder="e.g. Adaeze"
                value={profile.first_name}
                onChange={e => upProfile('first_name', e.target.value)} />
            </Field>

            <Field label="Legal Last Name" error={errors.last_name}>
              <RectInput placeholder="e.g. Okonkwo"
                value={profile.last_name}
                onChange={e => upProfile('last_name', e.target.value)} />
            </Field>

            <Field label="Date of Birth" error={errors.dob}>
              <RectInput type="date" placeholder="DD MMM YYYY"
                value={profile.dob}
                onChange={e => upProfile('dob', e.target.value)} />
            </Field>

            <Field label="Nationality" error={errors.nationality}>
              <SelectInput value={profile.nationality}
                           onChange={e => upProfile('nationality', e.target.value)}>
                <option value="">Please select a nationality</option>
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </SelectInput>
            </Field>

            <div>
              <p className="text-navy text-sm font-medium mb-3">Role at the business</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'role_owner',       label: 'Owner' },
                  { key: 'role_director',     label: 'Director' },
                  { key: 'role_shareholder',  label: 'Shareholder' },
                ].map(r => (
                  <label key={r.key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox"
                           checked={profile[r.key]}
                           onChange={e => upProfile(r.key, e.target.checked)}
                           className="w-4 h-4 accent-navy rounded" />
                    <span className="text-navy text-sm">{r.label}</span>
                  </label>
                ))}
              </div>
              {errors.roles && <p className="text-red-500 text-xs mt-2">{errors.roles}</p>}
            </div>
          </div>
        </>
      )}

      {/* ── Step 2: Identity ─────────────────────────────────────────────── */}
      {sub === 2 && (
        <>
          <SectionHeader
            title="Provide a means of identification"
            subtitle="As a regulated financial services company, we would need to verify your identity."
          />
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-navy text-sm font-medium mb-2">Bank Verification Number (BVN)</p>
              {identity.bvn_consent ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-[#3D6B4F]/10 rounded-xl
                                border border-[#3D6B4F]/30">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="#3D6B4F" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  <span className="text-[#3D6B4F] text-sm font-medium">BVN consent provided</span>
                </div>
              ) : (
                <button type="button"
                  onClick={() => upIdentity('bvn_consent', true)}
                  className="w-full py-3 bg-[#3D6B4F] text-white text-sm font-semibold
                             rounded-xl hover:bg-[#325c43] active:scale-[0.98] transition-all">
                  Provide BVN Consent
                </button>
              )}
            </div>

            <Field label="Identification document">
              <SelectInput value={identity.id_type}
                           onChange={e => upIdentity('id_type', e.target.value)}>
                <option value="">Please select an Identification Document</option>
                {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </SelectInput>
            </Field>
          </div>
        </>
      )}

      {/* ── Step 3: Address ──────────────────────────────────────────────── */}
      {sub === 3 && (
        <>
          <SectionHeader
            title={`Enter ${firstName}'s home address`}
            subtitle="Provide the home address where you currently reside, so we are able to verify your address."
          />
          <div className="flex flex-col gap-4">
            <Field label="Address Line 1" error={errors.line1}>
              <RectInput placeholder="e.g. 12 Victoria Island Road"
                value={address.line1}
                onChange={e => upAddress('line1', e.target.value)} />
            </Field>

            <Field label="Address Line 2" optional>
              <RectInput placeholder="Flat / Suite / Floor (optional)"
                value={address.line2}
                onChange={e => upAddress('line2', e.target.value)} />
            </Field>

            <Field label="City" error={errors.city}>
              <RectInput placeholder="e.g. Lagos"
                value={address.city}
                onChange={e => upAddress('city', e.target.value)} />
            </Field>

            <Field label="Country">
              <SelectInput value={address.country}
                           onChange={e => upAddress('country', e.target.value)}>
                <option value="Nigeria">Nigeria</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Ghana">Ghana</option>
                <option value="South Africa">South Africa</option>
                <option value="Other">Other</option>
              </SelectInput>
            </Field>

            <Field label="State or Region" error={errors.state}>
              <SelectInput value={address.state}
                           onChange={e => upAddress('state', e.target.value)}>
                <option value="">Please select a state/region</option>
                {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </Field>

            <Field label="LGA (Local Government Area)">
              <RectInput placeholder="Enter your LGA"
                value={address.lga}
                onChange={e => upAddress('lga', e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {/* ── Step 4: Verify address ───────────────────────────────────────── */}
      {sub === 4 && (
        <>
          <SectionHeader title={`Verify ${firstName}'s address`} />
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-[#E2DED8] p-5">
              <p className="text-navy text-sm font-semibold mb-3">
                Please upload a proof of address that:
              </p>
              <ul className="space-y-2 text-[#8A9BB0] text-sm list-disc list-inside mb-5">
                {address.line1 && (
                  <li>Confirm your address at:{' '}
                    <span className="text-navy font-medium">
                      {[address.line1, address.city, address.state, address.country]
                        .filter(Boolean).join(', ')}
                    </span>
                  </li>
                )}
                <li>Are less than 6 months old and in JPG, JPEG, PNG or PDF</li>
              </ul>

              <p className="text-navy text-sm font-semibold mb-3">
                We accept any ONE of the following documents:
              </p>
              <ul className="space-y-2 text-[#8A9BB0] text-sm">
                {['Bank statement',
                  'Utility bills (e.g electricity, water or DSTV bills)',
                  'Tax assessment',
                  'Letter from a government authority'].map(d => (
                  <li key={d} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C0BAB2] flex-none" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <FileDropZone file={proofFile} onFile={setProofFile} />

            {!proofFile && (
              <button type="button"
                      className="text-blue-600 text-sm text-center hover:underline"
                      onClick={onNext}>
                Don't have these documents on hand?{' '}
                <span className="font-semibold">Skip and upload later</span>
              </button>
            )}
          </div>
        </>
      )}

      <SectionNav
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={sub === 4 ? 'Save & Continue' : 'Next'}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BANKING SECTION — inline bank form with account resolution
// ═══════════════════════════════════════════════════════════════════════════════
function BankingSection({ onBack, onNext }) {
  const [banks, setBanks]               = useState([]);
  const [bankCode, setBankCode]         = useState('');
  const [bankName, setBankName]         = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName]   = useState('');
  const [resolving, setResolving]       = useState(false);
  const [errors, setErrors]             = useState({});

  useEffect(() => {
    api.get('/vendor/banks')
      .then(r => setBanks(r.data.banks || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      setResolving(true);
      setAccountName('');
      api.get('/vendor/resolve-account', {
        params: { account_number: accountNumber, bank_code: bankCode },
      })
        .then(r => { if (r.data.account_name) setAccountName(r.data.account_name); })
        .catch(() => {})
        .finally(() => setResolving(false));
    } else {
      setAccountName('');
    }
  }, [accountNumber, bankCode]);

  function handleBankChange(e) {
    const opt = e.target.options[e.target.selectedIndex];
    setBankCode(e.target.value);
    setBankName(opt.text === 'Please select a bank' ? '' : opt.text);
    setErrors(er => ({ ...er, bank: '' }));
  }

  function handleNext() {
    const e = {};
    if (!bankCode)                     e.bank    = 'Please select a bank';
    if (accountNumber.length !== 10)   e.account = 'Please enter a valid corporate bank account number';
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext();
  }

  return (
    <>
      <SectionHeader
        title="Enter your business bank account number"
        subtitle="Ensure the name on your bank account matches the legal business name you provided."
      />
      <div className="flex flex-col gap-5">
        <Field label="Bank name" error={errors.bank}>
          <SelectInput
            value={bankCode}
            onChange={handleBankChange}
            extraClass={errors.bank ? 'border-red-400 focus:border-red-400' : ''}
          >
            <option value="">Please select a bank</option>
            {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </SelectInput>
          {!errors.bank && (
            <p className="text-[#A0AAB8] text-xs mt-1.5 px-1">
              For faster activation, make sure your payout account is registered under the same name as your Bryge profile.
            </p>
          )}
        </Field>

        <Field label="Corporate bank account number" error={errors.account}>
          <RectInput
            inputMode="numeric"
            maxLength={10}
            placeholder=""
            value={accountNumber}
            onChange={e => {
              setAccountNumber(e.target.value.replace(/\D/g, ''));
              setErrors(er => ({ ...er, account: '' }));
            }}
            extraClass={errors.account ? 'border-red-400 focus:border-red-400' : ''}
          />
          {resolving && (
            <p className="text-[#A0AAB8] text-xs mt-1.5 px-1">Verifying account…</p>
          )}
          {accountName && !resolving && (
            <p className="text-[#3D6B4F] text-xs mt-1.5 px-1 font-semibold">{accountName}</p>
          )}
        </Field>

        <p className="text-sm text-navy">
          Don't have a bank account yet?{' '}
          <button type="button" onClick={onNext}
                  className="text-blue-600 font-semibold hover:underline">
            Skip and continue later
          </button>
        </p>
      </div>

      <SectionNav onBack={onBack} onNext={handleNext} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE AGREEMENT SECTION — full signing form
// ═══════════════════════════════════════════════════════════════════════════════
function AgreementSection({ agreed, setAgreed, user, onBack, onNext, onNavigate }) {
  const [form, setForm] = useState({
    full_name: '', phone: '', email: user?.email || '', job_title: '',
  });

  function upForm(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <>
      <SectionHeader
        title="Merchant Service Agreement"
        subtitle="Kindly read through and accept the merchant service agreement."
      />

      {/* Warning banner */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309"
             strokeWidth={2} strokeLinecap="round" className="flex-none mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-sm text-amber-800 leading-relaxed">
          <span className="font-semibold">Important</span> — Please ensure that the information
          you provide is correct.{' '}
          <span className="font-bold">DO NOT ACCEPT THIS AGREEMENT IF YOUR DETAILS ARE INCORRECT.</span>
        </p>
      </div>

      {/* Agreement text */}
      <div className="bg-white rounded-2xl border border-[#E2DED8] p-5 mb-5 text-sm
                      text-[#8A9BB0] leading-relaxed space-y-4">
        <div>
          <p className="font-semibold text-navy mb-1">Services Agreement</p>
          <p>
            The{' '}
            <span className="text-blue-600 font-medium">Bryge Merchant Services Agreement</span>
            {' '}is an agreement between you and Bryge. It details Bryge's obligations to you
            and your obligations to Bryge. It also highlights certain risks and requirements on
            using the Services and you must consider them carefully as you will be bound by
            the provision of this Agreement through your use of this website or any of our
            Services. By accepting this Agreement electronically, you will be deemed to have
            acknowledged and agreed that you are bound by the terms of the Agreement and it
            shall be deemed to have been accepted by the Company.
          </p>
        </div>
        <div>
          <p className="font-semibold text-navy mb-1">Accept Agreement</p>
          <p className="mb-2">
            If you are accepting this Agreement on behalf of your employer or another entity,
            you represent and warrant that you have full legal authority to bind your employer
            or such entity to these terms and conditions. If you don't have the legal authority
            to bind, please do not sign the agreement below.
          </p>
          <p className="font-semibold text-navy">
            By signing this agreement, I am accepting this agreement on behalf of my business.
            I represent and warrant that (a) I have the full authority to bind the entity to
            this Agreement, (b) I have read and understand this Agreement, and (c) I agree to
            all the terms and conditions of this Agreement on behalf of the entity that I represent.
          </p>
        </div>
      </div>

      {/* Info rows with edit icons */}
      <div className="bg-white rounded-2xl border border-[#E2DED8] divide-y divide-[#EDE8DF] mb-5">
        {[
          { label: 'Contracting entity', value: 'Your legal business name', section: 'business' },
          { label: 'Company address',    value: 'Your registered business address', section: 'business' },
          { label: 'Website',            value: 'Your website (if provided)', section: 'business' },
        ].map(r => (
          <div key={r.label} className="flex items-start justify-between px-5 py-3 gap-4">
            <div>
              <p className="text-navy text-sm font-medium">{r.label}</p>
              <p className="text-[#8A9BB0] text-xs mt-0.5">{r.value}</p>
            </div>
            <button type="button" onClick={() => onNavigate(r.section)}
                    className="flex-none text-blue-500 hover:text-blue-700 transition-colors mt-0.5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                   strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Signatory fields */}
      <div className="flex flex-col gap-4 mb-5">
        <Field label="Full name">
          <RectInput placeholder="Full name"
            value={form.full_name}
            onChange={e => upForm('full_name', e.target.value)} />
        </Field>

        <Field label="Phone number">
          <div className="flex gap-2">
            <div className="flex-none flex items-center bg-white border border-[#D4CFC7]
                            rounded-xl px-3 py-3 text-navy text-sm font-medium
                            whitespace-nowrap select-none">
              🇳🇬 +234
            </div>
            <RectInput type="tel" inputMode="numeric" placeholder=""
              value={form.phone}
              onChange={e => upForm('phone', e.target.value.replace(/\D/g, ''))} />
          </div>
        </Field>

        <Field label="Email address">
          <RectInput type="email" placeholder="Email address"
            value={form.email}
            onChange={e => upForm('email', e.target.value)} />
        </Field>

        <Field label="Job title">
          <RectInput placeholder="Job title"
            value={form.job_title}
            onChange={e => upForm('job_title', e.target.value)} />
        </Field>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer mb-1">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
               className="mt-0.5 w-5 h-5 accent-navy rounded flex-none" />
        <span className="text-navy text-sm leading-relaxed">
          I accept the Merchant Service Agreement
        </span>
      </label>

      <SectionNav onBack={onBack}
                  onNext={() => onNext({ full_name: form.full_name, phone: form.phone, email: form.email, job_title: form.job_title, agreed: true })}
                  nextLabel="Accept agreement" nextDisabled={!agreed} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY SECTION — Recap with Incomplete / Completed groups
// ═══════════════════════════════════════════════════════════════════════════════
function SummarySection({ done, docs, uploadedCount, agreed, submitting, submitError, onBack, onNavigate, onSubmit }) {
  const rows = [
    { label: 'Documents',                  ok: uploadedCount === docs.length, section: 'documents' },
    { label: 'Business Profile',           ok: done.business,                 section: 'business' },
    { label: 'Registration',               ok: done.registration,             section: 'registration' },
    { label: 'Business Owner(s)',          ok: done.people,                   section: 'people' },
    { label: 'Banking / Account Details',  ok: done.banking,                  section: 'banking' },
    { label: 'Service Agreement',          ok: agreed,                        section: 'agreement' },
  ];

  const incomplete = rows.filter(r => !r.ok);
  const completed  = rows.filter(r => r.ok);

  return (
    <>
      {/* Recap step badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold
                         flex items-center justify-center flex-none">1</span>
        <span className="text-navy font-semibold text-sm">Recap</span>
      </div>

      <SectionHeader
        title="Recap"
        subtitle="Make sure the information you submit here is accurate. Incomplete information or documentation can delay the activation of your business."
      />

      {incomplete.length > 0 && (
        <div className="mb-6">
          <p className="text-navy font-semibold text-sm mb-3">Incomplete Sections</p>
          <div className="bg-white rounded-2xl border border-[#E2DED8] divide-y divide-[#EDE8DF]">
            {incomplete.map(r => (
              <button key={r.section} type="button" onClick={() => onNavigate(r.section)}
                className="w-full flex items-center justify-between px-5 py-4
                           hover:bg-[#EDE8DF]/40 transition-colors text-left">
                <span className="text-navy text-sm font-medium">{r.label}</span>
                <div className="flex items-center gap-2 flex-none">
                  <span className="text-[#3D6B4F] text-sm font-semibold">Continue</span>
                  <span className="w-7 h-7 rounded-full bg-[#3D6B4F] flex items-center justify-center">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                         stroke="white" strokeWidth={2.5} strokeLinecap="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="mb-8">
          <p className="text-navy font-semibold text-sm mb-3">Completed Sections</p>
          <div className="bg-white rounded-2xl border border-[#E2DED8] divide-y divide-[#EDE8DF]">
            {completed.map(r => (
              <button key={r.section} type="button" onClick={() => onNavigate(r.section)}
                className="w-full flex items-center justify-between px-5 py-4
                           hover:bg-[#EDE8DF]/40 transition-colors text-left">
                <span className="text-navy text-sm font-medium">{r.label}</span>
                <div className="flex items-center gap-2 flex-none">
                  <span className="text-[#8A9BB0] text-sm">View</span>
                  <span className="w-7 h-7 rounded-full border-2 border-[#C0BAB2]
                                   flex items-center justify-center">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                         stroke="#8A9BB0" strokeWidth={2.5} strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {submitError && (
        <p className="text-red-500 text-sm text-center mb-4">{submitError}</p>
      )}

      <SectionNav onBack={onBack} onNext={onSubmit}
                  nextLabel={submitting ? 'Submitting…' : 'Activate my business'}
                  nextDisabled={submitting || incomplete.length > 0} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-navy">{title}</h1>
      {subtitle && <p className="text-[#8A9BB0] text-sm mt-1 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function SectionNav({ onBack, onNext, nextLabel = 'Next', nextDisabled = false }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      {onBack ? (
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 text-[#8A9BB0] text-sm hover:text-navy transition-colors flex-none">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"
               strokeWidth={2} strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
      ) : <span />}
      <div className="w-36 sm:w-44">
        <NavyButton type="button" onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </NavyButton>
      </div>
    </div>
  );
}

// ── Address sub-form (reused for registered & office address) ─────────────────
function AddressForm({ prefix, values, onChange, errors }) {
  const f = k => `${prefix}${k}`;
  return (
    <div className="flex flex-col gap-4">
      <Field label="Address Line 1" error={errors[f('line1')]}>
        <RectInput placeholder="e.g. 12 Victoria Island Road"
          value={values[f('line1')]}
          onChange={e => onChange(f('line1'), e.target.value)} />
      </Field>
      <Field label="Address Line 2" optional>
        <RectInput placeholder="Flat / Suite / Floor (optional)"
          value={values[f('line2')]}
          onChange={e => onChange(f('line2'), e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="City" error={errors[f('city')]}>
          <RectInput placeholder="e.g. Lagos"
            value={values[f('city')]}
            onChange={e => onChange(f('city'), e.target.value)} />
        </Field>
        <Field label="State or Region" error={errors[f('state')]}>
          <SelectInput value={values[f('state')]}
                       onChange={e => onChange(f('state'), e.target.value)}>
            <option value="">Please select a state/region</option>
            {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </SelectInput>
        </Field>
      </div>
      <Field label="LGA (Local Government Area)">
        <RectInput placeholder="Enter your LGA"
          value={values[f('lga')]}
          onChange={e => onChange(f('lga'), e.target.value)} />
      </Field>
    </div>
  );
}
