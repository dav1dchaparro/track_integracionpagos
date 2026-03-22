import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import SellerDashboard from './pages/SellerDashboard'
import UserManagement from './pages/UserManagement'
import PurchasePatterns from './pages/PurchasePatterns'
import Insights from './pages/Insights'
import Categories from './pages/Categories'
import Products from './pages/Products'

function AppInner() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Not logged in → show login or register
  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--scifi-bg)' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(!darkMode)}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="flex-1 overflow-hidden flex flex-col">
            <Routes>
              {/* Home: owner → full dashboard, seller → personal dashboard */}
              <Route
                path="/"
                element={user.role === 'owner' ? <Dashboard /> : <SellerDashboard />}
              />

              {/* Owner-only routes */}
              <Route
                path="/users"
                element={user.role === 'owner' ? <UserManagement /> : <Navigate to="/" replace />}
              />
              <Route
                path="/purchase-patterns"
                element={user.role === 'owner' ? <PurchasePatterns /> : <Navigate to="/" replace />}
              />
              <Route
                path="/insights"
                element={user.role === 'owner' ? <Insights /> : <Navigate to="/" replace />}
              />

              <Route path="/categories" element={<Categories />} />
              <Route path="/products" element={<Products />} />

              {/* Available for all */}
              <Route path="/settings" element={<Settings />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppInner />
      </Router>
    </AuthProvider>
  )
}
