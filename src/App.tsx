import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';


import './index.css';
import RegistrationForm from './RegistrationForm';
import LotteryDashboard from './pages/LotteryDashboard';
import AdminLottery from './pages/AdminLottery';
import SpinnerController from './pages/SpinnerController';
import AdminLogin from './pages/AdminLogin';
import VIPManagement from './pages/VIPManagement';
import VIPLogin from './pages/VIPLogin';
import VIPProfile from './pages/VIPProfile';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminProtectedRoute from './components/SuperAdminProtectedRoute';
import VIPRegistration from './pages/VIPRegistration';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ProductManagement from './pages/ProductManagement';
import OrderManagement from './pages/OrderManagement';
import VIPProducts from './pages/VIPProducts';
import BuyProduct from './pages/BuyProduct';
import AdminOrSuperAdminRoute from './components/AdminOrSuperAdminRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>


        <Route path="/" element={<RegistrationForm />} />
        <Route path="/lottery" element={<LotteryDashboard />} />
        <Route path="/admin" element={<Navigate to="/admin/lottery" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/lottery" 
          element={
            <ProtectedRoute>
              <AdminLottery />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/spinner" 
          element={
            <ProtectedRoute>
              <SpinnerController />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/vip"
          element={
            <ProtectedRoute>
              <VIPManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminOrSuperAdminRoute>
              <ProductManagement />
            </AdminOrSuperAdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminOrSuperAdminRoute>
              <OrderManagement />
            </AdminOrSuperAdminRoute>
          }
        />
        {/* Super Admin Routes */}
        <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        <Route
          path="/superadmin/dashboard"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminDashboard />
            </SuperAdminProtectedRoute>
          }
        />

        {/* VIP Routes */}
        <Route path="/vip/login" element={<VIPLogin />} />
        <Route path="/vip/profile" element={<VIPProfile />} />
        <Route path="/vip/attendance" element={<VIPRegistration />} />
        <Route path="/vip/register" element={<VIPRegistration />} />
        <Route path="/vip/products" element={<VIPProducts />} />
        <Route path="/vip/products/:id/buy" element={<BuyProduct />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

