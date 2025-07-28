import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './pages/dashboard/Layout'
import Dashboard from './pages/dashboard/Dashboard'
import Customers from './pages/dashboard/Customers'
import Lending from './pages/dashboard/Lending'
import Settings from './pages/dashboard/Settings'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { SettingsProvider } from './contexts/SettingsContext'

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Login />} />
              
              {/* Protected Dashboard Routes */}
              <Route 
                path="/dashboard/*" 
                element={
                  <ProtectedRoute>
                    <DashboardApp />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect any unknown routes to login */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

// Dashboard App Component with internal routing
function DashboardApp() {
  const [activeItem, setActiveItem] = useState('dashboard')

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard />
      case 'customers':
        return <Customers />
      case 'settings':
        return <Settings />
      case 'lending':
        return <Lending />
      case 'history':
        return (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transaction History</h2>
            <p className="text-gray-600">This section is coming soon...</p>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <DashboardLayout 
      activeItem={activeItem}
      onMenuItemClick={setActiveItem}
    >
      {renderContent()}
    </DashboardLayout>
  )
}

export default App
