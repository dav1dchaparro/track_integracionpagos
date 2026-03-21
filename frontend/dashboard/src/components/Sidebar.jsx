import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, FileText, Settings,
  TrendingUp, X, Search, ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics',  badge: 'AI' },
  { to: '/reports',   icon: FileText,        label: 'Reports',    badge: '3' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
  const [search, setSearch] = useState('')

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
        <div className="flex items-center justify-between h-16 px-5" style={{ borderBottom: '1px solid rgba(34,197,94,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center shadow-green-sm flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">Analytics</p>
              <p className="text-[10px] text-green-500/70 mt-0.5">Pro Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-green-700 hover:text-white hover:bg-green-900/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(74,222,128,0.4)' }}>
            Navegación
          </p>

          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-200'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: '#16a34a', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }
                  : {}
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-green-900/60 text-green-400'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                  {!isActive && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Promo card ── */}
        <div className="px-3 pb-3">
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #14532d 0%, #052e16 100%)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <div
              className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #22c55e, transparent)', transform: 'translate(30%, -30%)' }}
            />
            <p className="text-xs font-bold text-white mb-1">Upgrade a Pro</p>
            <p className="text-[11px] text-green-400/80 mb-3">Desbloquea reportes avanzados y IA ilimitada</p>
            <button className="w-full text-xs font-bold py-2 rounded-xl text-sidebar transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#22c55e' }}>
              Ver planes →
            </button>
          </div>
        </div>

        {/* ── User ── */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(34,197,94,0.1)' }}>
          <div className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all group"
            style={{ ':hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">Admin User</p>
              <p className="text-[11px] truncate" style={{ color: 'rgba(74,222,128,0.5)' }}>admin@analytics.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
