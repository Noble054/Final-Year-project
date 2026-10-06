import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import Analytics from './pages/Analytics';
import BatteryHealth from './pages/BatteryHealth';
import StationMap from './pages/Map';
import StationDetail from './pages/StationDetail';
import BatterySwapDetail from './pages/BatterySwap';
import Reservations from './pages/Reservations';
import Complaints from './pages/Complaints';
import AdminOverview from './pages/Admin';
import AdminNetwork from './pages/AdminNetwork';
import AdminUsers from './pages/AdminUsers';
import AdminFinancials from './pages/AdminFinancials';
import AdminSettings from './pages/AdminSettings';
import OperatorDashboard from './pages/OperatorDashboard';
import StationProfile from './pages/StationProfile';
import SlotManagement from './pages/SlotManagement';
import BatteryInventory from './pages/BatteryInventory';
import ManageStations from './pages/ManageStations';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute roles={['EV Driver']}>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute roles={['EV Driver']}>
                <AppLayout><Wallet /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute roles={['EV Driver']}>
                <AppLayout><Analytics /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/battery-health" 
            element={
              <ProtectedRoute roles={['EV Driver']}>
                <AppLayout><BatteryHealth /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/map" 
            element={
              <ProtectedRoute roles={['EV Driver']}>
                <AppLayout><StationMap /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stations/:id" 
            element={
              <ProtectedRoute roles={['EV Driver']}>
                <AppLayout><StationDetail /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/battery-swap/:id" 
            element={
              <ProtectedRoute roles={['EV Driver']}>
                <AppLayout><BatterySwapDetail /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reservations" 
            element={
              <ProtectedRoute roles={['EV Driver']}>
                <AppLayout><Reservations /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/complaints"
            element={
              <ProtectedRoute roles={['EV Driver']}>
                <AppLayout><Complaints /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout><AdminOverview /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/network" 
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout><AdminNetwork /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout><AdminUsers /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/financials" 
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout><AdminFinancials /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout><AdminSettings /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-stations" 
            element={
              <ProtectedRoute roles={['Station Operator']}>
                <AppLayout><ManageStations /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/operator" 
            element={
              <ProtectedRoute roles={['Station Operator']}>
                <AppLayout><OperatorDashboard /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/station-profile" 
            element={
              <ProtectedRoute roles={['Station Operator']}>
                <AppLayout><StationProfile /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/slot-management" 
            element={
              <ProtectedRoute roles={['Station Operator']}>
                <AppLayout><SlotManagement /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/battery-inventory" 
            element={
              <ProtectedRoute roles={['Station Operator']}>
                <AppLayout><BatteryInventory /></AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-stations" 
            element={
              <ProtectedRoute roles={['Station Operator']}>
                <AppLayout><ManageStations /></AppLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
