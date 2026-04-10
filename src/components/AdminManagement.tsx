import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

interface Admin {
  _id: string;
  organizationName: string;
  phoneNumber: string;
  alternateContactNumber?: string;
  email: string;
  address: string;
  status: string;
  role: string;
  profilePictureUrl?: string;
  createdAt: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchAdmins = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.SUPERADMIN.ADMINS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // Filter out superadmin accounts
        setAdmins(data.data.filter((a: Admin) => a.role !== 'superadmin'));
      }
    } catch {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(API_ENDPOINTS.SUPERADMIN.UPDATE_STATUS(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setAdmins(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!deletePassword.trim()) {
      toast.error('Please enter your Super Admin password');
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.SUPERADMIN.DELETE_ADMIN(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin deleted successfully');
        setAdmins(prev => prev.filter(a => a._id !== id));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to delete admin');
    }
    setDeleteConfirm(null);
    setDeletePassword('');
    setDeleteLoading(false);
  };

  const filtered = admins.filter(a =>
    a.organizationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.phoneNumber?.includes(searchQuery) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Management</h2>
          <p className="text-slate-400 text-sm mt-1">{admins.length} total admin{admins.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none text-sm w-full sm:w-72"
          />
        </div>
      </div>

      {/* Admin Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-slate-400 text-lg font-medium">No admins found</p>
          <p className="text-slate-500 text-sm mt-1">Register a new admin to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((admin) => (
            <div key={admin._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {admin.profilePictureUrl ? (
                    <img
                      src={admin.profilePictureUrl}
                      alt={admin.organizationName}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                      {admin.organizationName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-bold text-lg truncate">{admin.organizationName}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {admin.phoneNumber}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          {admin.email}
                        </span>
                        {admin.alternateContactNumber && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            Alt: {admin.alternateContactNumber}
                          </span>
                        )}
                      </div>
                      {admin.address && (
                        <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {admin.address}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      admin.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {admin.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <button
                      onClick={() => toggleStatus(admin._id, admin.status)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        admin.status === 'active'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>

                    {deleteConfirm === admin._id ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                        <span className="text-red-400 text-xs font-bold">Enter Super Admin password:</span>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Password"
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-red-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 w-40"
                          onKeyDown={(e) => e.key === 'Enter' && handleDelete(admin._id)}
                          autoFocus
                        />
                        <button
                          onClick={() => handleDelete(admin._id)}
                          disabled={deleteLoading}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => { setDeleteConfirm(null); setDeletePassword(''); }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(admin._id)}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Delete
                      </button>
                    )}

                    <span className="ml-auto text-slate-600 text-xs">
                      Created {new Date(admin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
