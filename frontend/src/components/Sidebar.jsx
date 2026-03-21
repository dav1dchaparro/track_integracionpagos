import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, FileText, Settings, Users,
  TrendingUp, X, Search, ChevronRight, Crown, LogOut, ShoppingCart, Sparkles, Megaphone,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const OWNER_NAV = [
  { to: '/',                   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics',          icon: BarChart3,       label: 'Analytics',         badge: 'IA'  },
  { to: '/insights',           icon: Sparkles,        label: 'Insights',          badge: 'new' },
  { to: '/marketing',          icon: Megaphone,       label: 'Marketing',         badge: 'IA'  },
  { to: '/purchase-patterns',  icon: ShoppingCart,    label: 'Pat. de Compra' },
  { to: '/reports',            icon: FileText,        label: 'Reportes',          badge: '3'   },
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
  IA:  'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  new: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  '3': 'bg-neon/10 text-neon border border-neon/20',
}

export default function Sidebar({ open, onClose }) {
  const [search, setSearch] = useState('')
  const { user, getPerms, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm lg:hidden animate-fade-in"
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
        style={{
          background: 'var(--scifi-sidebar)',
          borderRight: '1px solid var(--scifi-border)',
        }}
      >
        {/* ── Logo ── */}
        <div
          className="flex items-center justify-between h-16 px-5"
          style={{ borderBottom: '1px solid var(--scifi-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(0,230,118,0.12)',
                border: '1px solid rgba(0,230,118,0.3)',
                boxShadow: '0 0 12px rgba(0,230,118,0.2)',
              }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: '#00e676' }} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-sm leading-none tracking-tight" style={{ color: 'var(--scifi-text)' }}>
                Analytics Pro
              </p>
              <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--scifi-text-muted)' }}>
                {user?.role === 'owner' ? '[ OWNER ACCESS ]' : '[ SELLER ]'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--scifi-text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Role badge ── */}
        {user && (
          <div className="px-4 pt-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: user.role === 'owner' ? 'rgba(245,158,11,0.08)' : 'rgba(0,230,118,0.06)',
                border: `1px solid ${user.role === 'owner' ? 'rgba(245,158,11,0.2)' : 'rgba(0,230,118,0.15)'}`,
              }}
            >
              {user.role === 'owner'
                ? <Crown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                : <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00e676' }} />
              }
              <p className="text-xs font-semibold" style={{ color: user.role === 'owner' ? '#fbbf24' : '#00e676' }}>
                {user.role === 'owner' ? 'Dueño — Acceso total' : 'Vendedor'}
              </p>
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <div className="px-4 py-3">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
            style={{
              background: 'rgba(0,230,118,0.04)',
              border: '1px solid var(--scifi-border)',
            }}
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00e676' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="bg-transparent text-sm w-full outline-none"
              style={{ color: 'var(--scifi-text)', caretColor: '#00e676' }}
            />
            <kbd
              className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ color: 'var(--scifi-text-muted)', background: 'rgba(0,230,118,0.06)', border: '1px solid var(--scifi-border)' }}
            >
              ⌘K
            </kbd>
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
                  isActive ? 'font-semibold' : 'font-medium'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      color: '#00e676',
                      background: 'rgba(0,230,118,0.08)',
                      boxShadow: 'inset 2px 0 0 #00e676',
                    }
                  : { color: 'var(--scifi-text-muted)' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="w-4 h-4 flex-shrink-0 transition-colors duration-150"
                    style={{ color: isActive ? '#00e676' : 'var(--scifi-text-muted)' }}
                  />
                  <span className="flex-1" style={{ color: isActive ? '#00e676' : 'var(--scifi-text-dim)' }}>
                    {label}
                  </span>
                  {badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? '' : (BADGE_COLORS[badge] || 'bg-neon/10 text-neon')
                    }`}
                    style={isActive ? { background: 'rgba(0,230,118,0.15)', color: '#00e676' } : {}}
                    >
                      {badge}
                    </span>
                  )}
                  {!isActive && (
                    <ChevronRight
                      className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-150"
                      style={{ color: '#00e676' }}
                    />
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
              style={{ background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.12)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse-neon" style={{ background: '#00e676', boxShadow: '0 0 6px #00e676' }} />
                <p className="text-[11px] font-semibold" style={{ color: 'var(--scifi-text-dim)' }}>Plan Profesional</p>
              </div>
              <p className="text-[11px] mb-3 leading-relaxed" style={{ color: 'var(--scifi-text-muted)' }}>
                Activa reportes ilimitados y modelos predictivos avanzados.
              </p>
              <button
                className="w-full text-[11px] font-semibold py-1.5 rounded-md transition-all hover:opacity-80 active:scale-[0.98]"
                style={{ color: '#00e676', border: '1px solid rgba(0,230,118,0.25)', background: 'rgba(0,230,118,0.06)' }}
              >
                Ver planes
              </button>
            </div>
          </div>
        )}

        {/* ── User footer ── */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--scifi-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{
                background: 'rgba(0,230,118,0.1)',
                border: '1px solid rgba(0,230,118,0.25)',
                color: '#00e676',
              }}
            >
              {user?.initials || user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--scifi-text)' }}>
                {user?.name || 'Usuario'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--scifi-text-muted)' }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'var(--scifi-text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--scifi-text-muted)'}
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
