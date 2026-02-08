import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toast, Toaster } from 'react-hot-toast';
import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const registrationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  phoneNumber: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number')
    .required('Phone number is required'),

  package: Yup.number()
    .required('Package selection is required'),
  pin: Yup.string()
    .required('PIN is required'),
  leaderCode: Yup.string()
    .optional(),
  selfie: Yup.mixed()
    .required('Photo is required')
    .test('fileSize', 'File size must be less than 5MB', (value: any) => {
      return value && value.size <= 5242880;
    }),
});

interface Package {
  _id: string;
  name: string;
  amount: number;
  isVip: boolean;
  isActive: boolean;
  whatsappGroupLink?: string;
}

export default function VIPRegistrationForm() {
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [vipPackages, setVipPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.PACKAGES.LIST}?t=${Date.now()}`);
        const data = await response.json();
        if (data.success) {
          // Filter for active VIP packages
          setVipPackages(data.data.filter((pkg: Package) => pkg.isActive && pkg.isVip));
        }
      } catch (error) {
        console.error('Failed to fetch packages', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('phoneNumber', values.phoneNumber);
      formData.append('package', values.package);
      formData.append('pin', values.pin);
      formData.append('isVipRegistration', 'true');
      
      if (values.leaderCode) {
        formData.append('referralCode', values.leaderCode);
      }
      formData.append('selfie', values.selfie);

      const response = await fetch(API_ENDPOINTS.USERS.REGISTER, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('VIP Registration successful!');
        setSuccessData(data.data);
        resetForm();
        setSelfiePreview(null);
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    const registeredPackage = vipPackages.find(p => p.amount === successData.package);
    const whatsappLink = registeredPackage?.whatsappGroupLink || "https://chat.whatsapp.com/IjyBuEn6mJh3PFx9yEgpWX"; // Default fallback

    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">
        <Toaster position="top-center" />
        <div className="w-full max-w-lg fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] -mr-16 -mt-16 rounded-full pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[50px] -ml-16 -mb-16 rounded-full pointer-events-none" />

             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
             </div>

             <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">Registration Successful!</h2>
             <p className="text-slate-500 font-medium mb-8">Welcome to the VIP Club, {successData.name}!</p>

             <div className="space-y-6">
                
                {/* Login Code */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Your Login Code</p>
                  <p className="text-3xl font-black text-blue-600 font-mono tracking-wider select-all">{successData.couponCode}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Use this code to login to your dashboard</p>
                </div>

                {/* Referral Code */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Your Leader Code (Referral)</p>
                  <p className="text-3xl font-black text-amber-700 font-mono tracking-wider select-all">{successData.referralCode}</p>
                  <p className="text-[10px] text-amber-600/70 mt-1">Share this code to refer others & earn rewards</p>
                </div>

                {/* WhatsApp Join */}
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02]"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.474.875 3.183 1.357 4.935 1.358 4.833.002 8.767-3.931 8.77-8.766 0-2.343-.911-4.544-2.566-6.199s-3.855-2.566-6.198-2.567c-4.835 0-8.771 3.935-8.774 8.77-.001 1.573.411 3.103 1.196 4.453l1.01 1.742-1.071 3.91 4.008-1.051zm10.946-6.166c-.103-.173-.38-.277-.796-.485s-2.459-1.213-2.839-1.353-.657-.208-.933.208-.103.208-.069.277.103.173.208.277c.103.104.208.242.311.346.103.104.242.242.103.485s-.208.242-.484.242-.276.104-1.972-.519c-1.319-1.177-2.208-2.632-2.467-3.048s-.027-.64.18-.847c.187-.186.415-.484.622-.726.208-.242.276-.415.415-.691s.069-.519-.034-.726-.933-2.248-1.279-3.078c-.337-.813-.68-.703-.933-.716s-.519-.013-.795-.013-.726.104-1.107.519-1.453 1.419-1.453 3.46 1.487 4.012 1.694 4.288c.208.277 2.925 4.46 7.087 6.256 1.13.487 1.83.649 2.505.862.991.315 1.898.27 2.613.163.796-.118 2.316-1.141 2.645-2.248s.329-2.041.208-2.248z" />
                  </svg>
                  Join WhatsApp Group
                </a>

                {/* Login Button */}
                <a 
                  href="/vip/login"
                  className="block w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg"
                >
                  Login to VIP Profile
                </a>

             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">
      <Toaster position="top-center" />
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#0f172a] mb-2 uppercase tracking-tight">VIP FORM</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Official VIP Registration</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8">
            <Formik
                initialValues={{ 
                  name: '', 
                  phoneNumber: '', 
 
                  package: '', 
                  pin: '', 
                  leaderCode: '', 
                  selfie: null 
                }}
                validationSchema={registrationSchema}
                onSubmit={handleSubmit}
            >
                {({ setFieldValue, isSubmitting, errors, touched, values }) => (
                    <Form className="space-y-6">
                        {/* Photo Upload */}
                        <div className="flex flex-col items-center mb-6">
                            <label className={`relative w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-50 overflow-hidden transition-colors ${errors.selfie && touched.selfie ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if(file) {
                                            setFieldValue('selfie', file);
                                            setSelfiePreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                {selfiePreview ? (
                                    <img src={selfiePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-2">
                                        <svg className="w-8 h-8 text-slate-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Upload Photo</span>
                                    </div>
                                )}
                            </label>
                            <ErrorMessage name="selfie" component="div" className="text-red-500 text-[10px] font-bold mt-2 uppercase" />
                        </div>

                        {/* VIP Packages */}
                        <div className="space-y-3">
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Select VIP Package <span className="text-red-500">*</span></label>
                          {loading ? (
                            <div className="text-xs text-slate-400">Loading packages...</div>
                          ) : vipPackages.length === 0 ? (
                            <div className="text-xs text-red-500">No VIP packages available</div>
                          ) : (
                            <div className="space-y-2">
                              {vipPackages.map((pkg) => (
                                <label 
                                  key={pkg._id} 
                                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    values.package === pkg.amount.toString()
                                      ? 'border-amber-500 bg-amber-50' 
                                      : 'border-slate-200 hover:border-amber-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Field type="radio" name="package" value={pkg.amount.toString()} className="w-4 h-4 text-amber-600" />
                                    <div>
                                      <p className="font-bold text-slate-800">{pkg.name}</p>
                                      <p className="text-amber-600 font-mono font-black">₹{pkg.amount}</p>
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                           <ErrorMessage name="package" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Name <span className="text-red-500">*</span></label>
                            <Field name="name" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-bold text-slate-700 placeholder-slate-400" placeholder="Your Name" />
                            <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Mobile Number <span className="text-red-500">*</span></label>
                            <Field name="phoneNumber" type="tel" maxLength={10} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-bold text-slate-700 placeholder-slate-400" placeholder="10-digit number" />
                            <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                        </div>



                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Package PIN <span className="text-red-500">*</span></label>
                                <Field name="pin" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-bold text-slate-700 placeholder-slate-400 uppercase tracking-widest" placeholder="Enter PIN" />
                                <ErrorMessage name="pin" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Leader Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <Field name="leaderCode" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-bold text-slate-700 placeholder-slate-400 uppercase" placeholder="Referral Code" />
                                <ErrorMessage name="leaderCode" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-4">
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Processing...
                                </span>
                            ) : 'Register as VIP'}
                        </button>
                    </Form>
                )}
            </Formik>

            <div className="mt-8 text-center bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-2">Already Registered?</p>
                <a href="/vip/login" className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-lg text-amber-600 font-black text-xs uppercase tracking-widest hover:bg-amber-50 hover:border-amber-200 transition-all shadow-sm">
                    Access VIP Profile
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}
