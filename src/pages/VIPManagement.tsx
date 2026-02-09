import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import PackagesManagement from '../components/PackagesManagement';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VIP {
  _id: string;
  name: string;
  phoneNumber: string;
  couponCode: string;
  package: number;
  vipStatus: string;
  referralCode: string | null;
  referralCount: number;
  selfieUrl?: string;
  createdAt: string;
}

interface VIPReferral {
  _id: string;
  name: string;
  phoneNumber: string;
  vipStatus: string;
  createdAt: string;
}

interface GalleryItem {
  _id: string;
  imageUrl: string;
  heading?: string;
  subheading?: string;
  description?: string;
  createdAt: string;
}

export default function VIPManagement() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as 'vip' | 'vvip' | 'packages') || 'vip';

  const [activeTab, setActiveTab] = useState<'vip' | 'vvip' | 'packages'>(initialTab);
  const [vips, setVips] = useState<VIP[]>([]);
  const [vvips, setVvips] = useState<VIP[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVIP, setSelectedVIP] = useState<VIP | null>(null);
  const [referrals, setReferrals] = useState<VIPReferral[]>([]);
  const [referralStats, setReferralStats] = useState<{ total: number; vipCount: number; vvipCount: number } | null>(null);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Gallery State
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newHeading, setNewHeading] = useState('');
  const [newSubheading, setNewSubheading] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  const token = localStorage.getItem('token');

  const fetchVIPs = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.VIP.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setVips(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch VIPs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVVIPs = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.VIP.VVIP_LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setVvips(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch VVIPs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGallery = async () => {
      try {
          const res = await fetch(API_ENDPOINTS.GALLERY.LIST);
          const data = await res.json();
          if(data.success) setGalleryItems(data.data);
      } catch(e) { console.error(e); }
  };

  useEffect(() => {
      if(showGalleryModal) fetchGallery();
  }, [showGalleryModal]);

  const generateReferralCode = async (vipId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.VIP.GENERATE_REFERRAL(vipId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Referral code generated: ${data.data.referralCode}` });
        // Refresh the list
        if (activeTab === 'vip') fetchVIPs();
        else fetchVVIPs();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to generate referral code' });
    }
  };

  const viewReferrals = async (vip: VIP) => {
    setSelectedVIP(vip);
    try {
      const response = await fetch(API_ENDPOINTS.VIP.GET_REFERRALS(vip._id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setReferrals(data.data.referrals);
        setReferralStats(data.data.stats);
        setShowReferralsModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    }
  };

  const handleUpdateGalleryItem = async () => {
    if (!editingItem) return;
    try {
        setUploading(true);
        const res = await fetch(API_ENDPOINTS.GALLERY.UPDATE(editingItem._id), {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                heading: newHeading,
                subheading: newSubheading,
                description: newDescription 
            })
        });
        const data = await res.json();
        if (data.success) {
            setGalleryItems(galleryItems.map(i => i._id === editingItem._id ? data.data : i));
            setNewHeading('');
            setNewSubheading('');
            setNewDescription('');
            setEditingItem(null);
            setMessage({ type: 'success', text: 'Item updated successfully' });
        } else {
            setMessage({ type: 'error', text: data.message });
        }
    } catch (e) {
        console.error(e);
        setMessage({ type: 'error', text: 'Update failed' });
    } finally {
        setUploading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image', file);
      formData.append('heading', newHeading);
      formData.append('subheading', newSubheading);
      formData.append('description', newDescription);

      setUploading(true);
      try {
          const res = await fetch(API_ENDPOINTS.GALLERY.UPLOAD, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }, // Content-Type auto-set
              body: formData
          });
          const data = await res.json();
          if (data.success) {
               setGalleryItems([data.data, ...galleryItems]);
               setNewHeading('');
               setNewSubheading('');
               setNewDescription('');
               setMessage({ type: 'success', text: 'Image uploaded successfully' });
          } else {
               setMessage({ type: 'error', text: data.message });
          }
      } catch (err) {
          console.error(err);
          setMessage({ type: 'error', text: 'Upload failed' });
      } finally {
          setUploading(false);
          // Clear input
          e.target.value = '';
      }
  };

  const handleDeleteImage = async (id: string) => {
      if (!confirm('Are you sure you want to delete this image?')) return;

      try {
          const res = await fetch(API_ENDPOINTS.GALLERY.DELETE(id), {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
               setGalleryItems(galleryItems.filter(i => i._id !== id));
               setMessage({ type: 'success', text: 'Image deleted' });
          }
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
    if (activeTab === 'vip') {
      fetchVIPs();
    } else if (activeTab === 'vvip') {
      fetchVVIPs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const currentList = activeTab === 'vip' ? vips : vvips;

  const handleDeleteVIP = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete VIP member "${name}"? This action cannot be undone.`)) return;

    try {
        const res = await fetch(API_ENDPOINTS.VIP.DELETE(id), {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            setMessage({ type: 'success', text: 'VIP member deleted successfully' });
            if (activeTab === 'vip') setVips(vips.filter(v => v._id !== id));
            else setVvips(vvips.filter(v => v._id !== id));
        } else {
            setMessage({ type: 'error', text: data.message });
        }
    } catch (err) {
        setMessage({ type: 'error', text: 'Failed to delete VIP member' });
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('WARNING: Are you sure you want to delete ALL VIP and VVIP members? This action is irreversible!')) return;
    
    if (!confirm('Please confirm again. This will wipe the entire VIP database. Are you absolutely sure?')) return;

    try {
        const res = await fetch(API_ENDPOINTS.VIP.DELETE_ALL, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            setMessage({ type: 'success', text: 'All VIP members deleted successfully' });
            setVips([]);
            setVvips([]);
        } else {
            setMessage({ type: 'error', text: data.message });
        }
    } catch (err) {
        setMessage({ type: 'error', text: 'Failed to delete all members' });
    }
  };

  const exportToCSV = () => {
    const listToExport = activeTab === 'vip' ? vips : vvips;
    const type = activeTab.toUpperCase();
    
    if (listToExport.length === 0) {
      setMessage({ type: 'error', text: 'No data to export' });
      return;
    }

    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Phone Number,Package(INR),Login Code,VIP Status,Referral Code,Referral Count,Created At\n";

    // CSV Rows
    listToExport.forEach(item => {
      const row = [
        `"${item.name}"`,
        `"${item.phoneNumber}"`,
        item.package,
        item.couponCode,
        item.vipStatus,
        item.referralCode || 'Not Generated',
        item.referralCount,
        new Date(item.createdAt).toLocaleDateString()
      ].join(",");
      csvContent += row + "\n";
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const listToExport = activeTab === 'vip' ? vips : vvips;
    const type = activeTab.toUpperCase();

    if (listToExport.length === 0) {
      setMessage({ type: 'error', text: 'No data to export' });
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(`${type} Members List`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Name", "Phone", "Package", "Login Code", "Ref. Code", "Ref. Count"];
    const tableRows: any[] = [];

    listToExport.forEach(item => {
      const row = [
        item.name,
        item.phoneNumber,
        item.package,
        item.couponCode,
        item.referralCode || '-',
        item.referralCount
      ];
      tableRows.push(row);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 179, 8], textColor: 0 } // Yellow header
    });

    doc.save(`${type}_List_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              VIP <span className="text-yellow-500">Management</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage VIPs and VVIPs, generate referral codes</p>
          </div>
          <div className="flex gap-3">
             {activeTab !== 'packages' && (
               <>
                 <button
                    onClick={exportToCSV}
                    className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-lg text-sm font-bold border border-emerald-600/20 transition-all flex items-center gap-2"
                    title="Export to CSV"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export CSV
                 </button>
                 <button
                    onClick={exportToPDF}
                    className="px-3 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-lg text-sm font-bold border border-rose-600/20 transition-all flex items-center gap-2"
                    title="Export to PDF"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Export PDF
                 </button>
               </>
             )}

             <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-sm font-bold border border-red-600/20 transition-all flex items-center gap-2"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete All
             </button>

             <button
                onClick={() => setShowGalleryModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Winner Gallery
             </button>
             <Link
                to="/admin/lottery"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                ← Back
              </Link>
          </div>
        </div>

        {/* Message Toast */}
        {message && (
          <div
            className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
              message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('vip')}
            className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'vip'
                ? 'bg-yellow-500 text-black'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            VIP Members ({vips.length})
          </button>
          <button
            onClick={() => setActiveTab('vvip')}
            className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'vvip'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            VVIP Members ({vvips.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'packages'
                ? 'bg-amber-500 text-black'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            VIP Packages
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'packages' ? (
             <PackagesManagement mode="vip" />
        ) : (
             <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-slate-400 mt-4">Loading...</p>
                    </div>
                ) : currentList.length === 0 ? (
                    <div className="p-12 text-center">
                    <div className="text-6xl mb-4">{activeTab === 'vip' ? '👑' : '💎'}</div>
                    <p className="text-slate-400">No {activeTab.toUpperCase()} members yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                            Member
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                            WhatsApp
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                            Package
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                            Login Code
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                            Referral Code
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                            Referrals
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                            Actions
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentList.map((vip) => (
                        <tr key={vip._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <img
                                src={vip.selfieUrl || '/placeholder.png'}
                                alt={vip.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/50"
                                />
                                <p className="font-semibold text-white">{vip.name}</p>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.474.875 3.183 1.357 4.935 1.358 4.833.002 8.767-3.931 8.77-8.766 0-2.343-.911-4.544-2.566-6.199s-3.855-2.566-6.198-2.567c-4.835 0-8.771 3.935-8.774 8.77-.001 1.573.411 3.103 1.196 4.453l1.01 1.742-1.071 3.91 4.008-1.051zm10.946-6.166c-.103-.173-.38-.277-.796-.485s-2.459-1.213-2.839-1.353-.657-.208-.933.208-.103.208-.069.277.103.173.208.277c.103.104.208.242.311.346.103.104.242.242.103.485s-.208.242-.484.242-.276.104-1.972-.519c-1.319-1.177-2.208-2.632-2.467-3.048s-.027-.64.18-.847c.187-.186.415-.484.622-.726.208-.242.276-.415.415-.691s.069-.519-.034-.726-.933-2.248-1.279-3.078c-.337-.813-.68-.703-.933-.716s-.519-.013-.795-.013-.726.104-1.107.519-1.453 1.419-1.453 3.46 1.487 4.012 1.694 4.288c.208.277 2.925 4.46 7.087 6.256 1.13.487 1.83.649 2.505.862.991.315 1.898.27 2.613.163.796-.118 2.316-1.141 2.645-2.248s.329-2.041.208-2.248z" /></svg>
                                <span className="text-sm text-slate-400 font-mono tracking-wide">{vip.phoneNumber}</span>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
                                ₹{vip.package}
                            </span>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-2 group">
                                <code className="px-2 py-1 bg-white/10 rounded text-sm font-mono text-emerald-400">
                                {vip.couponCode}
                                </code>
                                <button
                                onClick={() => {
                                    navigator.clipboard.writeText(vip.couponCode);
                                }}
                                className="text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Copy Code"
                                >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                </button>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            {vip.referralCode ? (
                                <code className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-mono">
                                {vip.referralCode}
                                </code>
                            ) : (
                                <span className="text-slate-500 text-sm">Not generated</span>
                            )}
                            </td>
                            <td className="px-6 py-4">
                            <button
                                onClick={() => viewReferrals(vip)}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm font-medium transition-colors"
                            >
                                {vip.referralCount} referrals
                            </button>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => generateReferralCode(vip._id)}
                                    disabled={!!vip.referralCode}
                                    title={vip.referralCode ? 'Code Generated' : 'Generate Referral Code'}
                                    className={`p-2 rounded-lg transition-all ${
                                    vip.referralCode
                                        ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                                        : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </button>
                                <button
                                    onClick={() => handleDeleteVIP(vip._id, vip.name)}
                                    className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all border border-red-600/20"
                                    title="Delete Member"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    </div>
                )}
             </div>
        )}

        {/* Referrals Modal */}
        {showReferralsModal && selectedVIP && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Referrals by {selectedVIP.name}
                  </h2>
                  {referralStats && (
                    <div className="flex gap-4 mt-2">
                        <span className="text-sm text-slate-400">
                            Total: <strong className="text-white">{referralStats.total}</strong>
                        </span>
                        <span className="text-sm text-yellow-400">
                            VIPs: <strong>{referralStats.vipCount}</strong>
                        </span>
                        <span className="text-sm text-purple-400">
                            VVIPs: <strong>{referralStats.vvipCount}</strong>
                        </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowReferralsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {referrals.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No referrals yet</p>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((r) => (
                      <div
                        key={r._id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-white">{r.name}</p>
                          <p className="text-xs text-slate-400">{r.phoneNumber}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            r.vipStatus === 'vvip'
                              ? 'bg-purple-500/20 text-purple-400'
                              : r.vipStatus === 'vip'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {r.vipStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Global Gallery Modal */}
        {showGalleryModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
               {/* Header */}
               <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div>
                      <h2 className="text-xl md:text-2xl font-black text-white">
                        Winner's <span className="text-blue-500">Hall of Fame</span>
                      </h2>
                      <p className="text-slate-400 text-xs mt-1">Manage global photos visible to all VIPs</p>
                  </div>
                  <button onClick={() => { setShowGalleryModal(false); setEditingItem(null); setNewHeading(''); setNewSubheading(''); setNewDescription(''); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>

               {/* Content */}
               <div className="flex-1 overflow-y-auto p-6">
                   {/* Upload/Edit Area */}
                   <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                       <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">
                           {editingItem ? 'Edit Winner Details' : 'Add New Winner'}
                       </h3>
                       <div className="flex flex-col gap-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <input 
                                    type="text" 
                                    placeholder="Heading (e.g. Winner Name)" 
                                    value={newHeading}
                                    onChange={(e) => setNewHeading(e.target.value)}
                                    className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                               />
                               <input 
                                    type="text" 
                                    placeholder="Subheading (e.g. Month/Year)" 
                                    value={newSubheading}
                                    onChange={(e) => setNewSubheading(e.target.value)}
                                    className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                               />
                           </div>
                           <input 
                                type="text" 
                                placeholder="Description (e.g. Winner of January 2026 Contest)" 
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                           />
                           
                           <div className="flex justify-end pt-2">
                           {editingItem ? (
                               <div className="flex gap-2">
                                   <button 
                                     onClick={handleUpdateGalleryItem}
                                     disabled={uploading}
                                     className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                                   >
                                       {uploading ? 'Updating...' : 'Update'}
                                   </button>
                                   <button 
                                     onClick={() => { setEditingItem(null); setNewHeading(''); setNewSubheading(''); setNewDescription(''); }}
                                     className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl font-bold transition-all"
                                   >
                                       Cancel
                                   </button>
                               </div>
                           ) : (
                               <label className={`flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                   <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                                   {uploading ? (
                                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                   ) : (
                                       <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                   )}
                                   <span className="font-bold text-white text-sm">Upload Photo</span>
                               </label>
                           )}
                           </div>
                       </div>
                   </div>

                   {/* Grid */}
                   <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Gallery ({galleryItems.length})</h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                       {galleryItems.length === 0 ? (
                           <div className="col-span-full py-12 text-center">
                               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                   <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                               </div>
                               <p className="text-slate-500 text-sm">No photos in gallery yet.</p>
                           </div>
                       ) : (
                           galleryItems.map((item) => (
                               <div key={item._id} className="group relative break-inside-avoid">
                                   <div className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-black/40 border border-white/5 ${editingItem?._id === item._id ? 'ring-2 ring-blue-500' : ''}`}>
                                       <img src={item.imageUrl} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                           <div className="flex items-center justify-between gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setNewHeading(item.heading || '');
                                                        setNewSubheading(item.subheading || '');
                                                        setNewDescription(item.description || '');
                                                    }} 
                                                    className="flex-1 p-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg transition-colors text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDeleteImage(item._id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-lg transition-colors" title="Delete">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                           </div>
                                       </div>
                                   </div>
                                   <div className="mt-2 px-1">
                                       {item.heading && <div className="text-sm font-bold text-white truncate">{item.heading}</div>}
                                       {item.subheading && <div className="text-xs text-blue-400 truncate">{item.subheading}</div>}
                                       <div className="text-xs text-slate-400 line-clamp-2 mt-1">
                                           {item.description || 'No description'}
                                       </div>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
