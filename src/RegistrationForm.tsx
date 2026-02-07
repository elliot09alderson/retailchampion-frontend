import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toast, Toaster } from 'react-hot-toast';


import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from './config/api';

// Validation schema
const registrationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  phoneNumber: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number')
    .required('Phone number is required'),
  aadhaarNumber: Yup.string()
    .matches(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits')
    .required('Aadhaar number is required'),
  panNumber: Yup.string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be in format: ABCDE1234F')
    .optional()
    .nullable()
    .transform((value) => value === '' ? null : value),
  registrationId: Yup.string()
    .matches(/^\d{10}$/, 'ID must be exactly 10 digits')
    .optional()
    .nullable()
    .transform((value) => value === '' ? null : value),
  package: Yup.number()
    .required('Package selection is required'),
  pin: Yup.string()
    .required('Package PIN is required'),
  referralCode: Yup.string()
    .optional()
    .nullable()
    .transform((value) => value === '' ? null : value),
  userImage: Yup.mixed()
    .optional()
    .nullable()
    .test('fileSize', 'File size must be less than 5MB', (value: any) => {
      if (!value) return true;
      return value.size <= 5242880;
    })
    .test('fileType', 'Only JPG, JPEG, PNG, PDF files are allowed', (value: any) => {
      if (!value) return true;
      return ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(value.type);
    }),
  selfie: Yup.mixed()
    .required('Selfie is required')
    .test('fileSize', 'File size must be less than 5MB', (value: any) => {
      return value && value.size <= 5242880;
    })
    .test('fileType', 'Only JPG, JPEG, PNG are allowed', (value: any) => {
      return value && ['image/jpeg', 'image/jpg', 'image/png'].includes(value.type);
    }),
});

interface Package {
  _id: string;
  name: string;
  amount: number;
  description?: string;
  isVip: boolean;
  whatsappGroupLink?: string;
  isActive: boolean;
}

interface FormValues {
  name: string;
  phoneNumber: string;
  aadhaarNumber: string;
  panNumber: string;
  registrationId: string;
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

