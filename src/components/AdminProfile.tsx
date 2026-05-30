import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

export default function AdminProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Secret contest winner override state
  const [contestPhone, setContestPhone] = useState('');
  const [savedContestPhone, setSavedContestPhone] = useState<string | null>(null);
  const [savingContest, setSavingContest] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const [profileRes, contestRes] = await Promise.all([
          fetch(API_ENDPOINTS.AUTH.ME, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(API_ENDPOINTS.AUTH.CONTEST_WINNER, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const profileData = await profileRes.json();
        if (profileData.success) {
          setOrganizationName(profileData.data.organizationName || '');
          setProfilePictureUrl(profileData.data.profilePictureUrl || null);
        }
        const contestData = await contestRes.json();
        if (contestData.success) {
          setSavedContestPhone(contestData.data.contestWinnerPhone || null);
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveContestPhone = async () => {
    if (!contestPhone.trim()) {
      toast.error('Enter a participant number first');
      return;
    }
    setSavingContest(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.AUTH.CONTEST_WINNER, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestWinnerPhone: contestPhone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedContestPhone(data.data.contestWinnerPhone);
        setContestPhone('');
        toast.success('Contest override saved');
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingContest(false);
    }
  };

  const handleClearContestPhone = async () => {
    setSavingContest(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.AUTH.CONTEST_WINNER, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestWinnerPhone: null }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedContestPhone(null);
        toast.success('Contest override cleared');
      }
    } catch {
      toast.error('Failed to clear');
    } finally {
      setSavingContest(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setNewProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!organizationName.trim()) {
      toast.error('Organization name is required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('organizationName', organizationName.trim());
      if (newProfilePicture) {
        formData.append('profilePicture', newProfilePicture);
      }

      const res = await fetch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Profile updated successfully');
        // Update localStorage so sidebar reflects changes
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.name = data.data.name;
        storedUser.organizationName = data.data.organizationName;
        if (data.data.profilePictureUrl) {
          storedUser.profilePictureUrl = data.data.profilePictureUrl;
        }
        localStorage.setItem('user', JSON.stringify(storedUser));
        setProfilePictureUrl(data.data.profilePictureUrl || profilePictureUrl);
        setNewProfilePicture(null);
        setPreviewUrl(null);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const displayImage = previewUrl || profilePictureUrl;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Profile Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Update your organization details</p>
      </div>

      {/* Secret Contest Winner Override Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">

        {savedContestPhone && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-0.5">Active Override</p>
              <p className="text-amber-300 font-mono text-sm">{savedContestPhone}</p>
            </div>
            <button
              onClick={handleClearContestPhone}
              disabled={savingContest}
              className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-400/50 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            value={contestPhone}
            onChange={(e) => setContestPhone(e.target.value)}
            placeholder="Enter number"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors text-sm font-mono"
          />
          <button
            onClick={handleSaveContestPhone}
            disabled={savingContest || !contestPhone.trim()}
            className="px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap"
          >
            {savingContest ? 'Saving...' : 'Add Number'}
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Profile Picture
          </label>
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {displayImage ? (
                <img src={displayImage} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                {displayImage ? 'Change Image' : 'Upload Image'}
              </button>
              <p className="text-slate-500 text-xs mt-2">JPG, PNG or WebP. Max 5MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Organization Name */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Organization Name
          </label>
          <input
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
            placeholder="Enter organization name"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
