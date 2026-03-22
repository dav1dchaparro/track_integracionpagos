import { useState, useEffect } from 'react'
import {
  Users, UserPlus, Trash2, Mail,
  Crown, Shield, X, Check, AlertTriangle,
} from 'lucide-react'
import { apiFetch } from '../context/AuthContext'

// ─── Seller card ──────────────────────────────────────────────────────────────
function SellerCard({ seller, onRemove }) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const initials = seller.email.slice(0, 2).toUpperCase()

  return (
    <div className="card overflow-hidden animate-fade-in relative">
      <div className="p-5 flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 dark:text-white">{seller.email}</p>
            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold rounded-full">
              Vendedor
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Mail className="w-3 h-3" />{seller.email}
          </p>
        </div>
        <button
          onClick={() => setConfirmRemove(true)}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Eliminar vendedor"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {confirmRemove && (
        <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 rounded-2xl z-10">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <div className="text-center">
            <p className="font-bold text-gray-900 dark:text-white">¿Eliminar vendedor?</p>
            <p className="text-xs text-gray-400 mt-1">Se eliminará {seller.email} del sistema</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setConfirmRemove(false)}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onRemove(seller.id); setConfirmRemove(false) }}
              className="flex-1 py-2 rounded-xl bg-red-500 text-sm font-bold text-white hover:bg-red-600 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add seller modal ─────────────────────────────────────────────────────────
function AddSellerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', password: '123456' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onAdd(form)
      setSuccess(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {success ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-bold text-gray-900 dark:text-white">Vendedor creado</p>
            <p className="text-sm text-gray-400">Ya puede ingresar con sus credenciales</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Nuevo Vendedor</h2>
                <p className="text-xs text-gray-400 mt-0.5">Completa los datos del nuevo integrante</p>
              </div>
              <button onClick={onClose} className="btn-ghost p-2 rounded-xl"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[
                { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Ej: Laura Sánchez', required: true },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'laura@empresa.com', required: true },
                { label: 'Contraseña', key: 'password', type: 'text', placeholder: '123456', required: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    required={f.required}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
              ))}

              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 mt-2"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                  <><UserPlus className="w-4 h-4" />Crear vendedor</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UserManagement() {
  const [sellers, setSellers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchSellers = () => {
    apiFetch('/users/')
      .then(setSellers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSellers() }, [])

  const handleAdd = async (data) => {
    await apiFetch('/users/sellers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    fetchSellers()
  }

  const handleRemove = async (id) => {
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' })
      setSellers(s => s.filter(x => x.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto flex-1">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Crown className="w-6 h-6 text-amber-500" />
            Gestión de Equipo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Administra vendedores de tu negocio
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Vendedor
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total vendedores', value: sellers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sellers grid */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          Vendedores del equipo ({sellers.length})
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#22c55e' }} />
          </div>
        ) : sellers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-400">No hay vendedores registrados</p>
            <p className="text-sm text-gray-300 mt-1">Haz clic en "Nuevo Vendedor" para agregar uno</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative">
            {sellers.map(s => (
              <SellerCard key={s.id} seller={s} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>

      {/* Info banner */}
      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)' }}
      >
        <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-400">Control de acceso</p>
          <p className="text-xs text-green-700/70 dark:text-green-500/70 mt-0.5">
            Los vendedores pueden iniciar sesión con su email y contraseña.
            Comparten los productos, categorías y ventas del negocio.
          </p>
        </div>
      </div>

      {showAdd && <AddSellerModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
