import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import RegistrationForm from './RegistrationForm';
import LotteryDashboard from './pages/LotteryDashboard';
import AdminLottery from './pages/AdminLottery';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegistrationForm />} />
        <Route path="/lottery" element={<LotteryDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/lottery" 
          element={
            <ProtectedRoute>
              <AdminLottery />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
