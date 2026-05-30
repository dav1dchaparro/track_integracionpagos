import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Github } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Google "G" icon (multi-color) ──────────────────────────────────────────
function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  )
}

const inputClass =
  "w-full px-4 py-3 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none transition-all"
const inputStyle = { background: '#262626', border: '1px solid #3a3a3a' }
const focusHandlers = {
  onFocus: e => { e.target.style.borderColor = '#2d7a5f' },
  onBlur:  e => { e.target.style.borderColor = '#3a3a3a' },
}

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const { register } = useAuth()
  const navigate     = useNavigate()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')

    setLoading(true)
    const result = await register({
      storeName: `${form.firstName} ${form.lastName}`.trim() || form.email,
      email: form.email,
      password: form.password,
    })
    setLoading(false)

    if (result.success) navigate('/', { replace: true })
    else setError(result.error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8" style={{ background: '#0d0d0d' }}>
      <div
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden"
        style={{ minHeight: '640px', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
      >
        {/* ── Left: empty green gradient panel ── */}
        <div
          className="hidden md:block relative"
          style={{ background: 'linear-gradient(135deg, #1a5a4a 0%, #2d7a5f 100%)' }}
        >
          {/* subtle depth glow */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 60%)' }}
          />
        </div>

        {/* ── Right: sign-up form ── */}
        <div className="flex flex-col justify-center px-8 sm:px-12 py-12" style={{ background: '#1a1a1a' }}>
          <div className="w-full max-w-sm mx-auto">
            {/* Header */}
            <h1 className="text-2xl font-bold text-white text-center">Sign Up Account</h1>
            <p className="text-sm text-white/50 text-center mt-1.5 mb-7">
              Enter your personal data to create your account
            </p>

            {/* Social auth */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/5"
                style={{ background: '#262626', border: '1px solid #3a3a3a' }}
              >
                <GoogleIcon className="w-4 h-4" />
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/5"
                style={{ background: '#262626', border: '1px solid #3a3a3a' }}
              >
                <Github className="w-4 h-4" />
                Github
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30">Or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">First Name</label>
                  <input
                    type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)}
                    placeholder="eg. John" required className={inputClass} style={inputStyle} {...focusHandlers}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Last Name</label>
                  <input
                    type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)}
                    placeholder="eg. Francisco" required className={inputClass} style={inputStyle} {...focusHandlers}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
                <input
                  type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="eg. johnfrans@gmail.com" required className={inputClass} style={inputStyle} {...focusHandlers}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)} placeholder="Enter your password" required
                    className={`${inputClass} pr-11`} style={inputStyle} {...focusHandlers}
                  />
                  <button
                    type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-2">Must be at least 8 characters.</p>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2.5 mt-2 bg-white text-black hover:bg-white/90"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-sm text-white/40 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-white hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
