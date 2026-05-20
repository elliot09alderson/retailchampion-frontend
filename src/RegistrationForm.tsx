import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toast, Toaster } from 'react-hot-toast';
import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from './config/api';

const buildRegistrationSchema = (hasAdminRef: boolean) => Yup.object().shape({
  name: Yup.string().min(2).max(50).required('Name is required'),
  phoneNumber: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit number')
    .required('Phone number is required'),
  package: Yup.number().required('Please select a contest'),
  pin: hasAdminRef
    ? Yup.string().optional().nullable()
    : Yup.string().required('PIN is required'),
  referralCode: Yup.string().optional().nullable().transform(v => v === '' ? null : v),
  userImage: Yup.mixed().optional().nullable()
    .test('fileSize', 'Max 5MB', (v: any) => !v || v.size <= 5242880)
    .test('fileType', 'JPG, PNG or PDF only', (v: any) => !v || ['image/jpeg','image/jpg','image/png','application/pdf'].includes(v.type)),
  selfie: Yup.mixed()
    .required('Photo is required')
    .test('fileSize', 'Max 5MB', (v: any) => v && v.size <= 5242880)
    .test('fileType', 'JPG or PNG only', (v: any) => v && ['image/jpeg','image/jpg','image/png'].includes(v.type)),
});

interface Package {
  _id: string;
  name: string;
  amount: number;
  isVip: boolean;
  whatsappGroupLink?: string;
  isActive: boolean;
}

interface FormValues {
  name: string;
  phoneNumber: string;
  package: number;
  pin: string;
  referralCode: string;
  userImage: File | null;
  selfie: File | null;
}

