import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';

interface Package {
  _id: string;
  name: string;
  amount: number;
  description?: string;
  isActive: boolean;
  isVip?: boolean;
  userCount?: number;
}

export default function PackagesManagement() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    amount: '',
    description: '',
    isVip: false,
  });

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.PACKAGES.LIST);
      const data = await response.json();
      if (data.success) {
        setPackages(data.data);
      }
    } catch (err) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackage.name || !newPackage.amount) {
      toast.error('Name and Amount are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.PACKAGES.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newPackage,
          amount: Number(newPackage.amount),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Package created successfully');
        setShowAddModal(false);
        setNewPackage({ name: '', amount: '', description: '', isVip: false });
        fetchPackages();
      } else {
        toast.error(data.message || 'Failed to create package');
      }
    } catch (err) {
      toast.error('Network error while creating package');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.PACKAGES.DELETE(id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Package deleted successfully');
        fetchPackages();
      } else {
        toast.error(data.message || 'Failed to delete package');
      }
    } catch (err) {
      toast.error('Network error while deleting package');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight text-left">Registration Packs</h2>
          <p className="text-slate-300 mt-1 text-left">Manage contest entry fees and tiers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Pack
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && packages.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="inline-block w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : packages.length === 0 ? (
          <div className="col-span-full py-20 bg-white/5 rounded-3xl border border-white/10 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No packages found</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg._id}
              className={`bg-white/5 backdrop-blur-lg border p-6 rounded-3xl transition-all group relative ${
                pkg.isVip 
                  ? 'border-amber-500/50 hover:border-amber-400' 
                  : 'border-white/10 hover:border-blue-500/50'
              }`}
            >
              {/* VIP Badge */}
              {pkg.isVip && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  VIP
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4 text-left">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{pkg.name}</h3>
                  <p className="text-slate-400 text-xs mt-1">{pkg.description || 'No description'}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg font-black text-lg ${
                  pkg.isVip 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-blue-600/20 text-blue-400'
                }`}>
                  ₹{pkg.amount.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered Users</p>
                  <p className="text-white font-black text-xl">{pkg.userCount || 0}</p>
                </div>
                <button
                  onClick={() => handleDelete(pkg._id)}
                  className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4 text-left">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Create New Pack</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                  Pack Name
                </label>
                <input
                  type="text"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  placeholder="e.g. Silver Tier"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={newPackage.amount}
                  onChange={(e) => setNewPackage({ ...newPackage, amount: e.target.value })}
                  placeholder="500"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                  Description
                </label>
                <textarea
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  placeholder="Optional details"
                  rows={3}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none"
                />
              </div>
              
              {/* VIP Toggle */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPackage.isVip}
                    onChange={(e) => setNewPackage({ ...newPackage, isVip: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
                <div>
                  <p className="text-amber-400 font-bold text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    VIP Package
                  </p>
                  <p className="text-amber-500/70 text-[10px]">Enable for referral rewards & VIP benefits</p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs border border-white/10 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-4 font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg ${
                    newPackage.isVip
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-500/30'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                  }`}
                >
                  Create Pack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

