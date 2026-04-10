import { useState, useEffect } from 'react';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import AdminManagement from '../components/AdminManagement';
import AdminRegistrationForm from '../components/AdminRegistrationForm';
import { API_ENDPOINTS } from '../config/api';

interface DashboardStats {
  totalAdmins: number;
  activeAdmins: number;
  inactiveAdmins: number;
  totalUsers: number;
}

export default function SuperAdminDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchStats = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.SUPERADMIN.STATS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchStats();
  }, [activeView]);

  const renderContent = () => {
    switch (activeView) {
      case 'admins':
        return <AdminManagement />;
      case 'register-admin':
        return <AdminRegistrationForm onSuccess={() => { setActiveView('admins'); fetchStats(); }} />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Dashboard</h2>
              <p className="text-slate-400 text-sm mt-1">Platform overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Admins"
                value={stats?.totalAdmins ?? '-'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                }
                color="purple"
              />
              <StatCard
                label="Active Admins"
                value={stats?.activeAdmins ?? '-'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                }
                color="emerald"
              />
              <StatCard
                label="Inactive Admins"
                value={stats?.inactiveAdmins ?? '-'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                }
                color="amber"
              />
              <StatCard
                label="Total Users"
                value={stats?.totalUsers ?? '-'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                }
                color="blue"
              />
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveView('register-admin')}
                  className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold">Register New Admin</p>
                    <p className="text-slate-400 text-sm">Add a new organizational admin</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveView('admins')}
                  className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center group-hover:bg-indigo-600/30 transition-colors">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold">Manage Admins</p>
                    <p className="text-slate-400 text-sm">View, activate/deactivate admins</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col lg:flex-row">
      <SuperAdminSidebar activeView={activeView} onNavigate={setActiveView} user={user} />
      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400',
  };

  const classes = colorMap[color] || colorMap.purple;

  return (
    <div className={`bg-gradient-to-br ${classes} border rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        {icon}
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </div>
  );
}
