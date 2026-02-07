import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';

interface Package {
  _id: string;
  name: string;
  amount: number;
  isVip?: boolean;
}

interface PinStats {
  [key: string]: {
    total: number;
    active: number;
    used: number;
    expired: number;
  };
}

interface Pin {
  _id: string;
  code: string;
  package: number;
  status: 'active' | 'used' | 'expired';
  expiryDate: string;
  usedBy?: {
    name: string;
    phoneNumber: string;
  };
}

export default function PinManagement() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [stats, setStats] = useState<PinStats>({});
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);

  // Generation State
  const [genCount, setGenCount] = useState('10');
  const [genExpiry, setGenExpiry] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newlyGeneratedPins, setNewlyGeneratedPins] = useState<Pin[]>([]);

  // List View State
  const [pinsList, setPinsList] = useState<Pin[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchData();
    // Default expiry 30 days
    const date = new Date();
    date.setDate(date.getDate() + 30);
    setGenExpiry(date.toISOString().split('T')[0]);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchPackages(), fetchStats()]);
    setLoading(false);
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.PACKAGES.LIST);
      const data = await res.json();
      if (data.success) setPackages(data.data);
    } catch (err) {
      toast.error('Failed to load packages');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.PINS.STATS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const openGenerate = (pkg: Package) => {
    setSelectedPkg(pkg);
    setNewlyGeneratedPins([]);
    setShowGenerateModal(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ENDPOINTS.PINS.GENERATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          package: selectedPkg.amount,
          count: Number(genCount),
          expiryDate: genExpiry,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.data.length} pins generated!`);
        setNewlyGeneratedPins(data.data);
        fetchStats(); // Update counts
      } else {
        toast.error(data.message || 'Error generating pins');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsGenerating(false);
    }
  };

  const openList = (pkg: Package) => {
    setSelectedPkg(pkg);
    setPage(1);
    setFilterStatus('');
    setShowListModal(true);
    fetchPinsList(pkg.amount, 1, '');
  };

  const fetchPinsList = async (pkgAmount: number, pageNum: number, status: string) => {
    setListLoading(true);
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        package: pkgAmount.toString(),
      });
      if (status) query.append('status', status);

      const res = await fetch(`${API_ENDPOINTS.PINS.LIST}?${query.toString()}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPinsList(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load pins');
    } finally {
      setListLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!selectedPkg) return;
    setPage(newPage);
    fetchPinsList(selectedPkg.amount, newPage, filterStatus);
  };

  const handleFilterChange = (status: string) => {
    if (!selectedPkg) return;
    setFilterStatus(status);
    setPage(1);
    fetchPinsList(selectedPkg.amount, 1, status);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const copyAllGenerated = () => {
    const text = newlyGeneratedPins.map(p => p.code).join('\n');
    copyToClipboard(text);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Pin Management</h2>
        <p className="text-slate-400 mt-1">Manage and track offline access codes per package.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
           <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const pkgStats = stats[pkg.amount] || { total: 0, active: 0, used: 0, expired: 0 };
            return (
              <div key={pkg._id} className={`bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden ${pkg.isVip ? 'ring-1 ring-amber-500/30' : ''}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] -mr-16 -mt-16 rounded-full transition-all pointer-events-none ${pkg.isVip ? 'bg-amber-500/20 group-hover:bg-amber-500/30' : 'bg-blue-500/10 group-hover:bg-blue-500/20'}`} />
                
                <div className="flex justify-between items-start mb-6 relative">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                      {pkg.isVip && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className={`text-2xl font-black mt-1 font-mono ${pkg.isVip ? 'text-amber-400' : 'text-blue-400'}`}>₹{pkg.amount}</p>
                  </div>
                  <div className={`p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform ${pkg.isVip ? 'text-amber-400' : 'text-blue-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <span className="block text-lg font-bold text-emerald-400">{pkgStats.active}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500">Active</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <span className="block text-lg font-bold text-blue-400">{pkgStats.used}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500">Used</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <span className="block text-lg font-bold text-rose-400">{pkgStats.expired}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500">Expired</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <span className="block text-lg font-bold text-white">{pkgStats.total}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500">Total</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <button 
                    onClick={() => openList(pkg)}
                    className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    View List
                  </button>
                  <button 
                    onClick={() => openGenerate(pkg)}
                    className="py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase text-white shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Generate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && selectedPkg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
               <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Generate Pins</h3>
                    <p className="text-blue-400 font-bold mt-1">{selectedPkg.name} — ₹{selectedPkg.amount}</p>
                 </div>
                 <button onClick={() => setShowGenerateModal(false)} className="bg-white/5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>

               {newlyGeneratedPins.length > 0 ? (
                 <div className="space-y-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                        <div className="bg-emerald-500 text-white rounded-full p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                        <p className="text-emerald-400 font-bold text-sm">Successfully generated {newlyGeneratedPins.length} pins!</p>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto custom-scrollbar bg-black/20 rounded-xl p-2 border border-white/5">
                        <div className="grid grid-cols-2 gap-2">
                             {newlyGeneratedPins.map(pin => (
                                 <div key={pin._id} className="bg-white/5 p-2 rounded text-center font-mono font-bold text-lg text-white select-all">{pin.code}</div>
                             ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={copyAllGenerated} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-xl shadow-lg transition-all">Copy All</button>
                        <button onClick={() => { setShowGenerateModal(false); setNewlyGeneratedPins([]); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-xs rounded-xl transition-all">Done</button>
                    </div>
                 </div>
               ) : (
                 <form onSubmit={handleGenerate} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Quantity</label>
                        <input type="number" min="1" max="1000" value={genCount} onChange={e => setGenCount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Expiry Date</label>
                        <input type="date" value={genExpiry} onChange={e => setGenExpiry(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]" />
                    </div>
                    
                    <button type="submit" disabled={isGenerating} className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
                        {isGenerating && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
                        {isGenerating ? 'Generating...' : 'Generate Pins'}
                    </button>
                 </form>
               )}
            </div>
          </div>
        </div>
      )}

      {/* List Modal */}
      {showListModal && selectedPkg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-3xl">
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Pin Database</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1">Viewing {selectedPkg.name} (₹{selectedPkg.amount})</p>
                 </div>
                 <div className="flex gap-3">
                     <select 
                       value={filterStatus} 
                       onChange={(e) => handleFilterChange(e.target.value)}
                       className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white uppercase font-bold focus:outline-none"
                     >
                         <option value="">All Status</option>
                         <option value="active">Active</option>
                         <option value="used">Used</option>
                         <option value="expired">Expired</option>
                     </select>
                     <button onClick={() => setShowListModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                 </div>
              </div>

              <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-[#0f172a] z-10">
                          <tr>
                              <th className="p-3 text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-white/10">Code</th>
                              <th className="p-3 text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-white/10">Status</th>
                              <th className="p-3 text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-white/10">Expiry</th>
                              <th className="p-3 text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-white/10">User Info</th>
                              <th className="p-3 text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-white/10">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {listLoading ? (
                             <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td></tr>
                          ) : pinsList.length === 0 ? (
                             <tr><td colSpan={5} className="p-8 text-center text-slate-500">No pins found</td></tr>
                          ) : (
                             pinsList.map(pin => (
                                 <tr key={pin._id} className="hover:bg-white/5 transition-colors">
                                     <td className="p-3 font-mono font-bold text-white text-lg">{pin.code}</td>
                                     <td className="p-3">
                                         <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                             pin.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                             pin.status === 'used' ? 'bg-blue-500/20 text-blue-400' :
                                             'bg-rose-500/20 text-rose-400'
                                         }`}>
                                             {pin.status}
                                         </span>
                                     </td>
                                     <td className="p-3 text-slate-400 text-xs font-medium">
                                         {new Date(pin.expiryDate).toLocaleDateString()}
                                     </td>
                                     <td className="p-3">
                                         {pin.usedBy ? (
                                             <div>
                                                 <div className="text-white text-xs font-bold">{pin.usedBy.name}</div>
                                                 <div className="text-slate-500 text-[10px]">{pin.usedBy.phoneNumber}</div>
                                             </div>
                                         ) : <span className="text-slate-600 text-xs italic">--</span>}
                                     </td>
                                     <td className="p-3">
                                         <button onClick={() => copyToClipboard(pin.code)} className="text-slate-400 hover:text-white transition-colors">
                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                         </button>
                                     </td>
                                 </tr>
                             ))
                          )}
                      </tbody>
                  </table>
              </div>
              
              <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/5 rounded-b-3xl">
                  <span className="text-xs text-slate-500 font-bold uppercase">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                      <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-xs text-white disabled:opacity-50 transition-colors uppercase font-bold">Prev</button>
                      <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-xs text-white disabled:opacity-50 transition-colors uppercase font-bold">Next</button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
