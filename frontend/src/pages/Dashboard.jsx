import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, ShoppingCart, TrendingUp, Package, Tag,
  CreditCard, RefreshCw, Users, RotateCcw, Cloud,
} from 'lucide-react'
import ChartCard from '../components/ChartCard'
import { apiFetch } from '../context/AuthContext'

const PIE_COLORS = ['#16a34a', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#14b8a6']

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
]

function KpiCard({ title, value, icon: Icon, color, change }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {change != null && (
          <span className={`text-xs font-bold ${change >= 0 ? 'text-green-500' : 'text-red-400'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [alerts, setAlerts] = useState([])
  const [briefing, setBriefing] = useState(null)
  const [briefingLoading, setBriefingLoading] = useState(true)
  const [monthlyGoal, setMonthlyGoal] = useState(null)
  const [goalInput, setGoalInput] = useState('')
  const [editingGoal, setEditingGoal] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const handleCloverSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await apiFetch('/clover/sync', { method: 'POST' })
      setSyncResult(result)
      if (result.saved > 0) fetchDashboard()
      setTimeout(() => setSyncResult(null), 4000)
    } catch (err) {
      setSyncResult({ error: err.message })
      setTimeout(() => setSyncResult(null), 4000)
    }
    setSyncing(false)
  }

  const fetchDashboard = async (p) => {
    setLoading(true)
    try {
      const result = await apiFetch(`/dashboard/summary?period=${p || period}`)
      setData(result)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const fetchSidePanels = async () => {
    setBriefingLoading(true)
    try {
      const [alertsRes, briefingRes, meRes] = await Promise.all([
        apiFetch('/insights/alerts'),
        apiFetch('/insights/briefing'),
        apiFetch('/auth/me'),
      ])
      setAlerts(alertsRes.alerts || [])
      setBriefing(briefingRes.briefing)
      setMonthlyGoal(meRes.monthly_goal ?? null)
      setGoalInput(meRes.monthly_goal ? String(meRes.monthly_goal) : '')
    } catch { /* ignore */ }
    setBriefingLoading(false)
  }

  const saveGoal = async () => {
    const val = parseFloat(goalInput)
    if (!val || val <= 0) return
    setSavingGoal(true)
    try {
      await apiFetch('/auth/me/goal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_goal: val }),
      })
      setMonthlyGoal(val)
      setEditingGoal(false)
    } catch { /* ignore */ }
    setSavingGoal(false)
  }

  const handlePeriod = (p) => {
    setPeriod(p)
    fetchDashboard(p)
  }

  useEffect(() => {
    fetchDashboard()
    fetchSidePanels()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Error al cargar el dashboard
      </div>
    )
  }

  const { kpis, kpi_changes, payment_methods, card_brands, sales_timeline, top_products, category_breakdown, top_customers } = data

  const alertColors = {
    success: { bg: 'rgba(22,163,74,0.08)', border: '#16a34a40', text: '#16a34a', dot: '#16a34a' },
    warning: { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b40', text: '#f59e0b', dot: '#f59e0b' },
    info:    { bg: 'rgba(59,130,246,0.08)', border: '#3b82f640', text: '#3b82f6', dot: '#3b82f6' },
  }

  const paymentData = Object.entries(payment_methods).map(([name, v]) => ({
    name: name === 'card' ? 'Tarjeta' : name === 'qr' ? 'QR' : name,
    value: v.total,
    count: v.count,
  }))

  const brandData = Object.entries(card_brands).map(([name, v]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: v.total,
    count: v.count,
  }))

  const timelineData = sales_timeline.map((s) => ({
    date: new Date(s.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    total: s.total,
    ventas: s.count,
  }))

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Datos en tiempo real de tu negocio</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePeriod(p.key)}
                  className={`px-3.5 py-2 text-sm font-semibold transition-all ${
                    period === p.key
                      ? 'bg-green-500 text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleCloverSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
              style={{
                background: 'rgba(0,230,118,0.08)',
                border: '1px solid rgba(0,230,118,0.25)',
                color: '#00e676',
              }}
              title="Sincronizar ventas desde Clover"
            >
              <Cloud className={`w-4 h-4 ${syncing ? 'animate-pulse' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sync Clover'}
            </button>
            <button
              onClick={() => fetchDashboard()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clover Sync Result */}
        {syncResult && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm mb-4 transition-all"
            style={{
              background: syncResult.error ? 'rgba(239,68,68,0.08)' : 'rgba(0,230,118,0.08)',
              border: `1px solid ${syncResult.error ? 'rgba(239,68,68,0.25)' : 'rgba(0,230,118,0.25)'}`,
              color: syncResult.error ? '#ef4444' : '#00e676',
            }}
          >
            <Cloud className="w-4 h-4 flex-shrink-0" />
            {syncResult.error ? (
              <span>Error: {syncResult.error}</span>
            ) : (
              <span>
                <strong>{syncResult.saved}</strong> ventas importadas, <strong>{syncResult.skipped}</strong> omitidas
                {syncResult.errors > 0 && <>, <strong>{syncResult.errors}</strong> errores</>}
                {' '}(de {syncResult.total_fetched} ordenes)
              </span>
            )}
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {alerts.map((a, i) => {
              const c = alertColors[a.level] || alertColors.info
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: c.dot }} />
                  <div>
                    <span className="font-bold" style={{ color: c.text }}>{a.title}:</span>
                    <span className="ml-1 text-gray-600 dark:text-gray-300">{a.message}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
          <KpiCard title="Revenue Total" value={`$${kpis.total_revenue.toLocaleString()}`} icon={DollarSign} color="#16a34a" change={kpi_changes?.total_revenue} />
          <KpiCard title="Total Ventas" value={kpis.total_orders.toLocaleString()} icon={ShoppingCart} color="#3b82f6" change={kpi_changes?.total_orders} />
          <KpiCard title="Ticket Promedio" value={`$${kpis.avg_ticket.toLocaleString()}`} icon={TrendingUp} color="#8b5cf6" change={kpi_changes?.avg_ticket} />
          <KpiCard title="Clientes Únicos" value={kpis.unique_customers ?? 0} icon={Users} color="#ec4899" />
          <KpiCard title="Tasa Retorno" value={`${kpis.return_rate ?? 0}%`} icon={RotateCcw} color="#f59e0b" />
          <KpiCard title="Productos" value={kpis.total_products} icon={Package} color="#f59e0b" />
          <KpiCard title="Categorias" value={kpis.total_categories} icon={Tag} color="#06b6d4" />
        </div>

        {/* Briefing + Goal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* AI Briefing */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-50 dark:bg-green-900/20">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">Briefing del día</span>
              <span className="text-[10px] text-gray-400 ml-1">IA · Groq</span>
            </div>
            {briefingLoading ? (
              <div className="flex gap-1 py-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{briefing || '—'}</p>
            )}
          </div>

          {/* Monthly Goal */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-50 dark:bg-purple-900/20">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">Meta mensual</span>
              </div>
              <button
                onClick={() => setEditingGoal(v => !v)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {editingGoal ? 'Cancelar' : monthlyGoal ? 'Editar' : 'Definir'}
              </button>
            </div>
            {editingGoal ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveGoal()}
                  placeholder="Ej: 5000"
                  className="flex-1 px-3 py-1.5 rounded-xl text-sm border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                />
                <button
                  onClick={saveGoal}
                  disabled={savingGoal}
                  className="px-3 py-1.5 rounded-xl text-sm font-bold bg-green-500 text-white disabled:opacity-50"
                >
                  {savingGoal ? '...' : 'Guardar'}
                </button>
              </div>
            ) : monthlyGoal && data ? (() => {
              const pct = Math.min((data.kpis.total_revenue / monthlyGoal) * 100, 100)
              return (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>${data.kpis.total_revenue.toLocaleString()} alcanzado</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">${monthlyGoal.toLocaleString()}</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? '#16a34a' : pct >= 75 ? '#f59e0b' : '#8b5cf6',
                      }}
                    />
                  </div>
                  <p className="text-right text-xs font-bold mt-1" style={{ color: pct >= 100 ? '#16a34a' : '#8b5cf6' }}>
                    {pct.toFixed(0)}%
                  </p>
                </div>
              )
            })() : (
              <p className="text-sm text-gray-400">Define una meta para trackear tu progreso mensual.</p>
            )}
          </div>
        </div>

        {/* Sales timeline */}
        {timelineData.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <div className="xl:col-span-2">
              <ChartCard title="Ventas en el Tiempo" subtitle="Revenue por dia">
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        formatter={(v, name) => [name === 'total' ? `$${v}` : v, name === 'total' ? 'Revenue' : 'Ventas']}
                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Payment methods pie */}
            <ChartCard title="Metodos de Pago" subtitle="Distribucion por revenue">
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          {/* Card brands */}
          {brandData.length > 0 && (
            <ChartCard title="Marcas de Tarjeta" subtitle="Revenue por marca">
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {brandData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          {/* Category breakdown */}
          {category_breakdown.length > 0 && (
            <ChartCard title="Revenue por Categoria" subtitle="Desglose de ingresos">
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={category_breakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip
                      formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {category_breakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}
        </div>

        {/* Top products */}
        {top_products.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-gray-900 dark:text-white">Top Productos</h2>
              <span className="text-xs text-gray-400 ml-1">por revenue</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-left">#</th>
                    <th className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-left">Producto</th>
                    <th className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-left">Categorias</th>
                    <th className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">Unidades</th>
                    <th className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {top_products.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 text-xs font-bold text-gray-400">#{i + 1}</td>
                      <td className="py-3 font-semibold text-gray-900 dark:text-white">{p.name}</td>
                      <td className="py-3">
                        <div className="flex gap-1 flex-wrap">
                          {p.categories.map((c) => (
                            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{p.units}</td>
                      <td className="py-3 text-right font-bold text-gray-900 dark:text-white tabular-nums">${p.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top customers */}
        {top_customers?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-pink-500" />
              <h2 className="font-bold text-gray-900 dark:text-white">Top Clientes</h2>
              <span className="text-xs text-gray-400 ml-1">por gasto total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-left">#</th>
                    <th className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-left">Email</th>
                    <th className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">Compras</th>
                    <th className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {top_customers.map((c, i) => (
                    <tr key={c.email} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 text-xs font-bold text-gray-400">#{i + 1}</td>
                      <td className="py-3 font-semibold text-gray-900 dark:text-white">{c.email}</td>
                      <td className="py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{c.orders}</td>
                      <td className="py-3 text-right font-bold text-gray-900 dark:text-white tabular-nums">${c.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {kpis.total_orders === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sin ventas todavia</h2>
            <p className="text-sm text-gray-500">Crea productos y registra ventas para ver tus metricas aqui.</p>
          </div>
        )}
      </div>
    </div>
  )
}
