import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Mail, Lock, User, Building2, Phone,
  AlertCircle, CheckCircle, ArrowLeft,
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
  if (pwd.length >= 10 && extras >= 2) return { level: 4, label: 'Muy fuerte', color: '#00d2b4', bars: 4 }
  if (pwd.length >= 8  && extras >= 1) return { level: 3, label: 'Fuerte',     color: '#00d2b4', bars: 3 }
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
            style={{ backgroundColor: i <= s.bars ? s.color : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <p className="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</p>
    </div>
  )
}

function Req({ ok, label }) {
  return (
    <li className={`flex items-center gap-1.5 text-[11px] transition-colors ${ok ? 'text-emerald-400' : 'text-white/25'}`}>
      <CheckCircle className={`w-3 h-3 flex-shrink-0 ${ok ? 'text-emerald-400' : 'text-white/15'}`} />
      {label}
    </li>
  )
}

const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-all"
const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
const focusHandlers = {
  onFocus: e => { e.target.style.borderColor = 'rgba(0,210,180,0.4)'; e.target.style.background = 'rgba(0,210,180,0.05)' },
  onBlur: e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)' },
}

function Field({ label, icon: Icon, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/60 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
        {children}
      </div>
    </div>
  )
}

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
    if (!pwdOk6)   return setError('La contraseña debe tener al menos 6 caracteres')
    if (!pwdMatch) return setError('Las contraseñas no coinciden')

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-10 px-4">
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-[#050a0e]">
        <div
          className="absolute w-[700px] h-[700px] rounded-full"
          style={{
            top: '-10%', right: '-10%',
            background: 'radial-gradient(circle, rgba(0,210,180,0.35) 0%, rgba(0,180,160,0.15) 40%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'blobDrift 12s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            bottom: '-15%', left: '-5%',
            background: 'radial-gradient(circle, rgba(0,220,190,0.3) 0%, rgba(0,160,140,0.1) 40%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'blobDrift 15s ease-in-out infinite alternate-reverse',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-[#00d2b4]/60 hover:text-[#00d2b4] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio de sesión
        </Link>

        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, rgba(0,210,180,0.08), rgba(0,160,140,0.04))' }}>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,80,0.6))' }}
              >
                <img src="/logo.png" alt="Atlas Nexus" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <p className="font-bold text-white text-sm tracking-wide leading-none">ATLAS NEXUS</p>
                <p className="text-[10px] mt-0.5 text-[#00d2b4]/50">Registro de nueva cuenta</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Registra tu negocio</h1>
            <p className="text-sm text-white/40">
              Crea tu cuenta y conecta tu comercio a <strong className="text-[#00d2b4]">Atlas Nexus</strong> para empezar a crecer con datos inteligentes.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <Field label="Nombre del negocio" icon={Building2} required>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Ej: Café Don Pedro" required className={inputClass} style={inputStyle} {...focusHandlers} />
            </Field>

            <Field label="Email" icon={Mail} required>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="tu@empresa.com" required className={inputClass} style={inputStyle} {...focusHandlers} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Departamento" icon={Building2}>
                <input type="text" value={form.department} onChange={e => set('department', e.target.value)}
                  placeholder="Ventas" className={inputClass} style={inputStyle} {...focusHandlers} />
              </Field>
              <Field label="Teléfono" icon={Phone}>
                <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+34 600..." className={inputClass} style={inputStyle} {...focusHandlers} />
              </Field>
            </div>

            <Field label="Contraseña" icon={Lock} required>
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" required
                className={`${inputClass} pr-12`} style={inputStyle} {...focusHandlers} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {form.password && <StrengthBar password={form.password} />}
            </Field>

            <Field label="Confirmar contraseña" icon={Lock} required>
              <input type={showConfirm ? 'text' : 'password'} value={form.confirm}
                onChange={e => set('confirm', e.target.value)} placeholder="Repite tu contraseña" required
                className={`${inputClass} pr-12`}
                style={{
                  ...inputStyle,
                  ...(form.confirm && !pwdMatch
                    ? { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }
                    : form.confirm && pwdMatch
                    ? { borderColor: 'rgba(0,210,180,0.3)', background: 'rgba(0,210,180,0.05)' }
                    : {}),
                }}
                {...focusHandlers}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </Field>

            <ul className="space-y-1.5 px-1">
              <Req ok={pwdOk6}  label="Mínimo 6 caracteres" />
              <Req ok={pwdMatch && !!form.confirm} label="Las contraseñas coinciden" />
            </ul>

            {error && (
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2.5 mt-2 hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #00d2b4, #00a896)', boxShadow: '0 4px 20px rgba(0,210,180,0.3)' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </>
              ) : 'Crear mi cuenta →'}
            </button>

            <p className="text-center text-xs text-white/30 pt-1">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-[#00d2b4] hover:underline">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes blobDrift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-30px, 20px) scale(1.08); }
          100% { transform: translate(15px, -15px) scale(0.95); }
        }
      `}</style>
    </div>
  )
}
