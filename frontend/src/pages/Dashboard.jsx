import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, ShoppingCart, TrendingUp, Package, Tag,
  CreditCard, RefreshCw, Calendar,
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

function KpiCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
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

  const fetchDashboard = async (p) => {
    setLoading(true)
    try {
      const result = await apiFetch(`/dashboard/summary?period=${p || period}`)
      setData(result)
    } catch {
      // ignore
    }
    setLoading(false)
  }

  const handlePeriod = (p) => {
    setPeriod(p)
    fetchDashboard(p)
  }

  useEffect(() => { fetchDashboard() }, [])

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

  const { kpis, payment_methods, card_brands, sales_timeline, top_products, category_breakdown } = data

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
              onClick={() => fetchDashboard()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard title="Revenue Total" value={`$${kpis.total_revenue.toLocaleString()}`} icon={DollarSign} color="#16a34a" />
          <KpiCard title="Total Ventas" value={kpis.total_orders.toLocaleString()} icon={ShoppingCart} color="#3b82f6" />
          <KpiCard title="Ticket Promedio" value={`$${kpis.avg_ticket.toLocaleString()}`} icon={TrendingUp} color="#8b5cf6" />
          <KpiCard title="Productos" value={kpis.total_products} icon={Package} color="#f59e0b" />
          <KpiCard title="Categorias" value={kpis.total_categories} icon={Tag} color="#06b6d4" />
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
