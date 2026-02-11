
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface ContestCreationProps {
    superWinnerIds?: string[] | null;
}

export default function ContestCreation({ superWinnerIds }: ContestCreationProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'manual' | 'scheduled'>('manual');
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);

  // Form States
  const [eventName, setEventName] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Prize Configuration
  const [useCustomPrizes, setUseCustomPrizes] = useState(false);
  const [prizes, setPrizes] = useState<number[]>([0, 0, 0, 0, 0]);

  const handlePrizeChange = (index: number, value: string) => {
    const newPrizes = [...prizes];
    newPrizes[index] = Number(value) || 0;
    setPrizes(newPrizes);
  };


  const [participantCount, setParticipantCount] = useState<number | null>(null);

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdContestName, setCreatedContestName] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
      if (superWinnerIds && superWinnerIds.length > 0) {
          setParticipantCount(superWinnerIds.length);
          return;
      }
      fetchParticipantCount();
  }, [selectedPackage, startDate, endDate, activeTab, superWinnerIds]);

  const fetchParticipantCount = async () => {
      if (!selectedPackage) return;
      
      try {
          const token = localStorage.getItem('token');
          let url = `${API_ENDPOINTS.USERS.COUNT}?package=${selectedPackage}`;
          
          if (activeTab === 'scheduled' && startDate && endDate) {
               // Filter count by date range as requested
               url += `&startDate=${startDate}&endDate=${endDate}`;
          }
          
          const res = await fetch(url, {
              headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
              setParticipantCount(data.count);
          }
      } catch (err) {
          console.error(err);
      }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.PACKAGES.LIST);
      const data = await res.json();
      if (data.success) {
        setPackages(data.data);
        if (data.data.length > 0 && !superWinnerIds) setSelectedPackage(data.data[0].amount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = () => {
    if (!eventName.trim()) {
        toast.error('Event Name is required');
        return;
    }
    
    if (activeTab === 'scheduled' && (!startDate || !endDate)) {
        toast.error('Start and End dates are required for scheduled contests');
        return;
    }
    setShowConfirmModal(true);
  };

  const confirmCreate = async () => {

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOTTERY.CREATE, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          eventName,
          package: selectedPackage,
          type: activeTab,
          startDate: activeTab === 'scheduled' && startDate ? new Date(startDate).toISOString() : undefined,
          endDate: activeTab === 'scheduled' && endDate ? new Date(endDate).toISOString() : undefined,
          prizes: useCustomPrizes ? prizes : [],
          participantIds: superWinnerIds || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCreatedContestName(eventName);
        setShowConfirmModal(false);
        
        // Reset form
        setEventName('');
        setStartDate('');
        setEndDate('');

        if (activeTab === 'manual') {
            toast.success('Contest created! Redirecting to Spinner...');
            navigate('/admin/spinner');
        } else {
            setShowSuccessModal(true);
        }
      } else {
        toast.error(data.message || 'Failed to create contest');
        setShowConfirmModal(false);
      }
    } catch (err) {
      toast.error('Network error occurred');
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0f172a]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex p-1 bg-white/5 rounded-xl mb-8 w-fit mx-auto">
              <button 
                onClick={() => setActiveTab('manual')}
                className={`px-8 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
              >
                  Manual
              </button>
              <button 
                onClick={() => setActiveTab('scheduled')}
                className={`px-8 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'scheduled' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
              >
                  Scheduled
              </button>
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto">
              {/* Event Name */}
              <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 block">Event Name</label>
                  <input 
                    type="text" 
                    value={eventName} 
                    onChange={e => setEventName(e.target.value)} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 font-bold text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-700" 
                    placeholder={activeTab === 'manual' ? "e.g., Friday Night Special" : "e.g., Weekend Mega Event"}
                  />
              </div>

              {/* Package Selection */}
              <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 block">Package</label>
                  {superWinnerIds && superWinnerIds.length > 0 ? (
                      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/20">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                          </div>
                          <div>
                              <h4 className="font-black text-white text-lg">Super Winner Contest</h4>
                              <p className="text-xs text-slate-400">Exclusive contest for {superWinnerIds.length} selected winners</p>
                          </div>
                      </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {packages.map(pkg => (
                            <button 
                                key={pkg._id} 
                                onClick={() => setSelectedPackage(pkg.amount)}
                                className={`p-3 rounded-xl border font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 ${selectedPackage === pkg.amount ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-slate-400'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{pkg.name}</span>
                                <span className="text-lg">₹{pkg.amount}</span>
                            </button>
                        ))}
                    </div>
                  )}
              </div>

              {/* Date Inputs (Scheduled Only) */}
              {activeTab === 'scheduled' && (
                   <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 block">Start From</label>
                          <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 font-bold text-white text-xs focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 block">End At</label>
                          <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 font-bold text-white text-xs focus:outline-none focus:border-blue-500 transition-colors" />
                      </div>
                   </div>
              )}

              {/* Prize Distribution (Both Manual and Scheduled) */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Prize Distribution</label>
                    <button 
                      onClick={() => setUseCustomPrizes(!useCustomPrizes)}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                          useCustomPrizes ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                        {useCustomPrizes ? 'Custom Prizes Active' : 'Default Prizes'}
                    </button>
                </div>
                
                {useCustomPrizes && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-black/20 rounded-xl border border-white/5">
                        {prizes.map((prize, idx) => (
                            <div key={idx} className={`${idx >= 3 ? 'col-span-1' : ''}`}>
                                <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">
                                    Winner #{idx + 1} Prize
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                    <input 
                                        type="number" 
                                        value={prize || ''}
                                        onChange={(e) => handlePrizeChange(idx, e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 font-bold text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>

              {/* Info Text */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                  <div className="flex gap-3">
                      <div className="mt-1">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                          <h4 className="font-bold text-white text-sm mb-1">{activeTab === 'manual' ? 'Manual Mode' : 'Scheduled Mode'}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed mb-2">
                            {activeTab === 'manual' 
                                ? "In manual mode, you control the spin. Up to 5 winners will be selected manually."
                                : "In scheduled mode, the system will automatically spin after the end time. 5 winners will be selected."
                            }
                          </p>
                          {participantCount !== null && (
                              <p className="text-sm font-bold text-emerald-400">
                                  {participantCount} eligible participants found
                              </p>
                          )}
                      </div>
                  </div>
              </div>

              <button 
                onClick={handleCreate} 
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
                disabled={loading}
              >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Contest</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </>
                  )}
              </button>
          </div>
      </div>
      {/* Confirmation Modal */}
      {showConfirmModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-white mb-2">Confirm Creation</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to create the contest <span className="text-blue-400 font-bold">"{eventName}"</span>?
              {activeTab === 'scheduled' && (
                <span className="block mt-2 text-xs bg-white/5 p-2 rounded text-slate-300">
                  Scheduled for {new Date(startDate).toLocaleString()}
                </span>
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold uppercase text-xs rounded-xl transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmCreate}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Creating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success Modal */}
      {showSuccessModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative bg-[#0f172a] border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Success!</h3>
            <p className="text-slate-400 mb-8">
              Contest <span className="text-emerald-400 font-bold">"{createdContestName}"</span> has been created successfully and is now active.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
