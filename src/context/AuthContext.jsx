import { createContext, useContext, useState, useEffect } from 'react'

const BASE_USERS = [
  {
    id: 1,
    name: 'Carlos Méndez',
    email: 'dueno@demo.com',
    password: '123456',
    role: 'owner',
    initials: 'CM',
    phone: '+34 600 111 222',
    department: 'Dirección General',
  },
  {
    id: 2,
    name: 'Ana García',
    email: 'ana@demo.com',
    password: '123456',
    role: 'seller',
    initials: 'AG',
    phone: '+34 600 333 444',
    department: 'Ventas',
    stats: { revenue: 52000, orders: 184, conversion: 8.2, ticket: 283, goal: 78 },
  },
  {
    id: 3,
    name: 'Carlos Ruiz',
    email: 'carlos@demo.com',
    password: '123456',
    role: 'seller',
    initials: 'CR',
    phone: '+34 600 555 666',
    department: 'Ventas',
    stats: { revenue: 38000, orders: 142, conversion: 6.9, ticket: 268, goal: 62 },
  },
  {
    id: 4,
    name: 'María López',
    email: 'maria@demo.com',
    password: '123456',
    role: 'seller',
    initials: 'ML',
    phone: '+34 600 777 888',
    department: 'Ventas Norte',
    stats: { revenue: 64000, orders: 219, conversion: 9.1, ticket: 292, goal: 94 },
  },
]

const DEFAULT_PERMS = { reports: true, analytics: false }

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_user')) } catch { return null }
  })

  const [extraSellers, setExtraSellers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('extra_sellers')) || [] } catch { return [] }
  })

  const [sellerPerms, setSellerPerms] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('seller_perms')) || {
        2: { reports: true,  analytics: false },
        3: { reports: false, analytics: false },
        4: { reports: true,  analytics: true  },
      }
    } catch { return {} }
  })

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user))
    else localStorage.removeItem('auth_user')
  }, [user])

  useEffect(() => {
    localStorage.setItem('seller_perms', JSON.stringify(sellerPerms))
  }, [sellerPerms])

  useEffect(() => {
    localStorage.setItem('extra_sellers', JSON.stringify(extraSellers))
  }, [extraSellers])

  const allUsers = [...BASE_USERS, ...extraSellers]

  const login = (email, password) => {
    const found = allUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) return { error: 'Email o contraseña incorrectos' }
    const { password: _, ...safe } = found
    setUser(safe)
    return { success: true }
  }

  const logout = () => setUser(null)

  const register = ({ name, email, password, department, phone }) => {
    if (!name.trim() || !email.trim() || !password)
      return { error: 'Completa todos los campos requeridos' }
    if (password.length < 6)
      return { error: 'La contraseña debe tener al menos 6 caracteres' }
    const exists = [...BASE_USERS, ...extraSellers].find(
      u => u.email.toLowerCase() === email.toLowerCase()
    )
    if (exists) return { error: 'Este email ya está registrado' }

    const newId = Date.now()
    const initials = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const newSeller = {
      id: newId,
      name: name.trim(),
      email: email.trim(),
      password,
      role: 'seller',
      initials,
      department: department?.trim() || 'Ventas',
      phone: phone?.trim() || '',
      stats: { revenue: 0, orders: 0, conversion: 0, ticket: 0, goal: 0 },
    }
    setExtraSellers(prev => [...prev, newSeller])
    setSellerPerms(prev => ({ ...prev, [newId]: { ...DEFAULT_PERMS } }))

    // Auto-login
    const { password: _, ...safe } = newSeller
    setUser(safe)
    return { success: true }
  }

  const sellers = allUsers
    .filter(u => u.role === 'seller')
    .map(({ password: _, ...u }) => u)

  const addSeller = (sellerData) => {
    const newId = Date.now()
    const newSeller = {
      id: newId,
      role: 'seller',
      initials: sellerData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      stats: { revenue: 0, orders: 0, conversion: 0, ticket: 0, goal: 0 },
      ...sellerData,
    }
    setExtraSellers(prev => [...prev, newSeller])
    setSellerPerms(prev => ({ ...prev, [newId]: { ...DEFAULT_PERMS } }))
    return newSeller
  }

  const removeSeller = (id) => {
    setExtraSellers(prev => prev.filter(s => s.id !== id))
    setSellerPerms(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const updatePerm = (userId, module, value) => {
    setSellerPerms(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || DEFAULT_PERMS), [module]: value },
    }))
  }

  const getPerms = (userId) => sellerPerms[userId] || DEFAULT_PERMS

  return (
    <AuthContext.Provider value={{
      user, login, logout, register,
      sellers, addSeller, removeSeller,
      sellerPerms, updatePerm, getPerms,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
