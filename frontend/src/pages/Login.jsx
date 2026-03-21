import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff, Mail, Lock, AlertCircle, Crown, ShoppingBag, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const DEMOS = [
  {
    label: 'Dueño',
    sub: 'Acceso total',
    email: 'dueno@demo.com',
    icon: Crown,
    from: '#f59e0b',
    to: '#d97706',
  },
  {
    label: 'Vendedor #1',
    sub: 'Ana García',
    email: 'ana@demo.com',
    icon: ShoppingBag,
    from: '#3b82f6',
    to: '#2563eb',
  },
  {
    label: 'Vendedor #2',
    sub: 'María López',
    email: 'maria@demo.com',
    icon: Zap,
    from: '#8b5cf6',
    to: '#7c3aed',
  },
]

const FEATURES = [
  'Dashboard modular con 6 secciones',
  'KPIs en tiempo real con tendencias',
  'Analytics predictiva con IA',
  'Control de acceso por rol',
]

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const result = login(email, password)
    setLoading(false)
    if (result.success) navigate('/')
    else setError(result.error)
  }

  const quickFill = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('123456')
    setError('')
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #0a1a0f 0%, #0d1f13 40%, #0f172a 100%)' }}
    >
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Dot grid texture */}
        <div className="absolute inset-0 bg-dot-pattern opacity-100 pointer-events-none" />
        {/* Fade vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 50%, transparent 30%, rgba(10,26,15,0.7) 100%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <TrendingUp className="w-4 h-4 text-green-400" strokeWidth={2} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none tracking-tight">Analytics Pro</p>
            <p className="text-[11px] mt-0.5 text-gray-500">Dashboard Empresarial</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Toma decisiones<br />
            <span style={{ color: '#4ade80' }}>más inteligentes</span>
          </h2>
          <p className="text-gray-400 text-base mb-8 leading-relaxed">
            Visualiza tus métricas clave, controla tu equipo de ventas<br />y anticipa el futuro de tu negocio.
          </p>

          <ul className="space-y-2.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-gray-400 text-sm">
                <span className="w-4 h-4 flex-shrink-0 text-green-500">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2.5 8.5 6 12 13.5 4.5" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom testimonial */}
        <div className="relative">
          <div className="w-8 h-px bg-green-500/40 mb-4" />
          <p className="text-gray-300 text-[15px] leading-relaxed mb-4" style={{ fontStyle: 'normal', letterSpacing: '-0.01em' }}>
            "Desde que usamos Analytics Pro, nuestras ventas crecieron un 34% en el primer trimestre."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-[11px] font-bold text-white border border-gray-600">
              JM
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Jorge Martínez</p>
              <p className="text-[11px] text-gray-500">CEO, TechVentures SL</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              <TrendingUp className="w-4 h-4 text-green-400" strokeWidth={2} />
            </div>
            <p className="font-bold text-white text-sm tracking-tight">Analytics Pro</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            {/* Green accent top line */}
            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80 60%, transparent)' }} />
            {/* Card header */}
            <div className="px-8 pt-7 pb-5">
              <h1 className="text-[22px] font-bold text-gray-900 mb-1">Bienvenido de vuelta</h1>
              <p className="text-sm text-gray-500">Ingresa tus credenciales para acceder</p>
            </div>

            <div className="px-8 pb-8">
              {/* Demo shortcuts */}
              <div className="mb-6">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                  Acceso rápido — demo
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMOS.map(d => (
                    <button
                      key={d.email}
                      onClick={() => quickFill(d.email)}
                      className={`flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border-2 transition-all duration-200 ${
                        email === d.email
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-gray-100 hover:border-green-200 hover:bg-green-50/40 bg-gray-50'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${d.from}, ${d.to})` }}
                      >
                        <d.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-700 leading-tight">{d.label}</p>
                        <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{d.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">o ingresa tu email</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="tu@empresa.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2.5 mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    boxShadow: '0 4px 15px rgba(22,163,74,0.35)',
                  }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verificando...
                    </>
                  ) : 'Ingresar al Dashboard →'}
                </button>
              </form>

              <p className="text-center text-[11px] text-gray-400 mt-5">
                Contraseña para todos los demos:{' '}
                <span className="font-mono font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">123456</span>
              </p>

              <div className="flex items-center gap-3 mt-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">¿nuevo en la plataforma?</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <Link
                to="/register"
                className="mt-3 w-full py-3 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 font-semibold text-sm text-gray-600 hover:text-green-700 transition-all duration-200 flex items-center justify-center"
              >
                Crear una cuenta →
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            Analytics Pro © 2026 · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  )
}
