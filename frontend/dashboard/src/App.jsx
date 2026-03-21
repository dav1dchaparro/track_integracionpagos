import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
// setMerchant lets us update the active merchant ID used by all API calls
import { setMerchant as setMerchant_api } from './api'

export default function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // merchant is null until the user logs in; null triggers the Login screen
  const [merchant, setMerchant] = useState(null)

  /**
   * Called by Login when the user submits a merchant ID.
   * Updates both the local React state (to unmount the Login screen)
   * and the api.js module-level variable (so all fetch calls use the new ID).
   */
  function handleLogin(id) {
    setMerchant_api(id)   // update the API module so all requests use this merchant
    setMerchant(id)       // trigger re-render and remove Login screen
  }

  // Show login screen until a merchant ID has been provided
  if (!merchant) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Router>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              darkMode={darkMode}
              onToggleDark={() => setDarkMode(!darkMode)}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
            <main className="flex-1 overflow-hidden flex flex-col">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </div>
  )
}
