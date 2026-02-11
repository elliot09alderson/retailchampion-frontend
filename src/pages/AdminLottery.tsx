import { useState, useEffect, useMemo } from 'react';
import { API_ENDPOINTS } from '../config/api';
import UsersManagement from '../components/UsersManagement';
import OperationalGuidelines from '../components/OperationalGuidelines';
import WinnersHistory from '../components/WinnersHistory.tsx';
import PackagesManagement from '../components/PackagesManagement';
import PinManagement from '../components/PinManagement';
import ContestHistory from '../components/ContestHistory';
import ContestCreation from '../components/ContestCreation';

interface Contest {
  _id: string;
  eventName: string;
  package: number;
  totalParticipants: number;
  status: string;
  createdAt: string;
  completedAt: string;
}

interface Package {
  _id: string;
  amount: number;
  name: string;
}

type ViewType = 'info' | 'create_contest' | 'users' | 'winners' | 'history' | 'packages' | 'pins';

export default function AdminLottery() {
  const [activeView, setActiveView] = useState<ViewType>('info');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [contests, setContests] = useState<Contest[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [winnersFilters, setWinnersFilters] = useState<{ contest?: string, package?: string }>({});
  const [superWinnerIds, setSuperWinnerIds] = useState<string[] | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      try {
        // Fetch total users
        const usersRes = await fetch(API_ENDPOINTS.USERS.GET_ALL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setTotalUsers(usersData.data?.length || 0);
        }

        // Fetch packages
        const pkgRes = await fetch(API_ENDPOINTS.PACKAGES.LIST);
        const pkgData = await pkgRes.json();
        if (pkgData.success) {
          setPackages(pkgData.data);
        }

        // Fetch contests
        const contestRes = await fetch(API_ENDPOINTS.LOTTERY.HISTORY, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const contestData = await contestRes.json();
        if (contestData.success) {
          setContests(contestData.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Group contests by package
  const contestsByPackage = useMemo(() => {
    const grouped: Record<number, Contest[]> = {};
    contests.forEach(contest => {
      const pkg = contest.package || 0;
      if (!grouped[pkg]) {
        grouped[pkg] = [];
      }
      grouped[pkg].push(contest);
    });
    return grouped;
  }, [contests]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  const menuItems = [
    { id: 'info', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { id: 'create_contest', label: 'Create Contest', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: 'users', label: 'Users', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
    { id: 'winners', label: 'Winners', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    )},
    { id: 'history', label: 'History', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: 'packages', label: 'Packages', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    )},
    { id: 'pins', label: 'Pins', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
    )},
    { id: 'spinner_link', label: 'Open Spinner', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: 'vip_link', label: 'VIP Management', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
    )},
  ];

  return (
    <div className="h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0f172a]/90 backdrop-blur-xl sticky top-0 z-50">
           <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black">R</div>
               <span className="font-black tracking-tight text-lg">Admin</span>
           </div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
           </button>
        </div>

        <div className="flex relative flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0f172a] border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-full ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 hidden lg:block">
                        <h1 className="text-2xl font-black tracking-tighter">Retail<span className="text-blue-500">Champions</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Admin Console</p>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { 
                                    if (item.id === 'spinner_link') {
                                        window.location.href = '/admin/spinner';
                                        return;
                                    }
                                    if (item.id === 'vip_link') {
                                        window.location.href = '/admin/vip';
                                        return;
                                    }
                                    setActiveView(item.id as ViewType); 
                                    setIsSidebarOpen(false); 
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    activeView === item.id 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                             <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold truncate">{user.name || 'Admin'}</p>
                                 <p className="text-[10px] text-slate-500 truncate">Super Admin</p>
                             </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-xs font-bold uppercase tracking-wider"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Main Content */}
            <main className="flex-1 w-full min-w-0 overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar p-4 lg:p-8 space-y-8">
                     {/* Dynamic Header */}
                     {(activeView === 'info' || activeView === 'create_contest') && (
                     <header className="mb-8 hidden lg:block">
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            {menuItems.find(i => i.id === activeView)?.label}
                        </h2>
                        <p className="text-slate-400 mt-1">Manage your application efficiently.</p>
                     </header>
                     )}

                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeView === 'info' && (
                            <div className="space-y-8">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px] -mr-12 -mt-12" />
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">System Status</p>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xl font-black text-white">Operational</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-[40px] -mr-12 -mt-12" />
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Users</p>
                                        <div className="flex items-center gap-2">
                                            {loadingData ? (
                                              <div className="w-6 h-6 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin" />
                                            ) : (
                                              <span className="text-xl font-black text-white">{totalUsers.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] -mr-12 -mt-12" />
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Contests</p>
                                        <div className="flex items-center gap-2">
                                            {loadingData ? (
                                              <div className="w-6 h-6 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
                                            ) : (
                                              <span className="text-xl font-black text-white">{contests.length}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Contests Grouped by Package */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-white">Contests by Package</h3>
                                        <button 
                                            onClick={() => setActiveView('history')}
                                            className="text-blue-400 text-xs font-bold uppercase tracking-widest hover:text-blue-300 transition-colors"
                                        >
                                            View All →
                                        </button>
                                    </div>
                                    
                                    {loadingData ? (
                                        <div className="py-12 text-center">
                                            <div className="inline-block w-10 h-10 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
                                        </div>
                                    ) : Object.keys(contestsByPackage).length === 0 ? (
                                        <div className="py-12 bg-white/5 rounded-2xl border border-white/10 text-center">
                                            <p className="text-slate-400 font-bold">No contests yet</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {packages.map(pkg => {
                                                const pkgContests = contestsByPackage[pkg.amount] || [];
                                                return (
                                                    <div key={pkg._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                                        {/* Package Header */}
                                                        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 border-b border-white/10">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pkg.amount === 0 ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                                                        {pkg.amount === 0 ? (
                                                                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                        ) : (
                                                                           <span className="font-black text-white text-sm">₹</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-black text-white text-lg">{pkg.amount === 0 ? 'Universal' : `₹${pkg.amount.toLocaleString()} Pack`}</h4>
                                                                        <p className="text-slate-400 text-xs">{pkg.name || 'Package'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white/10 px-3 py-1 rounded-full">
                                                                    <span className="text-white font-bold text-sm">{pkgContests.length} Contests</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Contest List */}
                                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                                            {pkgContests.length === 0 ? (
                                                                <div className="p-6 text-center">
                                                                    <p className="text-slate-500 text-sm">No contests for this package</p>
                                                                </div>
                                                            ) : (
                                                                <div className="divide-y divide-white/5">
                                                                    {pkgContests.slice(0, 5).map((contest, idx) => (
                                                                        <div key={contest._id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                                                                                        {idx + 1}
                                                                                    </span>
                                                                                    <div>
                                                                                        <p className="font-bold text-white text-sm">{contest.eventName}</p>
                                                                                        <p className="text-slate-500 text-xs">
                                                                                            {new Date(contest.completedAt || contest.createdAt).toLocaleDateString('en-IN', {
                                                                                                day: 'numeric',
                                                                                                month: 'short',
                                                                                                year: 'numeric'
                                                                                            })}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-slate-400 text-xs">{contest.totalParticipants} participants</span>
                                                                                    <span className={`w-2 h-2 rounded-full ${contest.status === 'completed' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {pkgContests.length > 5 && (
                                                                        <div className="p-3 text-center bg-white/5">
                                                                            <button 
                                                                                onClick={() => setActiveView('history')}
                                                                                className="text-blue-400 text-xs font-bold hover:text-blue-300"
                                                                            >
                                                                                +{pkgContests.length - 5} more contests
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                <OperationalGuidelines />
                            </div>
                        )}
                        {activeView === 'create_contest' && <ContestCreation superWinnerIds={superWinnerIds} />}
                        {activeView === 'users' && <UsersManagement />}
                        {activeView === 'winners' && (
                            <WinnersHistory 
                                initialFilters={winnersFilters} 
                                onCreateSuperContest={(ids: string[]) => {
                                    setSuperWinnerIds(ids);
                                    setActiveView('create_contest');
                                }} 
                            />
                        )}
                        {activeView === 'history' && (
                            <ContestHistory 
                                onNavigateWinners={(contestName, packageAmount) => {
                                    setWinnersFilters({ contest: contestName, package: packageAmount });
                                    setActiveView('winners');
                                }} 
                            />
                        )}
                        {activeView === 'packages' && <PackagesManagement />}
                        {activeView === 'pins' && <PinManagement />}
                     </div>
                </div>
            </main>
        </div>
    </div>
  );
}
