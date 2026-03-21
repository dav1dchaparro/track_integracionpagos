import { useState, useRef, useEffect } from 'react'
import { Menu, Search, Bell, Sun, Moon, User, LogOut, Settings, Plus, X, Check } from 'lucide-react'

const NOTIFICATIONS = [
  { id: 1, type: 'success', title: 'Meta de revenue alcanzada', desc: 'Superaste el objetivo mensual en un 12%', time: '5 min', unread: true },
  { id: 2, type: 'warning', title: '650 clientes en riesgo de churn', desc: 'Acción recomendada: campaña win-back', time: '1 hora', unread: true },
  { id: 3, type: 'info',    title: 'Reporte mensual disponible', desc: 'Dashboard Analytics — Marzo 2026', time: '3 horas', unread: false },
]

const typeStyles = {
  success: 'bg-brand-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
}

export default function Header({ darkMode, onToggleDark, onToggleSidebar }) {
  const [showNotifs, setShowNotifs]     = useState(false)
  const [showProfile, setShowProfile]   = useState(false)
  const [showWidget, setShowWidget]     = useState(false)
  const [notifs, setNotifs]             = useState(NOTIFICATIONS)
  const [searchFocus, setSearchFocus]   = useState(false)

  const notifsRef  = useRef()
  const profileRef = useRef()

  // Close panels on outside click
  useEffect(() => {
    const h = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target))   setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const unreadCount = notifs.filter(n => n.unread).length
  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, unread: false })))

  return (
    <>
      <header className="h-16 flex items-center gap-3 px-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 z-10">

        {/* Hamburger */}
        <button onClick={onToggleSidebar} className="btn-ghost p-2 rounded-xl">
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-200 ${
            searchFocus
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/20 dark:border-brand-700 shadow-green-sm'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
          }`}>
            <Search className={`w-4 h-4 flex-shrink-0 transition-colors ${searchFocus ? 'text-brand-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Buscar métricas, reportes..."
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              className="bg-transparent text-sm outline-none w-full text-gray-700 dark:text-gray-200 placeholder-gray-400"
            />
            <kbd className="text-[10px] text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded flex-shrink-0">
              ⌘F
            </kbd>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 ml-auto">

          {/* Add Widget button */}
          <button
            onClick={() => setShowWidget(true)}
            className="btn-primary hidden sm:flex"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Añadir Widget</span>
          </button>

          {/* Dark mode */}
          <button
            onClick={onToggleDark}
            className="btn-ghost p-2 rounded-xl"
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode
              ? <Sun className="w-4.5 h-4.5" />
              : <Moon className="w-4.5 h-4.5" />
            }
          </button>

          {/* Notifications */}
          <div ref={notifsRef} className="relative">
            <button
              onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false) }}
              className={`relative btn-ghost p-2 rounded-xl ${showNotifs ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-12 w-80 card shadow-xl z-50 overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <span className="badge-green">{unreadCount} nuevas</span>
                    )}
                  </div>
                  <button onClick={markAllRead} className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                    Marcar leídas
                  </button>
                </div>

                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {notifs.map((n) => (
                    <div key={n.id} className={`flex gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${n.unread ? '' : 'opacity-60'}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeStyles[n.type]}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{n.desc}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Hace {n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-center">
                  <button className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    Ver todas las notificaciones →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
              className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all duration-200 ${
                showProfile
                  ? 'border-brand-300 bg-brand-50 dark:bg-brand-950/20 dark:border-brand-700'
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                A
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">Admin</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Pro</p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-52 card shadow-xl z-50 overflow-hidden animate-scale-in">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="font-bold text-sm">Admin User</p>
                  <p className="text-xs text-gray-400">admin@analytics.com</p>
                </div>
                <div className="p-1.5">
                  {[
                    { icon: User,     label: 'Mi perfil' },
                    { icon: Settings, label: 'Configuración' },
                  ].map(({ icon: Icon, label }) => (
                    <button key={label} className="dropdown-item rounded-lg w-full gap-2.5">
                      <Icon className="w-4 h-4 text-gray-400" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="p-1.5 border-t border-gray-100 dark:border-gray-800">
                  <button className="dropdown-item rounded-lg w-full gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Add Widget Modal ── */}
      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowWidget(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Añadir Widget</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Personaliza tu dashboard</p>
              </div>
              <button onClick={() => setShowWidget(false)} className="btn-ghost p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Widget options */}
            <div className="p-6 grid grid-cols-2 gap-3">
              {[
                { label: 'Gráfico de barras', icon: '📊', desc: 'Compara métricas' },
                { label: 'KPI Rápido',        icon: '⚡', desc: 'Métrica clave' },
                { label: 'Tabla de datos',    icon: '📋', desc: 'Vista tabular' },
                { label: 'Mapa geográfico',   icon: '🗺️', desc: 'Distribución global' },
                { label: 'Gauge / Velocímetro', icon: '🎯', desc: 'Progreso hacia meta' },
                { label: 'Feed de alertas',   icon: '🔔', desc: 'Notificaciones live' },
              ].map((w) => (
                <button
                  key={w.label}
                  onClick={() => setShowWidget(false)}
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 dark:hover:border-brand-600 transition-all duration-200 text-left group"
                >
                  <span className="text-2xl">{w.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                      {w.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{w.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setShowWidget(false)}
                className="btn-primary w-full justify-center"
              >
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
