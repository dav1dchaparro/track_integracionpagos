import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, FileText, Settings, Users,
  TrendingUp, X, Search, ChevronRight, Crown, LogOut, ShoppingCart,
  Tag, Package,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const OWNER_NAV = [
  { to: '/',                   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics',          icon: BarChart3,       label: 'Analytics',         badge: 'IA'  },
  { to: '/purchase-patterns',  icon: ShoppingCart,    label: 'Pat. de Compra',    badge: 'new' },
  { to: '/reports',            icon: FileText,        label: 'Reportes',          badge: '3'   },
  { to: '/categories',          icon: Tag,             label: 'Categorias' },
  { to: '/products',            icon: Package,         label: 'Productos' },
  { to: '/users',              icon: Users,           label: 'Equipo' },
  { to: '/settings',           icon: Settings,        label: 'Ajustes' },
]

const SELLER_BASE_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Mi Dashboard', perm: null },
]

const SELLER_OPTIONAL_NAV = [
  { to: '/reports',   icon: FileText,  label: 'Reportes',       perm: 'reports'   },
  { to: '/analytics', icon: BarChart3, label: 'Analytics',      perm: 'analytics' },
  { to: '/settings',  icon: Settings,  label: 'Configuración',  perm: null        },
]

const BADGE_COLORS = {
  IA:  'bg-purple-600/80 text-white',
  new: 'bg-amber-500/90 text-white',
  '3': 'bg-green-700/60 text-green-200',
}

export default function Sidebar({ open, onClose }) {
  const [search, setSearch] = useState('')
  const { user, getPerms, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Build nav items based on role
  let navItems = []
  if (user?.role === 'owner') {
    navItems = OWNER_NAV
  } else if (user?.role === 'seller') {
    const perms = getPerms ? getPerms(user.id) : {}
    navItems = [
      ...SELLER_BASE_NAV,
      ...SELLER_OPTIONAL_NAV.filter(n => n.perm === null || perms[n.perm]),
    ]
  }

  const filtered = search
    ? navItems.filter(n => n.label.toLowerCase().includes(search.toLowerCase()))
    : navItems

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 flex flex-col flex-shrink-0
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ backgroundColor: '#0d1f13' }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center justify-between h-16 px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <TrendingUp className="w-3.5 h-3.5 text-green-400" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none tracking-tight">Analytics Pro</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(156,163,175,0.6)' }}>
                {user?.role === 'owner' ? 'Panel Dueño' : 'Panel Vendedor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-green-700 hover:text-white hover:bg-green-900/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Role badge ── */}
        {user && (
          <div className="px-4 pt-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: user.role === 'owner' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.08)', border: `1px solid ${user.role === 'owner' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.15)'}` }}
            >
              {user.role === 'owner'
                ? <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                : <TrendingUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              }
              <p className="text-xs font-semibold" style={{ color: user.role === 'owner' ? '#fbbf24' : '#4ade80' }}>
                {user.role === 'owner' ? 'Dueño — Acceso total' : 'Vendedor'}
              </p>
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <div className="px-4 py-3">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4ade80' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="bg-transparent text-sm text-gray-300 placeholder-gray-600 w-full outline-none"
            />
            <kbd className="text-[10px] text-gray-600 font-mono bg-green-950/60 px-1.5 py-0.5 rounded flex-shrink-0">⌘K</kbd>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {filtered.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-gray-500 hover:text-gray-200 font-medium hover:bg-white/5'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { boxShadow: 'inset 2px 0 0 #4ade80', backgroundColor: 'rgba(34,197,94,0.1)' }
                  : {}
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-green-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-green-400/20 text-green-300' : (BADGE_COLORS[badge] || 'bg-green-900/60 text-green-400')
                    }`}>
                      {badge}
                    </span>
                  )}
                  {!isActive && (
                    <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-150" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Promo card (owner only) ── */}
        {user?.role === 'owner' && (
          <div className="px-3 pb-3">
            <div
              className="rounded-lg p-3.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <p className="text-[11px] font-semibold text-gray-300">Plan Profesional</p>
              </div>
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">Activa reportes ilimitados y modelos predictivos avanzados.</p>
              <button className="w-full text-[11px] font-semibold py-1.5 rounded-md transition-all hover:bg-green-900/40 active:scale-[0.98]"
                style={{ color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                Ver planes
              </button>
            </div>
          </div>
        )}

        {/* ── User footer ── */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white bg-gray-700 border border-gray-600/60 flex-shrink-0">
              {user?.initials || user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Usuario'}</p>
              <p className="text-[11px] truncate" style={{ color: 'rgba(74,222,128,0.5)' }}>{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors flex-shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