export default function RegistrationForm() {
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [availablePackages, setAvailablePackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [adminRef, setAdminRef] = useState<string | null>(null);
  const [adminOrgName, setAdminOrgName] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminResolved, setAdminResolved] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setAdminRef(ref);
      fetch(API_ENDPOINTS.ADMIN_REFERRAL.RESOLVE(ref))
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setAdminOrgName(data.data.organizationName);
            setAdminId(data.data.adminId);
          }
        })
        .catch(() => {})
        .finally(() => setAdminResolved(true));
    } else {
      setAdminResolved(true);
    }
  }, []);

  useEffect(() => {
    if (!adminResolved) return;
    const load = async () => {
      try {
        const params = new URLSearchParams({ t: String(Date.now()) });
        if (adminId) params.set('adminId', adminId);
        const res = await fetch(`${API_ENDPOINTS.PACKAGES.LIST}?${params}`);
        const data = await res.json();
        if (data.success) setAvailablePackages(data.data.filter((p: Package) => p.isActive && !p.isVip));
      } catch {}
      finally { setLoadingPackages(false); }
    };
    load();
  }, [adminResolved, adminId]);

  const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/IjyBuEn6mJh3PFx9yEgpWX";

  const initialValues: FormValues = { name: '', phoneNumber: '', package: 0, pin: '', referralCode: '', userImage: null, selfie: null };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, set: (f: string|null)=>void, setVal: (f:string,v:any)=>void, field: string) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setVal(field, file);
    const r = new FileReader();
    r.onloadend = () => set(r.result as string);
    r.readAsDataURL(file);
  };

  const handleSubmit = async (values: FormValues, { setSubmitting, setErrors }: any) => {
    try {
      setSubmitting(true);
      const isVip = availablePackages.find(p => p.isVip && values.package === p.amount);
      if (!adminRef && !values.pin) {
        setErrors({ pin: 'PIN is required' });
        toast.error('Please enter the package PIN');
        setSubmitting(false);
        return;
      }
      const fd = new FormData();
      fd.append('name', values.name);
      fd.append('phoneNumber', values.phoneNumber);
      fd.append('package', values.package.toString());
      if (isVip) {
        if (values.referralCode) fd.append('referralCode', values.referralCode.toUpperCase());
        fd.append('isVipRegistration', 'true');
      }
      if (!adminRef && values.pin) fd.append('pin', values.pin);
      if (adminRef) fd.append('adminRef', adminRef);
      if (values.userImage) fd.append('image', values.userImage);
      if (values.selfie) fd.append('selfie', values.selfie);

      const res = await fetch(API_ENDPOINTS.USERS.REGISTER, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setRegistrationData(data.data);
        setShowSuccessModal(true);
      } else if (data.errors?.length) {
        const err: any = {};
        data.errors.forEach((e: any) => { err[e.field] = e.message; });
        setErrors(err);
        toast.error('Please check the form');
      } else if (res.status === 409) {
        toast.error(data.message || 'Phone number already registered');
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .rf-root{
          font-family:'Inter',sans-serif;
          min-height:100vh;
          background: linear-gradient(135deg, #060d1f 0%, #0a1628 50%, #060d1f 100%);
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          padding:16px;
          position:relative;
          overflow:hidden;
        }
        .rf-root::before{
          content:'';
          position:fixed;
          top:-20%;left:-20%;
          width:60%;height:60%;
          background:radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%);
          pointer-events:none;
        }
        .rf-root::after{
          content:'';
          position:fixed;
          bottom:-20%;right:-20%;
          width:50%;height:50%;
          background:radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
          pointer-events:none;
        }
        .rf-wrap{
          width:100%;
          max-width:420px;
          position:relative;
          z-index:1;
        }
        .rf-header{
          text-align:center;
          margin-bottom:12px;
        }
        .rf-title{
          font-size:26px;
          font-weight:900;
          color:#fff;
          letter-spacing:-0.5px;
          line-height:1.1;
        }
        .rf-title span{color:#3b82f6;}
        .rf-sub{
          font-size:10px;
          font-weight:600;
          color:rgba(255,255,255,0.3);
          letter-spacing:0.3em;
          text-transform:uppercase;
          margin-top:4px;
        }
        .rf-banner{
          display:flex;
          align-items:center;
          gap:10px;
          background:rgba(37,99,235,0.12);
          border:1px solid rgba(59,130,246,0.25);
          backdrop-filter:blur(12px);
          -webkit-backdrop-filter:blur(12px);
          border-radius:12px;
          padding:10px 14px;
          margin-bottom:10px;
        }
        .rf-banner-icon{
          width:30px;height:30px;
          background:rgba(59,130,246,0.2);
          border-radius:8px;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        }
        .rf-banner-label{font-size:10px;font-weight:600;color:rgba(147,197,253,0.7);text-transform:uppercase;letter-spacing:0.08em;}
        .rf-banner-value{font-size:13px;font-weight:700;color:#93c5fd;margin-top:1px;}
        .rf-card{
          background:rgba(255,255,255,0.04);
          backdrop-filter:blur(24px);
          -webkit-backdrop-filter:blur(24px);
          border:1px solid rgba(255,255,255,0.09);
          border-radius:20px;
          padding:20px;
          box-shadow:0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07);
        }
        .rf-photo-row{
          display:flex;
          align-items:center;
          gap:14px;
          margin-bottom:14px;
        }
        .rf-selfie-wrap{
          flex-shrink:0;
          position:relative;
          cursor:pointer;
        }
        .rf-selfie-ring{
          width:76px;height:76px;
          border-radius:50%;
          border:2px solid rgba(59,130,246,0.5);
          background:rgba(255,255,255,0.04);
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          transition:border-color 0.2s;
        }
        .rf-selfie-ring:hover{border-color:rgba(59,130,246,0.9);}
        .rf-selfie-ring.error{border-color:rgba(239,68,68,0.6);}
        .rf-selfie-ring img{width:100%;height:100%;object-fit:cover;}
        .rf-selfie-inner{display:flex;flex-direction:column;align-items:center;gap:4px;}
        .rf-selfie-inner svg{opacity:0.5;}
        .rf-selfie-label{font-size:8px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;}
        .rf-selfie-plus{
          position:absolute;
          bottom:0;right:0;
          width:22px;height:22px;
          background:#2563eb;
          border-radius:50%;
          border:2px solid #060d1f;
          display:flex;align-items:center;justify-content:center;
        }
        .rf-name-col{flex:1;}
        .rf-field{margin-bottom:10px;}
        .rf-label{
          display:block;
          font-size:10px;
          font-weight:600;
          color:rgba(255,255,255,0.4);
          text-transform:uppercase;
          letter-spacing:0.1em;
          margin-bottom:5px;
        }
        .rf-input-wrap{position:relative;}
        .rf-icon{
          position:absolute;
          left:11px;top:50%;transform:translateY(-50%);
          color:rgba(255,255,255,0.25);
          pointer-events:none;
          display:flex;
        }
        .rf-input{
          width:100%;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:10px;
          padding:10px 12px 10px 34px;
          color:#fff;
          font-size:13px;
          font-weight:500;
          font-family:'Inter',sans-serif;
          outline:none;
          transition:border-color 0.2s, box-shadow 0.2s, background 0.2s;
          -webkit-appearance:none;
          appearance:none;
        }
        .rf-input::placeholder{color:rgba(255,255,255,0.2);font-weight:400;}
        .rf-input:focus{
          border-color:rgba(59,130,246,0.6);
          background:rgba(59,130,246,0.06);
          box-shadow:0 0 0 3px rgba(59,130,246,0.12);
        }
        .rf-input.err{border-color:rgba(239,68,68,0.5);}
        .rf-input.err:focus{box-shadow:0 0 0 3px rgba(239,68,68,0.12);}
        .rf-input.no-icon{padding-left:12px;}
        .rf-select{
          width:100%;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:10px;
          padding:10px 36px 10px 34px;
          color:#fff;
          font-size:13px;
          font-weight:500;
          font-family:'Inter',sans-serif;
          outline:none;
          appearance:none;
          -webkit-appearance:none;
          cursor:pointer;
          transition:border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .rf-select:focus{
          border-color:rgba(59,130,246,0.6);
          background:rgba(59,130,246,0.06);
          box-shadow:0 0 0 3px rgba(59,130,246,0.12);
        }
        .rf-select option{background:#0a1628;color:#fff;}
        .rf-select-arr{
          position:absolute;right:11px;top:50%;transform:translateY(-50%);
          color:rgba(255,255,255,0.3);
          pointer-events:none;
        }
        .rf-phone-prefix{
          position:absolute;left:11px;top:50%;transform:translateY(-50%);
          display:flex;align-items:center;gap:5px;
          font-size:12px;font-weight:600;color:rgba(255,255,255,0.4);
          pointer-events:none;
          border-right:1px solid rgba(255,255,255,0.1);
          padding-right:8px;
        }
        .rf-input.phone{padding-left:62px;}
        .rf-err{font-size:10px;color:#f87171;margin-top:3px;font-weight:500;}
        .rf-upload{
          display:flex;
          align-items:center;
          gap:10px;
          background:rgba(255,255,255,0.03);
          border:1px dashed rgba(255,255,255,0.12);
          border-radius:10px;
          padding:10px 12px;
          cursor:pointer;
          transition:border-color 0.2s, background 0.2s;
        }
        .rf-upload:hover{border-color:rgba(59,130,246,0.4);background:rgba(59,130,246,0.04);}
        .rf-upload.has-file{border-color:rgba(34,197,94,0.3);background:rgba(34,197,94,0.04);border-style:solid;}
        .rf-upload-icon{
          width:32px;height:32px;
          background:rgba(255,255,255,0.06);
          border-radius:8px;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        }
        .rf-upload-text{flex:1;}
        .rf-upload-title{font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);}
        .rf-upload-sub{font-size:10px;color:rgba(255,255,255,0.25);margin-top:1px;}
        .rf-btn{
          width:100%;
          background:linear-gradient(135deg,#1d4ed8,#2563eb);
          border:none;
          border-radius:12px;
          padding:13px;
          color:#fff;
          font-size:13px;
          font-weight:700;
          font-family:'Inter',sans-serif;
          letter-spacing:0.03em;
          cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;
          margin-top:14px;
          box-shadow:0 4px 20px rgba(37,99,235,0.35);
          transition:opacity 0.2s,transform 0.1s,box-shadow 0.2s;
        }
        .rf-btn:hover{opacity:0.92;box-shadow:0 6px 24px rgba(37,99,235,0.5);}
        .rf-btn:active{transform:scale(0.99);}
        .rf-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .rf-divider{height:1px;background:rgba(255,255,255,0.06);margin:12px 0;}
        /* Success modal */
        .rf-modal-overlay{
          position:fixed;inset:0;
          background:rgba(0,0,0,0.85);
          backdrop-filter:blur(16px);
          -webkit-backdrop-filter:blur(16px);
          display:flex;align-items:center;justify-content:center;
          z-index:50;padding:16px;
        }
        .rf-modal{
          background:rgba(15,23,42,0.95);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:24px;
          padding:28px 24px;
          width:100%;max-width:340px;
          text-align:center;
          box-shadow:0 40px 80px rgba(0,0,0,0.6);
          position:relative;
          overflow:hidden;
        }
        .rf-modal::before{
          content:'';
          position:absolute;top:0;left:0;right:0;height:120px;
          background:radial-gradient(ellipse at 50% 0%,rgba(16,185,129,0.15) 0%,transparent 70%);
          pointer-events:none;
        }
        .spinner{animation:spin 1s linear infinite;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div className="rf-root">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: 'Inter,sans-serif',
            },
          }}
        />

        <div className="rf-wrap">
          {/* Header */}
          <div className="rf-header">
            <h1 className="rf-title">Retail <span>Champions</span></h1>
            <p className="rf-sub">Official Participant Registration</p>
          </div>

          {/* Admin banner */}
          {adminOrgName && (
            <div className="rf-banner">
              <div className="rf-banner-icon">
                <svg width="15" height="15" fill="none" stroke="#60a5fa" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="rf-banner-label">Registering under</div>
                <div className="rf-banner-value">{adminOrgName}</div>
              </div>
            </div>
          )}

          {/* Card */}
          <div className="rf-card">
            <Formik
              initialValues={initialValues}
              validationSchema={buildRegistrationSchema(!!adminRef)}
              enableReinitialize
              onSubmit={handleSubmit}
            >
              {({ setFieldValue, isSubmitting, errors, touched, values }) => (
                <Form>
                  {/* Photo + Name row */}
                  <div className="rf-photo-row">
                    {/* Selfie */}
                    <input type="file" id="selfie" name="selfie" accept=".jpg,.jpeg,.png" capture="user"
                      onChange={e => handleFile(e, setSelfiePreview, setFieldValue, 'selfie')} className="hidden" />
                    <label htmlFor="selfie" className="rf-selfie-wrap">
                      <div className={`rf-selfie-ring ${errors.selfie && touched.selfie ? 'error' : ''}`}>
                        {selfiePreview
                          ? <img src={selfiePreview} alt="selfie" />
                          : <div className="rf-selfie-inner">
                              <svg width="22" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="rf-selfie-label">Photo</span>
                            </div>
                        }
                      </div>
                      <div className="rf-selfie-plus">
                        <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </label>
                    {errors.selfie && touched.selfie && (
                      <div style={{ position:'absolute', marginTop:'80px', left:0, fontSize:9, color:'#f87171', fontWeight:600 }}>{errors.selfie as string}</div>
                    )}

                    {/* Name field */}
                    <div className="rf-name-col">
                      <label className="rf-label">Full Name <span style={{color:'#f87171'}}>*</span></label>
                      <div className="rf-input-wrap">
                        <span className="rf-icon">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        <Field type="text" name="name" placeholder="Your full name"
                          className={`rf-input${errors.name && touched.name ? ' err' : ''}`} />
                      </div>
                      <ErrorMessage name="name" render={m => <div className="rf-err">{m}</div>} />
                    </div>
                  </div>

                  <div className="rf-divider" />

                  {/* Contest */}
                  <div className="rf-field">
                    <label className="rf-label">Contest / Package <span style={{color:'#f87171'}}>*</span></label>
                    <div className="rf-input-wrap">
                      <span className="rf-icon">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </span>
                      {loadingPackages ? (
                        <div className="rf-input" style={{cursor:'not-allowed',color:'rgba(255,255,255,0.3)'}}>Loading...</div>
                      ) : availablePackages.length === 0 ? (
                        <div className="rf-input" style={{color:'#f87171'}}>No active contests</div>
                      ) : (
                        <select
                          name="package"
                          value={values.package || ''}
                          onChange={e => setFieldValue('package', Number(e.target.value))}
                          className="rf-select"
                          style={{ color: values.package ? '#fff' : 'rgba(255,255,255,0.25)' }}
                        >
                          <option value="">Select a contest...</option>
                          {availablePackages.filter(p => !p.isVip).map(p => (
                            <option key={p._id} value={p.amount}>{p.name}</option>
                          ))}
                        </select>
                      )}
                      <span className="rf-select-arr">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                    <ErrorMessage name="package" render={m => <div className="rf-err">{m}</div>} />
                  </div>

                  {/* PIN */}
                  {!adminRef && (
                    <div className="rf-field">
                      <label className="rf-label">Retail PIN <span style={{color:'#f87171'}}>*</span></label>
                      <div className="rf-input-wrap">
                        <span className="rf-icon">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </span>
                        <Field type="text" name="pin" placeholder="6-digit code"
                          className={`rf-input${errors.pin && touched.pin ? ' err' : ''}`}
                          style={{fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase'}} />
                      </div>
                      <ErrorMessage name="pin" render={m => <div className="rf-err">{m}</div>} />
                    </div>
                  )}

                  {/* Phone */}
                  <div className="rf-field">
                    <label className="rf-label">Phone Number <span style={{color:'#f87171'}}>*</span></label>
                    <div className="rf-input-wrap">
                      <span className="rf-phone-prefix">🇮🇳 +91</span>
                      <Field type="tel" name="phoneNumber" placeholder="10-digit number" maxLength={10}
                        className={`rf-input phone${errors.phoneNumber && touched.phoneNumber ? ' err' : ''}`} />
                    </div>
                    <ErrorMessage name="phoneNumber" render={m => <div className="rf-err">{m}</div>} />
                  </div>

                  {/* Bill Upload */}
                  <div className="rf-field">
                    <label className="rf-label">Bill / Receipt <span style={{color:'rgba(255,255,255,0.2)',fontWeight:400,textTransform:'none',letterSpacing:0}}>optional</span></label>
                    <input type="file" id="userImage" accept=".jpg,.jpeg,.png,.pdf"
                      onChange={e => handleFile(e, setUserImagePreview, setFieldValue, 'userImage')} className="hidden" />
                    <label htmlFor="userImage" className={`rf-upload${userImagePreview ? ' has-file' : ''}`}>
                      <div className="rf-upload-icon">
                        {userImagePreview ? (
                          <svg width="15" height="15" fill="none" stroke="#4ade80" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        )}
                      </div>
                      <div className="rf-upload-text">
                        <div className="rf-upload-title" style={{color: userImagePreview ? '#4ade80' : 'rgba(255,255,255,0.5)'}}>
                          {userImagePreview ? 'Bill uploaded — tap to change' : 'Upload bill or receipt'}
                        </div>
                        <div className="rf-upload-sub">JPG, PNG or PDF · Max 5MB</div>
                      </div>
                    </label>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={isSubmitting} className="rf-btn">
                    {isSubmitting ? (
                      <>
                        <svg className="spinner" width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4"/>
                          <path fill="rgba(255,255,255,0.8)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                        </svg>
                      </>
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          </div>

          <p style={{textAlign:'center',fontSize:10,color:'rgba(255,255,255,0.18)',marginTop:12,fontFamily:'Inter,sans-serif'}}>
            Secure · Encrypted · Protected
          </p>
        </div>

        {/* Success Modal */}
        {showSuccessModal && registrationData && (
          <div className="rf-modal-overlay">
            <div className="rf-modal">
              <div style={{position:'relative',zIndex:1}}>
                {registrationData.vipStatus === 'vip' && (
                  <div style={{position:'absolute',top:-4,right:-4,background:'linear-gradient(135deg,#f59e0b,#eab308)',color:'#000',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',padding:'4px 10px',borderRadius:'0 20px 0 12px'}}>
                    VIP
                  </div>
                )}

                <div style={{width:64,height:64,margin:'0 auto 16px',position:'relative'}}>
                  <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(16,185,129,0.15)',filter:'blur(10px)'}}/>
                  <img src="/imgs/congratulations.png" alt="Success" style={{width:'100%',height:'100%',objectFit:'contain',position:'relative',zIndex:1}}/>
                </div>

                <h2 style={{fontSize:20,fontWeight:900,color:'#fff',marginBottom:4,letterSpacing:'-0.3px'}}>
                  {registrationData.vipStatus === 'vip' ? 'VIP Registered!' : "You're In!"}
                </h2>
                <p style={{fontSize:12,color:'rgba(148,163,184,1)',marginBottom:20}}>Welcome, {registrationData.name}</p>

                <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'14px 16px',marginBottom:16}}>
                  <p style={{fontSize:9,fontWeight:700,color:'rgba(71,85,105,1)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:8}}>Your Coupon Code</p>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                    <span style={{fontSize:28,fontWeight:900,letterSpacing:'0.15em',color:registrationData.vipStatus==='vip'?'#fbbf24':'#34d399',fontFamily:'monospace'}}>
                      {registrationData.couponCode}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(registrationData.couponCode); toast.success('Copied!'); }}
                      style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,padding:7,cursor:'pointer',color:'rgba(100,116,139,1)',display:'flex'}}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {registrationData.vipStatus === 'vip' && (
                  <a href="/vip/login" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',padding:'11px',background:'linear-gradient(135deg,#f59e0b,#eab308)',borderRadius:12,color:'#000',fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',textDecoration:'none',marginBottom:8}}>
                    Access VIP Profile
                  </a>
                )}

                <a
                  href={availablePackages.find(p => p.amount === registrationData.package)?.whatsappGroupLink || WHATSAPP_GROUP_LINK}
                  target="_blank" rel="noopener noreferrer"
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,width:'100%',padding:'11px',background:'#25D366',borderRadius:12,color:'#fff',fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',textDecoration:'none',marginBottom:8}}
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.474.875 3.183 1.357 4.935 1.358 4.833.002 8.767-3.931 8.77-8.766 0-2.343-.911-4.544-2.566-6.199s-3.855-2.566-6.198-2.567c-4.835 0-8.771 3.935-8.774 8.77-.001 1.573.411 3.103 1.196 4.453l1.01 1.742-1.071 3.91 4.008-1.051zm10.946-6.166c-.103-.173-.38-.277-.796-.485s-2.459-1.213-2.839-1.353-.657-.208-.933.208-.103.208-.069.277.103.173.208.277c.103.104.208.242.311.346.103.104.242.242.103.485s-.208.242-.484.242-.276.104-1.972-.519c-1.319-1.177-2.208-2.632-2.467-3.048s-.027-.64.18-.847c.187-.186.415-.484.622-.726.208-.242.276-.415.415-.691s.069-.519-.034-.726-.933-2.248-1.279-3.078c-.337-.813-.68-.703-.933-.716s-.519-.013-.795-.013-.726.104-1.107.519-1.453 1.419-1.453 3.46 1.487 4.012 1.694 4.288c.208.277 2.925 4.46 7.087 6.256 1.13.487 1.83.649 2.505.862.991.315 1.898.27 2.613.163.796-.118 2.316-1.141 2.645-2.248s.329-2.041.208-2.248z"/>
                  </svg>
                  Join WhatsApp Group
                </a>

                <button onClick={() => window.location.href='/'} style={{width:'100%',padding:'10px',background:'rgba(255,255,255,0.04)',border:'none',borderRadius:12,color:'rgba(100,116,139,1)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
