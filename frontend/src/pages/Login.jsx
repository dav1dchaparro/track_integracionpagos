import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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
    const result = await login(email, password)
    setLoading(false)
    if (result.success) navigate('/')
    else setError(result.error)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* ── Animated gradient background ── */}
      <div className="absolute inset-0 bg-[#050a0e]">
        {/* Teal blob top-right */}
        <div
          className="absolute w-[700px] h-[700px] rounded-full"
          style={{
            top: '-10%',
            right: '-10%',
            background: 'radial-gradient(circle, rgba(0,210,180,0.35) 0%, rgba(0,180,160,0.15) 40%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'blobDrift 12s ease-in-out infinite alternate',
          }}
        />
        {/* Teal blob bottom-left */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            bottom: '-15%',
            left: '-5%',
            background: 'radial-gradient(circle, rgba(0,220,190,0.3) 0%, rgba(0,160,140,0.1) 40%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'blobDrift 15s ease-in-out infinite alternate-reverse',
          }}
        />
        {/* Subtle center glow */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            top: '30%',
            left: '40%',
            background: 'radial-gradient(circle, rgba(0,200,170,0.08) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">

        {/* Brand: ATLAS NEXUS */}
        <div className="mb-12 flex flex-col items-center">
          {/* Penrose impossible triangle — neon logo */}
          <div className="mb-6" style={{ filter: 'drop-shadow(0 0 18px rgba(0,255,80,0.7)) drop-shadow(0 0 50px rgba(0,255,80,0.3)) drop-shadow(0 0 100px rgba(0,255,80,0.1))' }}>
            <svg width="120" height="105" viewBox="0 0 260 225" fill="none">
              <defs>
                <clipPath id="pRing">
                  <path fillRule="evenodd" clipRule="evenodd" d="M115,40 Q130,5 145,40 L225,172 Q255,220 200,220 L60,220 Q5,220 35,172 Z M130,88 L186,180 L74,180 Z"/>
                </clipPath>
              </defs>
              {/* Thick ring: outer rounded triangle – inner triangle hole */}
              <path fillRule="evenodd" d="M115,40 Q130,5 145,40 L225,172 Q255,220 200,220 L60,220 Q5,220 35,172 Z M130,88 L186,180 L74,180 Z" fill="#00e850"/>
              {/* Face shading + Penrose seam lines (clipped to ring) */}
              <g clipPath="url(#pRing)">
                {/* Left face — darkest */}
                <path d="M130,0 L0,225 L130,88 L186,180 Z" fill="rgba(0,0,0,0.14)"/>
                {/* Right face — medium */}
                <path d="M260,225 L130,0 L186,180 L74,180 Z" fill="rgba(0,0,0,0.07)"/>
                {/* Penrose seam lines — impossible crossover illusion */}
                <line x1="136" y1="28" x2="186" y2="180" stroke="rgba(0,30,10,0.35)" strokeWidth="2.5"/>
                <line x1="28" y1="204" x2="130" y2="88" stroke="rgba(0,30,10,0.35)" strokeWidth="2.5"/>
                <line x1="232" y1="204" x2="74" y2="180" stroke="rgba(0,30,10,0.35)" strokeWidth="2.5"/>
              </g>
            </svg>
          </div>
          <h1
            className="text-4xl font-bold tracking-[0.25em] text-white"
            style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
          >
            ATLAS NEXUS
          </h1>
          <div
            className="mt-2 h-px w-16"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,160,0.6), transparent)' }}
          />
          <p className="mt-3 text-sm tracking-[0.15em] text-white/40 uppercase">
            Intelligent Commerce Platform
          </p>
        </div>

        {/* ── Login card ── */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
          }}
        >
          {/* Teal accent line */}
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #00d2b4, transparent)' }} />

          <div className="px-8 pt-7 pb-8">
            <h2 className="text-lg font-semibold text-white mb-1">Bienvenido de vuelta</h2>
            <p className="text-sm text-white/40 mb-6">Ingresa tus credenciales para acceder</p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="tu@empresa.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,210,180,0.4)'; e.target.style.background = 'rgba(0,210,180,0.05)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,210,180,0.4)'; e.target.style.background = 'rgba(0,210,180,0.05)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2.5 mt-2 hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #00d2b4, #00a896)',
                  boxShadow: '0 4px 20px rgba(0,210,180,0.3)',
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

            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[11px] text-white/25">¿nuevo en la plataforma?</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            <Link
              to="/register"
              className="mt-3 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center hover:bg-white/8"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(0,210,180,0.8)',
              }}
            >
              Crear una cuenta →
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/15 mt-6">
          Atlas Nexus © 2026 · Powered by Fiserv
        </p>
      </div>

      {/* ── Keyframe animation ── */}
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
