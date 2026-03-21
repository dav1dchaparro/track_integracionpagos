import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export async function apiFetch(path, options = {}, _retried = false) {
  const token = localStorage.getItem('auth_token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(path, { ...options, headers })

  // Auto-refresh on 401
  if (res.status === 401 && token && !_retried) {
    const refreshRes = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (refreshRes.ok) {
      const { access_token } = await refreshRes.json()
      localStorage.setItem('auth_token', access_token)
      return apiFetch(path, options, true)
    }
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
    throw new Error('Sesion expirada')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Error del servidor')
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    apiFetch('/auth/me')
      .then(u => setUser({ ...u, role: 'owner', initials: u.store_name.slice(0, 2).toUpperCase() }))
      .catch(() => {
        localStorage.removeItem('auth_token')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem('auth_token', data.access_token)
      const me = await apiFetch('/auth/me')
      setUser({ ...me, role: 'owner', initials: me.store_name.slice(0, 2).toUpperCase() })
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  }

  const register = async ({ storeName, email, password }) => {
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ store_name: storeName, email, password }),
      })
      return await login(email, password)
    } catch (err) {
      return { error: err.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  if (loading) {
    return null
  }

  // Stubs for seller management (not yet backed by API)
  const sellers = []
  const sellerPerms = {}
  const addSeller = () => {}
  const removeSeller = () => {}
  const updatePerm = () => {}
  const getPerms = () => ({ reports: false, analytics: false })

  return (
    <AuthContext.Provider value={{
      user, login, logout, register,
      sellers, sellerPerms, addSeller, removeSeller, updatePerm, getPerms,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