  // Fetch available packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        // Add timestamp to prevent caching
        const response = await fetch(`${API_ENDPOINTS.PACKAGES.LIST}?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.success) {
          console.log('Fetched Packages:', data.data);
          // Ensure we only show active non-VIP packages
          setAvailablePackages(data.data.filter((p: Package) => p.isActive && !p.isVip));
        } else {
          console.error('Failed to load packages:', data.message);
        }
      } catch (err) {
        console.error('Failed to fetch packages:', err);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/IjyBuEn6mJh3PFx9yEgpWX";


  const initialValues: FormValues = {
    name: '',
    phoneNumber: '',
    aadhaarNumber: '',
    panNumber: '',
    registrationId: '',
    package: 0,
    pin: '',
    referralCode: '',
    userImage: null,
    selfie: null,
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void,
    fieldName: string,
    setPreview: (preview: string | null) => void
  ) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      setFieldValue(fieldName, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: FormValues, { setSubmitting, setErrors }: any) => {
    try {
      setSubmitting(true);
      
      // Check if VIP package is selected
      const isVipPackage = availablePackages.find(pkg => pkg.isVip && values.package === pkg.amount);
      
      
      // PIN is always required now
      if (!values.pin) {
        setErrors({ pin: 'PIN is required' });
        toast.error('Please enter the package PIN');
        setSubmitting(false);
        return;
      }
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('phoneNumber', values.phoneNumber);
      formData.append('aadhaarNumber', values.aadhaarNumber);
      if (values.panNumber) {
        formData.append('panNumber', values.panNumber);
      }
      if (values.registrationId) {
        formData.append('registrationId', values.registrationId);
      }
      formData.append('package', values.package.toString());
      
      // For VIP packages, append referral code
      if (isVipPackage) {
        if (values.referralCode) {
          formData.append('referralCode', values.referralCode.toUpperCase());
        }
        formData.append('isVipRegistration', 'true');
      }
      
      // Always append PIN
      formData.append('pin', values.pin);
      
      if (values.userImage) {
        formData.append('image', values.userImage);
      }
      if (values.selfie) {
        formData.append('selfie', values.selfie);
      }

      const response = await fetch(API_ENDPOINTS.USERS.REGISTER, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Registration successful!');
        setRegistrationData(data.data);
        setShowSuccessModal(true);
      } else {
        // Handle specific duplicate error or validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorObj: any = {};
          data.errors.forEach((err: any) => {
            errorObj[err.field] = err.message;
          });
          setErrors(errorObj);
          toast.error('Please check the form for errors');
        } else if (response.status === 409) {
          // Duplicate key error from backend
          toast.error(data.message || 'Phone number or document already registered');
        } else {
          toast.error(data.message || 'Registration failed');
        }
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">


      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-2xl fade-in">

        {/* Header */}
        <div className="text-center mb-10">

          <h1 className="text-4xl md:text-6xl font-black text-[#0f172a] mb-3 tracking-tighter uppercase">
            Retail <span className="text-blue-600 relative">Champions
              <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-blue-600/10 rounded-full -z-10"></span>
            </span>
          </h1>

          <p className="text-slate-400 text-xs md:text-sm font-black uppercase tracking-[0.3em] ml-1">
            Official Participant Registration Portal
          </p>

        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-8 md:p-12">
          <Formik
            initialValues={initialValues}
            validationSchema={registrationSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, isSubmitting, errors, touched, values }) => (
              <Form className="space-y-7">
                {/* Selfie Upload */}
                <div className="flex flex-col items-center justify-center space-y-4 mb-8">
                  <div className="relative group">
                    <input
                      type="file"
                      id="selfie"
                      name="selfie"
                      accept=".jpg,.jpeg,.png"
                      capture="user"
                      onChange={(event) =>
                        handleFileChange(event, setFieldValue, 'selfie', setSelfiePreview)
                      }
                      className="hidden"
                    />
                    <label
                      htmlFor="selfie"
                      className={`relative flex flex-col items-center justify-center w-36 h-36 rounded-full border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
                        errors.selfie && touched.selfie
                          ? 'border-[#ef4444] bg-red-50/30'
                          : 'border-[#cbd5e1] bg-[#f8fafc] hover:bg-[#f1f5f9] hover:border-[#334155]'
                      }`}
                    >
                      {selfiePreview ? (
                        <div className="w-full h-full">
                          <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="space-y-2 text-center p-4">
                          <svg className="w-8 h-8 mx-auto text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">
                            Take Selfie
                          </div>
                        </div>
                      )}
                    </label>
                    <div className="absolute bottom-1 right-1 bg-[#334155] text-white p-2 rounded-full shadow-lg border-2 border-white transition-transform group-hover:scale-110">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <label className="block text-xs font-black text-[#334155] uppercase tracking-[0.2em]">
                      Step 1: Participant Photo <span className="text-[#ef4444]">*</span>
                    </label>
                    <ErrorMessage
                      name="selfie"
                      component="div"
                      className="text-[#ef4444] text-[10px] font-medium mt-1 uppercase"
                    />
                  </div>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-[#334155]">
                    Full Name <span className="text-[#ef4444]">*</span>
                  </label>
                  <Field
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    className={`w-full px-4 py-3 rounded-md border ${
                      errors.name && touched.name
                        ? 'border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444]'
                        : 'border-[#e2e8f0] focus:ring-1 focus:ring-[#334155] focus:border-[#334155]'
                    } focus:outline-none transition-all bg-white text-[#1f2937] placeholder-[#94a3b8]`}
                  />
                  <ErrorMessage name="name" component="div" className="text-[#ef4444] text-xs font-normal" />
                </div>

                {/* Package Selection - VIP First */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-[#334155]">
                    Select Contest Package <span className="text-[#ef4444]">*</span>
                  </label>
                  
                  {loadingPackages ? (
                    <div className="text-center py-4 text-slate-400 font-medium">Loading packages...</div>
                  ) : availablePackages.length === 0 ? (
                    <div className="text-center py-4 text-rose-500 font-bold uppercase tracking-widest text-xs">No active packages available</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <select
                          name="package"
                          value={values.package || ''}
                          onChange={(e) => {
                             const val = Number(e.target.value);
                             setFieldValue('package', val);
                          }}
                          className={`w-full px-4 py-4 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-white text-[#334155] font-bold appearance-none cursor-pointer ${
                            values.package
                              ? 'border-blue-500 bg-blue-50/50'
                              : 'border-[#e2e8f0] hover:border-slate-300'
                          }`}
                        >
                          <option value="">Select a package...</option>
                          {availablePackages.filter(pkg => !pkg.isVip).map((pkg) => (
                            <option key={pkg._id} value={pkg.amount}>
                              ₹{pkg.amount.toLocaleString()} — {pkg.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      <div className="text-center">
                            <p className="text-xs text-[#64748b]">
                                Access VIP Benefits?{' '}
                                <a href="/vip/register" className="text-amber-600 hover:text-amber-700 font-bold transition-colors underline-offset-2 hover:underline">
                                Register as VIP
                                </a>
                            </p>
                      </div>
                    </div>
                  )}
                  <ErrorMessage name="package" component="div" className="text-[#ef4444] text-xs font-normal" />
                </div>

                {/* PIN Field - Always Visible */}
                <div className="space-y-2">
                  <label htmlFor="pin" className="block text-sm font-medium text-[#334155]">
                    Package PIN <span className="text-[#ef4444]">*</span>
                  </label>
                    <Field
                      type="text"
                      id="pin"
                      name="pin"
                      placeholder="Enter your 6 digit Retail code"
                      className={`w-full px-4 py-3 rounded-md border ${
                        errors.pin && touched.pin
                          ? 'border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444]'
                          : 'border-[#e2e8f0] focus:ring-1 focus:ring-[#334155] focus:border-[#334155]'
                      } focus:outline-none transition-all bg-white text-[#1f2937] placeholder-[#94a3b8] uppercase tracking-widest font-bold`}
                    />
                    <ErrorMessage
                      name="pin"
                      component="div"
                      className="text-[#ef4444] text-xs font-normal"
                    />
                  </div>

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#334155]">
                    Phone Number <span className="text-[#ef4444]">*</span>
                  </label>
                  <Field
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-md border ${
                      errors.phoneNumber && touched.phoneNumber
                        ? 'border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444]'
                        : 'border-[#e2e8f0] focus:ring-1 focus:ring-[#334155] focus:border-[#334155]'
                    } focus:outline-none transition-all bg-white text-[#1f2937] placeholder-[#94a3b8]`}
                  />
                  <ErrorMessage
                    name="phoneNumber"
                    component="div"
                    className="text-[#ef4444] text-xs font-normal"
                  />
                </div>

                {/* ID Field */}
                <div className="space-y-2">
                  <label htmlFor="registrationId" className="block text-sm font-medium text-[#334155]">
                    ID <span className="text-[#64748b] text-xs font-normal">(Optional, 10-digit number)</span>
                  </label>
                  <Field
                    type="text"
                    id="registrationId"
                    name="registrationId"
                    placeholder="Enter 10-digit ID"
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-md border ${
                      errors.registrationId && touched.registrationId
                        ? 'border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444]'
                        : 'border-[#e2e8f0] focus:ring-1 focus:ring-[#334155] focus:border-[#334155]'
                    } focus:outline-none transition-all bg-white text-[#1f2937] placeholder-[#94a3b8]`}
                  />
                  <ErrorMessage
                    name="registrationId"
                    component="div"
                    className="text-[#ef4444] text-xs font-normal"
                  />
                </div>



                {/* Aadhaar Number Field */}
                <div className="space-y-2">
                  <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-[#334155]">
                    Aadhaar Number <span className="text-[#ef4444]">*</span>
                  </label>
                  <Field
                    type="text"
                    id="aadhaarNumber"
                    name="aadhaarNumber"
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength={12}
                    className={`w-full px-4 py-3 rounded-md border ${
                      errors.aadhaarNumber && touched.aadhaarNumber
                        ? 'border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444]'
                        : 'border-[#e2e8f0] focus:ring-1 focus:ring-[#334155] focus:border-[#334155]'
                    } focus:outline-none transition-all bg-white text-[#1f2937] placeholder-[#94a3b8] font-mono`}
                  />
                  <ErrorMessage
                    name="aadhaarNumber"
                    component="div"
                    className="text-[#ef4444] text-xs font-normal"
                  />
                </div>

                {/* PAN Number Field (Optional) */}
                <div className="space-y-2">
                  <label htmlFor="panNumber" className="block text-sm font-medium text-[#334155]">
                    PAN Number <span className="text-[#64748b] text-xs font-normal">(Optional)</span>
                  </label>
                  <Field
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    placeholder="Enter PAN (e.g., ABCDE1234F)"
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-md border ${
                      errors.panNumber && touched.panNumber
                        ? 'border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444]'
                        : 'border-[#e2e8f0] focus:ring-1 focus:ring-[#334155] focus:border-[#334155]'
                    } focus:outline-none transition-all bg-white text-[#1f2937] placeholder-[#94a3b8] font-mono uppercase`}
                  />
                  <ErrorMessage
                    name="panNumber"
                    component="div"
                    className="text-[#ef4444] text-xs font-normal"
                  />
                </div>



                {/* Bill Upload */}
                <div className="space-y-2">
                  <label htmlFor="userImage" className="block text-sm font-medium text-[#334155]">
                    Bill <span className="text-[#64748b] text-xs font-normal">(Optional)</span>
                  </label>
                  
                  <div className="relative">
                    <input
                      type="file"
                      id="userImage"
                      name="userImage"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(event) =>
                        handleFileChange(event, setFieldValue, 'userImage', setUserImagePreview)
                      }
                      className="hidden"
                    />
                    <label
                      htmlFor="userImage"
                      className={`flex flex-col items-center justify-center w-full px-6 py-10 border border-dashed rounded-md cursor-pointer transition-all ${
                        errors.userImage && touched.userImage
                          ? 'border-[#ef4444] bg-red-50/30 hover:bg-red-50/50'
                          : 'border-[#cbd5e1] bg-[#f8fafc] hover:bg-[#f1f5f9] hover:border-[#94a3b8]'
                      }`}
                    >
                      {userImagePreview ? (
                        <div className="space-y-2 text-center">
                          {userImagePreview.includes('application/pdf') ? (
                            <div className="text-[#334155]">
                              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                          ) : (
                            <img src={userImagePreview} alt="Bill Preview" className="max-h-32 mx-auto rounded-md border-2 border-[#e2e8f0] shadow-sm" />
                          )}
                          <p className="text-sm text-[#334155] font-medium">Bill uploaded successfully</p>
                          <p className="text-xs text-[#64748b]">Click to change</p>
                        </div>
                      ) : (
                        <div className="space-y-3 text-center">
                          <svg className="w-12 h-12 mx-auto text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="text-sm text-[#64748b]">
                            <span className="font-medium text-[#334155]">Click to upload bill</span> or drag and drop
                          </div>
                          <p className="text-xs text-[#94a3b8]">JPG, PNG, PDF (max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  <ErrorMessage
                    name="userImage"
                    component="div"
                    className="text-[#ef4444] text-xs font-normal"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-8 py-3.5 px-6 bg-[#334155] text-white font-medium rounded-md hover:bg-[#475569] focus:outline-none focus:ring-2 focus:ring-[#334155] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Registration'
                  )}
                </button>
              </Form>
            )}
          </Formik>
        </div>
        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-sm text-[#64748b]">
            Attending Training?{' '}
            <a href="/vip/attendance" className="text-blue-600 hover:text-blue-700 font-bold transition-colors underline-offset-2 hover:underline block mt-1">
              Training Meeting Attendance Form
            </a>
          </p>
          {/* 
          <div className="w-12 h-px bg-slate-200 mx-auto"></div>
          <p className="text-sm text-[#64748b]">
            Already a VIP?{' '}
            <a href="/vip/login" className="text-amber-600 hover:text-amber-700 font-bold transition-colors underline-offset-2 hover:underline">
              Access VIP Profile
            </a>
          </p> 
          */}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && registrationData && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.3)] text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-[40px] -ml-16 -mb-16" />

            {/* VIP Badge */}
            {registrationData.vipStatus === 'vip' && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                VIP
              </div>
            )}

            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              registrationData.vipStatus === 'vip' 
                ? 'bg-gradient-to-tr from-amber-100 to-yellow-100'
                : 'bg-emerald-100'
            }`}>
              {registrationData.vipStatus === 'vip' ? (
                <svg className="w-10 h-10 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            <h2 className="text-3xl font-black text-[#0f172a] mb-2 tracking-tight uppercase">
              {registrationData.vipStatus === 'vip' ? 'VIP Registration Successful!' : 'Registration Successful!'}
            </h2>
            <p className="text-[#64748b] font-medium mb-8">Welcome to Retail Champions, {registrationData.name}!</p>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 mb-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Your Coupon Code</span>
              <div className="flex items-center justify-center gap-3 pt-2">
                <p className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-wider font-mono truncate ${registrationData.vipStatus === 'vip' ? 'text-amber-600' : 'text-blue-600'}`}>
                  {registrationData.couponCode}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(registrationData.couponCode);
                    toast.success('Copied to clipboard!', {
                      icon: '📋',
                      style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                        fontSize: '12px'
                      },
                    });
                  }}
                  className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-sm group"
                  title="Copy Code"
                >
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* VIP Portal Link */}
            {registrationData.vipStatus === 'vip' && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-700 text-sm font-bold mb-2">🎉 Congrats! You're now a VIP</p>
                <p className="text-amber-600 text-xs mb-3">Access your VIP dashboard to track referrals and rewards</p>
                <a 
                  href="/vip/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Access VIP Profile
                </a>
              </div>
            )}

              <div className="space-y-4">
              <p className="text-sm font-bold text-[#334155] uppercase tracking-wider mb-2">Join our community</p>
              <a 
                href={
                    availablePackages.find(p => p.amount === registrationData.package)?.whatsappGroupLink || 
                    WHATSAPP_GROUP_LINK
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.474.875 3.183 1.357 4.935 1.358 4.833.002 8.767-3.931 8.77-8.766 0-2.343-.911-4.544-2.566-6.199s-3.855-2.566-6.198-2.567c-4.835 0-8.771 3.935-8.774 8.77-.001 1.573.411 3.103 1.196 4.453l1.01 1.742-1.071 3.91 4.008-1.051zm10.946-6.166c-.103-.173-.38-.277-.796-.485s-2.459-1.213-2.839-1.353-.657-.208-.933.208-.103.208-.069.277.103.173.208.277c.103.104.208.242.311.346.103.104.242.242.103.485s-.208.242-.484.242-.276.104-1.972-.519c-1.319-1.177-2.208-2.632-2.467-3.048s-.027-.64.18-.847c.187-.186.415-.484.622-.726.208-.242.276-.415.415-.691s.069-.519-.034-.726-.933-2.248-1.279-3.078c-.337-.813-.68-.703-.933-.716s-.519-.013-.795-.013-.726.104-1.107.519-1.453 1.419-1.453 3.46 1.487 4.012 1.694 4.288c.208.277 2.925 4.46 7.087 6.256 1.13.487 1.83.649 2.505.862.991.315 1.898.27 2.613.163.796-.118 2.316-1.141 2.645-2.248s.329-2.041.208-2.248z" />
                </svg>
                Join WhatsApp Group
              </a>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-[#334155] font-black uppercase tracking-widest text-[10px] rounded-xl transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


