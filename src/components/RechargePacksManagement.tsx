import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';

interface RechargePack {
    _id: string;
    name: string;
    count: number;
    price: number;
    type: 'retail' | 'vip';
    isActive: boolean;
}

export default function RechargePacksManagement() {
    const [activeView, setActiveView] = useState<'retail' | 'vip'>('retail');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [packs, setPacks] = useState<RechargePack[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        count: '',
        price: '',
        type: 'retail' as 'retail' | 'vip'
    });

    useEffect(() => {
        fetchPacks();
    }, []);

    const fetchPacks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.RECHARGE_PACKS.LIST, {
                 headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPacks(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load packs');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this pack?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ENDPOINTS.RECHARGE_PACKS.DELETE(id), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Pack deleted');
                fetchPacks();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleEdit = (pack: RechargePack) => {
        setEditingId(pack._id);
        setFormData({
            name: pack.name,
            count: pack.count.toString(),
            price: pack.price.toString(),
            type: pack.type
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ name: '', count: '', price: '', type: activeView });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingId 
                ? API_ENDPOINTS.RECHARGE_PACKS.UPDATE(editingId)
                : API_ENDPOINTS.RECHARGE_PACKS.CREATE;
            
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                toast.success(editingId ? 'Pack updated' : 'Pack created successfully');
                setShowModal(false);
                setEditingId(null);
                setFormData({ name: '', count: '', price: '', type: activeView });
                fetchPacks();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    if (loading) return <div className="text-white">Loading packs...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex bg-black/40 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveView('retail')}
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'retail' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Retail Packs
                    </button>
                    <button
                        onClick={() => setActiveView('vip')}
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'vip' ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        VIP Packs
                    </button>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                >
                    <span className="text-xl leading-none font-light">+</span> Create New Pack
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packs.filter(p => p.type === activeView).map(pack => (
                    <div key={pack._id} className={`relative group overflow-hidden bg-gradient-to-br from-[#1e293b] to-black border rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                        pack.type === 'vip' ? 'border-yellow-500/20 hover:border-yellow-500/50 hover:shadow-yellow-900/20' : 'border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-emerald-900/20'
                    }`}>
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                             <button 
                                onClick={() => handleEdit(pack)}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button 
                                onClick={() => handleDelete(pack._id)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-start">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-2 inline-block ${pack.type === 'vip' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {pack.type}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white">{pack.name}</h3>
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Price</p>
                                <p className="text-3xl font-black text-white">₹{pack.price.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Forms</p>
                                <p className={`text-2xl font-black ${pack.type === 'vip' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                    {pack.count}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                
                {packs.filter(p => p.type === activeView).length === 0 && (
                     <div className="col-span-full border-2 border-dashed border-white/10 rounded-2xl p-12 text-center text-slate-500">
                         <p>No {activeView} packs found. Create one to get started.</p>
                     </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">{editingId ? 'Edit Pack' : 'Create New Pack'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Pack Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                    placeholder="e.g. Starter Pack"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Price (₹)</label>
                                    <input 
                                        type="number" 
                                        required
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                        placeholder="1000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Forms Count</label>
                                    <input 
                                        type="number" 
                                        required
                                        value={formData.count}
                                        onChange={e => setFormData({...formData, count: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                        placeholder="10"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Pack Type</label>
                                <div className="flex gap-2 p-1 bg-black/20 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'retail' })}
                                        className={`flex-1 py-2 rounded-lg font-bold transition-all ${formData.type === 'retail' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        Retail
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'vip' })}
                                        className={`flex-1 py-2 rounded-lg font-bold transition-all ${formData.type === 'vip' ? 'bg-yellow-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        VIP
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors shadow-lg ${
                                        formData.type === 'retail' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-900/20'
                                    }`}
                                >
                                    {editingId ? 'Update Pack' : 'Create Pack'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
