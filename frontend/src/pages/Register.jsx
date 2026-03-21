import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp, Eye, EyeOff, Mail, Lock, User, Building2, Phone,
  AlertCircle, CheckCircle, ArrowLeft, Shield,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Password strength ────────────────────────────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return null
  if (pwd.length < 6) return { level: 1, label: 'Muy débil',  color: '#ef4444', bars: 1 }
  const hasUpper   = /[A-Z]/.test(pwd)
  const hasNum     = /[0-9]/.test(pwd)
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
  const extras = [hasUpper, hasNum, hasSpecial].filter(Boolean).length
  if (pwd.length >= 10 && extras >= 2) return { level: 4, label: 'Muy fuerte', color: '#16a34a', bars: 4 }
  if (pwd.length >= 8  && extras >= 1) return { level: 3, label: 'Fuerte',     color: '#22c55e', bars: 3 }
  if (pwd.length >= 6  && extras >= 1) return { level: 2, label: 'Regular',    color: '#f59e0b', bars: 2 }
  return { level: 1, label: 'Débil', color: '#f97316', bars: 1 }
}

function StrengthBar({ password }) {
  const s = getStrength(password)
  if (!s) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= s.bars ? s.color : '#e5e7eb' }}
          />
        ))}
      </div>
      <p className="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</p>
    </div>
  )
}

// ─── Requirement chip ─────────────────────────────────────────────────────────
function Req({ ok, label }) {
  return (
    <li className={`flex items-center gap-1.5 text-[11px] transition-colors ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      <CheckCircle className={`w-3 h-3 flex-shrink-0 ${ok ? 'text-green-500' : 'text-gray-300'}`} />
      {label}
    </li>
  )
}

// ─── Input field ──────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        {children}
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', department: '', phone: '',
  })
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const { register } = useAuth()
  const navigate     = useNavigate()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const pwdMatch = form.password && form.confirm && form.password === form.confirm
  const pwdOk6   = form.password.length >= 6

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pwdOk6)        return setError('La contraseña debe tener al menos 6 caracteres')
    if (!pwdMatch)      return setError('Las contraseñas no coinciden')

    setLoading(true)
    const result = await register({
      storeName: form.name,
      email: form.email,
      password: form.password,
    })
    setLoading(false)

    if (result.success) navigate('/', { replace: true })
    else setError(result.error)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 px-4"
      style={{ background: 'linear-gradient(135deg, #0a1a0f 0%, #0d1f13 40%, #0f172a 100%)' }}
    >
      {/* Decorative orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #16a34a, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to login */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-green-400/70 hover:text-green-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio de sesión
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #0d1f13, #14532d)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-none">Analytics Pro</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(74,222,128,0.6)' }}>Registro de nueva cuenta</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Crear cuenta</h1>
            <p className="text-sm" style={{ color: 'rgba(74,222,128,0.6)' }}>
              Te registrarás como <strong className="text-green-300">Vendedor</strong>. El dueño podrá gestionar tus permisos.
            </p>
          </div>

          {/* Role notice */}
          <div className="mx-8 mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-snug">
              Las cuentas de <strong>Dueño</strong> son configuradas directamente por el administrador del sistema.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">

            <Field label="Nombre completo" icon={User} required hint="">
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ej: Laura Sánchez"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
              />
            </Field>

            <Field label="Email" icon={Mail} required>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="tu@empresa.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Departamento" icon={Building2}>
                <input
                  type="text"
                  value={form.department}
                  onChange={e => set('department', e.target.value)}
                  placeholder="Ventas"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
                />
              </Field>
              <Field label="Teléfono" icon={Phone}>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+34 600..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
                />
              </Field>
            </div>

            <Field label="Contraseña" icon={Lock} required>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {form.password && <StrengthBar password={form.password} />}
            </Field>

            <Field label="Confirmar contraseña" icon={Lock} required>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                placeholder="Repite tu contraseña"
                required
                className={`w-full pl-10 pr-12 py-3 rounded-xl border text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all ${
                  form.confirm && !pwdMatch
                    ? 'border-red-300 bg-red-50'
                    : form.confirm && pwdMatch
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            {/* Requirements checklist */}
            <ul className="space-y-1.5 px-1">
              <Req ok={pwdOk6}  label="Mínimo 6 caracteres" />
              <Req ok={pwdMatch && !!form.confirm} label="Las contraseñas coinciden" />
            </ul>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
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
                  Creando cuenta...
                </>
              ) : 'Crear mi cuenta →'}
            </button>

            <p className="text-center text-xs text-gray-400 pt-1">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-green-600 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
