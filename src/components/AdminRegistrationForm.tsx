import { useState } from 'react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

interface AdminRegistrationFormProps {
  onSuccess?: () => void;
}

export default function AdminRegistrationForm({ onSuccess }: AdminRegistrationFormProps) {
  const [formData, setFormData] = useState({
    organizationName: '',
    phoneNumber: '',
    alternateContactNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = localStorage.getItem('token');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Contact number is required';
    if (!/^\d{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Must be exactly 10 digits';
    if (formData.alternateContactNumber && !/^\d{10}$/.test(formData.alternateContactNumber)) {
      newErrors.alternateContactNumber = 'Must be exactly 10 digits';
    }
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('organizationName', formData.organizationName);
      fd.append('phoneNumber', formData.phoneNumber);
      fd.append('alternateContactNumber', formData.alternateContactNumber);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      fd.append('address', formData.address);
      if (profilePicture) {
        fd.append('profilePicture', profilePicture);
      }

      const res = await fetch(API_ENDPOINTS.SUPERADMIN.REGISTER_ADMIN, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Admin registered successfully!');
        setFormData({
          organizationName: '',
          phoneNumber: '',
          alternateContactNumber: '',
          email: '',
          password: '',
          confirmPassword: '',
          address: '',
        });
        setProfilePicture(null);
        setPreviewUrl(null);
        onSuccess?.();
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch {
      toast.error('Failed to register admin');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg bg-white/5 border ${errors[field] ? 'border-red-500/50' : 'border-white/10'} text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all text-sm`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Register New Admin</h2>
        <p className="text-slate-400 text-sm mt-1">Create a new organizational admin account</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors group"
            onClick={() => document.getElementById('profilePicture')?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <svg className="w-8 h-8 text-slate-500 mx-auto group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] text-slate-500 mt-1 block">Profile Photo</span>
              </div>
            )}
          </div>
          <input
            id="profilePicture"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-slate-500 text-xs">Click to upload (Max 5MB)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Organization Name */}
          <div className="md:col-span-2">
            <label className="block text-slate-300 font-medium mb-2 text-sm">Organization Name *</label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="Enter organization name"
              className={inputClass('organizationName')}
            />
            {errors.organizationName && <p className="text-red-400 text-xs mt-1">{errors.organizationName}</p>}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-slate-300 font-medium mb-2 text-sm">Contact Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="10-digit number"
              maxLength={10}
              className={inputClass('phoneNumber')}
            />
            {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}
          </div>

          {/* Alternate Contact */}
          <div>
            <label className="block text-slate-300 font-medium mb-2 text-sm">Alternate Contact Number</label>
            <input
              type="tel"
              name="alternateContactNumber"
              value={formData.alternateContactNumber}
              onChange={handleChange}
              placeholder="10-digit number (optional)"
              maxLength={10}
              className={inputClass('alternateContactNumber')}
            />
            {errors.alternateContactNumber && <p className="text-red-400 text-xs mt-1">{errors.alternateContactNumber}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-300 font-medium mb-2 text-sm">Email ID *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              className={inputClass('email')}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-slate-300 font-medium mb-2 text-sm">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className={`${inputClass('password')} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-slate-300 font-medium mb-2 text-sm">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={`${inputClass('confirmPassword')} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-slate-300 font-medium mb-2 text-sm">Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full address"
              rows={3}
              className={`${inputClass('address')} resize-none`}
            />
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0f172a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Registering...
            </span>
          ) : 'Register Admin'}
        </button>
      </form>
    </div>
  );
}
