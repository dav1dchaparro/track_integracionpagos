import { useState, useEffect } from 'react'
import { User, Target, Save, Store, Mail, Calendar, Loader2 } from 'lucide-react'
import { apiFetch } from '../context/AuthContext'

export default function Settings() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [goalInput, setGoalInput] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)

  useEffect(() => {
    apiFetch('/auth/me')
      .then((data) => {
        setProfile(data)
        setGoalInput(data.monthly_goal ? String(data.monthly_goal) : '')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const saveGoal = async () => {
    const val = parseFloat(goalInput)
    if (!val || val <= 0) return
    setSavingGoal(true)
    setGoalSaved(false)
    try {
      const result = await apiFetch('/auth/me/goal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_goal: val }),
      })
      setProfile((prev) => ({ ...prev, monthly_goal: result.monthly_goal }))
      setGoalSaved(true)
      setTimeout(() => setGoalSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    }
    setSavingGoal(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00e676' }} />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Error al cargar perfil: {error}
      </div>
    )
  }

  const createdDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  const initials = profile.store_name
    ? profile.store_name.slice(0, 2).toUpperCase()
    : '??'

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Configuracion</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tu cuenta y preferencias</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}
            >
              <User className="w-4 h-4" style={{ color: '#00e676' }} />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Perfil</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00e676, #00b0ff)' }}
            >
              {initials}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{profile.store_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
              <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold">Tienda</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.store_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold">Email</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 sm:col-span-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold">Miembro desde</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{createdDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Goal Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <Target className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Meta mensual</span>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Define tu objetivo de ventas mensual para trackear tu progreso en el dashboard.
          </p>

          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">$</span>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                placeholder="Ej: 50000"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
              />
            </div>
            <button
              onClick={saveGoal}
              disabled={savingGoal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{
                background: goalSaved ? '#16a34a' : '#8b5cf6',
              }}
            >
              {savingGoal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {goalSaved ? 'Guardado' : savingGoal ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          {profile.monthly_goal && (
            <p className="text-xs text-gray-400 mt-3">
              Meta actual: <span className="font-bold text-gray-600 dark:text-gray-300">${Number(profile.monthly_goal).toLocaleString()}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
