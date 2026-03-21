import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Sun, Moon, User, LogOut, Settings, Plus, X, Check, Crown, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const typeStyles = {
  success: '#00e676',
  warning: '#fbbf24',
  info:    '#38bdf8',
}

const OWNER_NOTIFS = [
  { id: 1, type: 'success', title: 'Meta de revenue alcanzada', desc: 'Superaste el objetivo mensual en un 12%', time: '5 min', unread: true },
  { id: 2, type: 'warning', title: '650 clientes en riesgo de churn', desc: 'Acción recomendada: campaña win-back', time: '1 hora', unread: true },
  { id: 3, type: 'info',    title: 'Reporte mensual disponible', desc: 'Dashboard Analytics — Marzo 2026', time: '3 horas', unread: false },
]

const SELLER_NOTIFS = [
  { id: 1, type: 'success', title: 'Nueva orden asignada', desc: 'TechCorp SL — $1,250', time: '10 min', unread: true },
  { id: 2, type: 'info',    title: 'Meta actualizada', desc: 'Tu objetivo para Abril: $70K', time: '2 horas', unread: false },
]

export default function Header({ darkMode, onToggleDark, onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [showNotifs, setShowNotifs]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showWidget, setShowWidget]   = useState(false)
  const [searchFocus, setSearchFocus] = useState(false)

  const baseNotifs = user?.role === 'owner' ? OWNER_NOTIFS : SELLER_NOTIFS
  const [notifs, setNotifs] = useState(baseNotifs)

  const notifsRef  = useRef()
  const profileRef = useRef()

  useEffect(() => {
    const h = (e) => {
      if (notifsRef.current  && !notifsRef.current.contains(e.target))  setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const unreadCount = notifs.filter(n => n.unread).length
  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, unread: false })))

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.initials || user?.name?.[0] || 'U'
  const roleBadge = user?.role === 'owner'
    ? { label: 'Dueño', color: '#fbbf24' }
    : { label: 'Vendedor', color: '#00e676' }

  return (
    <>
      <header
        className="h-16 flex items-center gap-3 px-5 flex-shrink-0 z-10"
        style={{
          background: 'var(--scifi-sidebar)',
          borderBottom: '1px solid var(--scifi-border)',
        }}
      >
        {/* Hamburger */}
        <button onClick={onToggleSidebar} className="btn-ghost p-2 rounded-xl">
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg transition-all duration-150"
            style={{
              background: 'rgba(0,230,118,0.04)',
              border: `1px solid ${searchFocus ? 'rgba(0,230,118,0.5)' : 'var(--scifi-border)'}`,
              boxShadow: searchFocus ? '0 0 12px rgba(0,230,118,0.1)' : 'none',
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: searchFocus ? '#00e676' : 'var(--scifi-text-muted)' }} />
            <input
              type="text"
              placeholder={user?.role === 'owner' ? 'Buscar métricas, reportes...' : 'Buscar órdenes...'}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: 'var(--scifi-text)', caretColor: '#00e676' }}
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 ml-auto">

          {/* Add Widget — owner only */}
          {user?.role === 'owner' && (
            <button onClick={() => setShowWidget(true)} className="btn-secondary hidden sm:flex">
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Widget</span>
            </button>
          )}

          {/* Dark mode toggle */}
          <button onClick={onToggleDark} className="btn-ghost p-2 rounded-xl" title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
            {darkMode
              ? <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} />
              : <Moon className="w-4 h-4" />
            }
          </button>

          {/* Notifications */}
          <div ref={notifsRef} className="relative">
            <button
              onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false) }}
              className="relative btn-ghost p-2 rounded-xl"
              style={showNotifs ? { background: 'rgba(0,230,118,0.08)', color: '#00e676' } : {}}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: '#f87171', boxShadow: '0 0 6px rgba(248,113,113,0.6)' }}
                />
              )}
            </button>

            {showNotifs && (
              <div
                className="absolute right-0 top-12 w-80 z-50 overflow-hidden animate-scale-in rounded-xl"
                style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--scifi-border)' }}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--scifi-text)' }}>Notificaciones</h3>
                    {unreadCount > 0 && <span className="badge-green">{unreadCount} nuevas</span>}
                  </div>
                  <button onClick={markAllRead} className="text-xs font-semibold hover:underline" style={{ color: '#00e676' }}>
                    Marcar leídas
                  </button>
                </div>
                <div>
                  {notifs.map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-3 px-4 py-3.5 transition-colors"
                      style={{
                        borderBottom: '1px solid var(--scifi-border)',
                        opacity: n.unread ? 1 : 0.5,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,230,118,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: typeStyles[n.type], boxShadow: `0 0 6px ${typeStyles[n.type]}` }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--scifi-text)' }}>{n.title}</p>
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--scifi-text-muted)' }}>{n.desc}</p>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--scifi-text-muted)' }}>Hace {n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 text-center">
                  <button className="text-xs font-semibold hover:underline" style={{ color: '#00e676' }}>
                    Ver todas →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all duration-200"
              style={{
                border: showProfile ? '1px solid rgba(0,230,118,0.4)' : '1px solid transparent',
                background: showProfile ? 'rgba(0,230,118,0.06)' : 'transparent',
              }}
              onMouseEnter={e => { if (!showProfile) e.currentTarget.style.border = '1px solid var(--scifi-border)' }}
              onMouseLeave={e => { if (!showProfile) e.currentTarget.style.border = '1px solid transparent' }}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#00e676' }}
              >
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-none" style={{ color: 'var(--scifi-text)' }}>
                  {user?.name?.split(' ')[0] || 'Usuario'}
                </p>
                <p className="text-[10px] mt-0.5 font-semibold" style={{ color: roleBadge.color }}>
                  {roleBadge.label}
                </p>
              </div>
            </button>

            {showProfile && (
              <div
                className="absolute right-0 top-12 w-56 z-50 overflow-hidden animate-scale-in rounded-xl"
                style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--scifi-border)' }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm" style={{ color: 'var(--scifi-text)' }}>{user?.name}</p>
                    {user?.role === 'owner'
                      ? <Crown className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                      : <Shield className="w-3.5 h-3.5" style={{ color: '#00e676' }} />
                    }
                  </div>
                  <p className="text-xs" style={{ color: 'var(--scifi-text-muted)' }}>{user?.email}</p>
                </div>
                <div className="p-1.5">
                  {[
                    { icon: User,     label: 'Mi perfil',       to: '/settings' },
                    { icon: Settings, label: 'Configuración',   to: '/settings' },
                  ].map(({ icon: Icon, label, to }) => (
                    <button key={label} onClick={() => { navigate(to); setShowProfile(false) }}
                      className="dropdown-item rounded-lg w-full gap-2.5">
                      <Icon className="w-4 h-4" style={{ color: 'var(--scifi-text-muted)' }} />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="p-1.5" style={{ borderTop: '1px solid var(--scifi-border)' }}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm text-left rounded-lg gap-2.5 transition-colors"
                    style={{ color: '#f87171' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Add Widget Modal (owner only) ── */}
      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowWidget(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative rounded-2xl w-full max-w-lg animate-scale-in overflow-hidden"
            style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)', boxShadow: '0 0 40px rgba(0,230,118,0.1), 0 20px 60px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--scifi-border)' }}>
              <div>
                <h2 className="font-bold" style={{ color: 'var(--scifi-text)' }}>Añadir Widget</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--scifi-text-muted)' }}>Personaliza tu dashboard</p>
              </div>
              <button onClick={() => setShowWidget(false)} className="btn-ghost p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {[
                { label: 'Gráfico de barras',    icon: '📊', desc: 'Compara métricas' },
                { label: 'KPI Rápido',           icon: '⚡', desc: 'Métrica clave' },
                { label: 'Tabla de datos',       icon: '📋', desc: 'Vista tabular' },
                { label: 'Mapa geográfico',      icon: '🗺️', desc: 'Distribución global' },
                { label: 'Gauge / Velocímetro',  icon: '🎯', desc: 'Progreso hacia meta' },
                { label: 'Feed de alertas',      icon: '🔔', desc: 'Notificaciones live' },
              ].map((w) => (
                <button
                  key={w.label}
                  onClick={() => setShowWidget(false)}
                  className="flex items-start gap-3 p-4 rounded-xl text-left group transition-all duration-200"
                  style={{ border: '1px solid var(--scifi-border)', background: 'var(--scifi-surface)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = '1px solid rgba(0,230,118,0.4)'
                    e.currentTarget.style.background = 'rgba(0,230,118,0.06)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = '1px solid var(--scifi-border)'
                    e.currentTarget.style.background = 'var(--scifi-surface)'
                  }}
                >
                  <span className="text-2xl">{w.icon}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--scifi-text)' }}>{w.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--scifi-text-muted)' }}>{w.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setShowWidget(false)} className="btn-primary w-full justify-center">
                <Check className="w-4 h-4" />
                Agregar al dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
