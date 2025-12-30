import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';

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
  userImage: Yup.mixed()
    .required('Bill is required')
    .test('fileSize', 'File size must be less than 5MB', (value: any) => {
      return value && value.size <= 5242880;
    })
    .test('fileType', 'Only JPG, JPEG, PNG, PDF files are allowed', (value: any) => {
      return value && ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(value.type);
    }),
});

interface FormValues {
  name: string;
  phoneNumber: string;
  aadhaarNumber: string;
  panNumber: string;
  userImage: File | null;
}

export default function RegistrationForm() {
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);

  const initialValues: FormValues = {
    name: '',
    phoneNumber: '',
    aadhaarNumber: '',
    panNumber: '',
    userImage: null,
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
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('phoneNumber', values.phoneNumber);
      formData.append('aadhaarNumber', values.aadhaarNumber);
      if (values.panNumber) {
        formData.append('panNumber', values.panNumber);
      }
      if (values.userImage) {
        formData.append('image', values.userImage);
      }

      const response = await fetch('http://localhost:5001/api/users/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Registration successful!\n\nWelcome ${data.data.name}!\nYour account has been created.`);
        // Reset form or redirect to login
        window.location.href = '/'; // Redirect to home/login
      } else {
        // Show validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorObj: any = {};
          data.errors.forEach((err: any) => {
            errorObj[err.field] = err.message;
          });
          setErrors(errorObj);
        } else {
          alert(`❌ Registration failed:\n${data.message}`);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('❌ Failed to register. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#0f172a] mb-2 tracking-tight">
            Retail Champions
          </h1>
          <p className="text-[#64748b] text-sm font-normal">
            Complete your registration to get started
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-8 md:p-12">
          <Formik
            initialValues={initialValues}
            validationSchema={registrationSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, isSubmitting, errors, touched }) => (
              <Form className="space-y-7">
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
                    Bill <span className="text-[#ef4444]">*</span>
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
                            <span className="font-medium text-[#334155]">Click to upload</span> or drag and drop
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
        <p className="text-center text-sm text-[#64748b] mt-8">
          Already registered?{' '}
          <a href="#" className="text-[#334155] hover:text-[#0f172a] font-medium transition-colors underline-offset-2 hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
