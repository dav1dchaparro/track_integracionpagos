import { useState } from 'react'
import {
  Users, UserPlus, Trash2, Mail, Phone, Building2,
  ShoppingCart, TrendingUp, Target, BarChart3, FileText,
  Crown, Shield, X, Check, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Module definitions ───────────────────────────────────────────────────────
const MODULES = [
  {
    key: 'reports',
    label: 'Reportes',
    desc: 'Ver y descargar reportes generados',
    icon: FileText,
    color: 'blue',
  },
  {
    key: 'analytics',
    label: 'Analytics IA',
    desc: 'Acceso a analítica predictiva',
    icon: BarChart3,
    color: 'purple',
  },
]

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
        checked ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ─── Seller card ──────────────────────────────────────────────────────────────
function SellerCard({ seller, perms, onToggle, onRemove, isBase }) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const stats = seller.stats || { revenue: 0, orders: 0, conversion: 0 }

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-5 flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          {seller.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 dark:text-white">{seller.name}</p>
            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold rounded-full">
              Vendedor
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{seller.email}</p>
          <div className="flex items-center gap-3 mt-1">
            {seller.department && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Building2 className="w-3 h-3" />{seller.department}
              </span>
            )}
            {seller.phone && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Phone className="w-3 h-3" />{seller.phone}
              </span>
            )}
          </div>
        </div>
        {!isBase && (
          <button
            onClick={() => setConfirmRemove(true)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Eliminar vendedor"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Revenue', value: `$${((stats.revenue || 0) / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Órdenes', value: stats.orders || 0,                                icon: ShoppingCart, color: 'text-blue-600' },
          { label: 'Conversión', value: `${stats.conversion || 0}%`,                  icon: Target,      color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Module toggles */}
      <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          Módulos habilitados
        </p>
        <div className="space-y-2.5">
          {MODULES.map(m => (
            <div key={m.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg bg-${m.color}-50 dark:bg-${m.color}-900/20 flex items-center justify-center`}>
                  <m.icon className={`w-3.5 h-3.5 text-${m.color}-600`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-white">{m.label}</p>
                  <p className="text-[10px] text-gray-400">{m.desc}</p>
                </div>
              </div>
              <Toggle checked={perms?.[m.key] ?? false} onChange={v => onToggle(seller.id, m.key, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Confirm remove overlay */}
      {confirmRemove && (
        <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 rounded-2xl z-10">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <div className="text-center">
            <p className="font-bold text-gray-900 dark:text-white">¿Eliminar vendedor?</p>
            <p className="text-xs text-gray-400 mt-1">Se eliminará {seller.name} del sistema</p>
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
  const [form, setForm] = useState({ name: '', email: '', password: '123456', department: 'Ventas', phone: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    onAdd(form)
    setLoading(false)
    setSuccess(true)
    setTimeout(onClose, 1200)
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
                { label: 'Nombre completo', key: 'name', type: 'text',  placeholder: 'Ej: Laura Sánchez', required: true },
                { label: 'Email',           key: 'email', type: 'email', placeholder: 'laura@empresa.com', required: true },
                { label: 'Contraseña',      key: 'password', type: 'text', placeholder: '123456', required: true },
                { label: 'Departamento',    key: 'department', type: 'text', placeholder: 'Ventas', required: false },
                { label: 'Teléfono',        key: 'phone', type: 'text', placeholder: '+34 600 000 000', required: false },
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
const BASE_SELLER_IDS = [2, 3, 4]

export default function UserManagement() {
  const { sellers, sellerPerms, updatePerm, addSeller, removeSeller } = useAuth()
  const [showAdd, setShowAdd] = useState(false)

  const totalRevenue = sellers.reduce((s, v) => s + (v.stats?.revenue || 0), 0)
  const topSeller    = [...sellers].sort((a, b) => (b.stats?.revenue || 0) - (a.stats?.revenue || 0))[0]
  const activeCount  = sellers.filter(s => (s.stats?.orders || 0) > 0).length

  const handleAdd = (data) => {
    addSeller(data)
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
            Administra vendedores y controla sus permisos de acceso
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total vendedores', value: sellers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Activos',          value: activeCount,   icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Revenue total',    value: `$${(totalRevenue / 1000).toFixed(0)}K`, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Top performer',    value: topSeller?.name?.split(' ')[0] || '—', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
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

        {sellers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-400">No hay vendedores registrados</p>
            <p className="text-sm text-gray-300 mt-1">Haz clic en "Nuevo Vendedor" para agregar uno</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative">
            {sellers.map(s => (
              <div key={s.id} className="relative">
                <SellerCard
                  seller={s}
                  perms={sellerPerms[s.id]}
                  onToggle={updatePerm}
                  onRemove={removeSeller}
                  isBase={BASE_SELLER_IDS.includes(s.id)}
                />
              </div>
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
            Los cambios en permisos se aplican de inmediato. Los vendedores verán solo los módulos que hayas habilitado para ellos.
            El módulo "Mi Dashboard" siempre está disponible para todos los vendedores.
          </p>
        </div>
      </div>

      {showAdd && <AddSellerModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
