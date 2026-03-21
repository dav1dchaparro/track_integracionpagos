import { useState, useCallback, useEffect } from 'react'
import { fetchDashboard, fetchInsights, generateInsights, fetchTransactions, PERIOD_MAP } from '../api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, ShoppingCart, TrendingUp,
  BarChart2, Activity, CreditCard,
  ChevronLeft, ArrowUpRight, X, Eye, Sparkles,
} from 'lucide-react'
import StatCard, { StatCardSkeleton } from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import FilterBar from '../components/FilterBar'

// ─── Data helpers ─────────────────────────────────────────────────────────────
const sp = (arr) => arr.map((v) => ({ v }))
const PIE_COLORS = ['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0']

function buildKpis(api) {
  const fmt  = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const dailySp = api?.daily_revenue?.slice(-12).map(d => ({ v: d.revenue })) ?? sp([1,1,1,1,1,1,1,1,1,1,1,1])
  return [
    { title: 'Revenue Total',   value: api ? fmt(api.total_revenue) : '—',            change: api?.revenue_change_percent ?? 0, changeLabel: 'vs período ant.', icon: DollarSign,   color: 'blue',   sparkline: dailySp },
    { title: 'Transacciones',   value: api ? api.total_transactions.toLocaleString() : '—', change: 0, changeLabel: '',         icon: Activity,     color: 'cyan',   sparkline: dailySp },
    { title: 'Ticket Promedio', value: api ? '$' + Number(api.average_ticket).toFixed(2) : '—', change: 0, changeLabel: '',      icon: ShoppingCart, color: 'green',  sparkline: dailySp },
    { title: 'Hora Pico',       value: api ? `${api.top_hour}:00 hs` : '—',           change: 0, changeLabel: '',               icon: TrendingUp,   color: 'indigo', sparkline: dailySp },
  ]
}

function buildRevenueData(dailyRevenue) {
  if (!dailyRevenue?.length) return []
  return dailyRevenue.map(d => ({
    mes: new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    revenue: Math.round(d.revenue),
  }))
}

function buildPaymentData(paymentMethods) {
  if (!paymentMethods) return []
  return Object.entries(paymentMethods).map(([name, value]) => ({ name, value: Math.round(value) }))
}

// ─── Hub section definitions ──────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'kpis',         title: 'KPIs',              subtitle: '4 indicadores clave reales',
    icon: BarChart2,       from: '#16a34a', to: '#065f46',
    stats: [],
  },
  {
    id: 'revenue',      title: 'Revenue',            subtitle: 'Ingresos reales por día',
    icon: TrendingUp,      from: '#2563eb', to: '#312e81',
    stats: [],
  },
  {
    id: 'productos',    title: 'Top Productos',       subtitle: 'Productos más vendidos',
    icon: ShoppingCart,    from: '#7c3aed', to: '#4c1d95',
    stats: [],
  },
  {
    id: 'pagos',        title: 'Métodos de Pago',    subtitle: 'Distribución por método',
    icon: CreditCard,      from: '#0891b2', to: '#164e63',
    stats: [],
  },
  {
    // AI-generated insights about sales patterns and recommendations
    id: 'insights',     title: 'Insights IA',        subtitle: 'Análisis automático de tus ventas',
    icon: Sparkles,        from: '#7c3aed', to: '#4c1d95',
    stats: [],
  },
  {
    // Recent transactions list
    id: 'transacciones', title: 'Transacciones',     subtitle: 'Últimas ventas registradas',
    icon: Activity,        from: '#ea580c', to: '#7c2d12',
    stats: [],
  },
]

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function SectionWrapper({ section, onBack, filters, children }) {
  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Dashboard
        </button>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${section.from}, ${section.to})` }}>
            <section.icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{section.title}</span>
        </div>
        {/* Active filters pill */}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span className="badge badge-green">{filters.dateRange}</span>
          {filters.category !== 'Todas' && <span className="badge badge-green">{filters.category}</span>}
          {filters.region !== 'Global'  && <span className="badge badge-green">{filters.region}</span>}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 min-h-0 px-6 pb-5">
        {children}
      </div>
    </div>
  )
}

// ─── Hub Card ────────────────────────────────────────────────────────────────
function HubCard({ section, onClick }) {
  return (
    <button
      onClick={() => onClick(section.id)}
      className="relative overflow-hidden rounded-2xl p-6 text-left group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/30"
      style={{ background: `linear-gradient(135deg, ${section.from} 0%, ${section.to} 100%)` }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15), transparent 60%)` }} />

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
        <section.icon className="w-5 h-5 text-white" />
      </div>

      {/* Title */}
      <h3 className="text-white font-bold text-base leading-tight">{section.title}</h3>
      <p className="text-white/60 text-xs mt-1">{section.subtitle}</p>

      {/* Stats chips */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {section.stats.map((s) => (
          <div key={s.l} className="bg-white/15 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
            <p className="text-white font-bold text-sm leading-none">{s.v}</p>
            <p className="text-white/50 text-[10px] mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Arrow indicator */}
      <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/25 group-hover:scale-110 transition-all duration-200">
        <ArrowUpRight className="w-4 h-4 text-white" />
      </div>
    </button>
  )
}

// ─── KPIs Section ────────────────────────────────────────────────────────────
function KpisSection({ isLoading, onKpiClick, apiData }) {
  const kpis = buildKpis(apiData)
  return (
    <div className="h-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
      {isLoading
        ? Array(12).fill(0).map((_, i) => <StatCardSkeleton key={i} delay={i * 30} />)
        : kpis.map((kpi, i) => (
            <StatCard key={kpi.title} {...kpi} animDelay={i * 30} onClick={() => onKpiClick(kpi)} />
          ))
      }
    </div>
  )
}

// ─── Revenue Section ─────────────────────────────────────────────────────────
function RevenueSection({ apiData }) {
  const data = buildRevenueData(apiData?.daily_revenue)
  return (
    <div className="h-full flex flex-col gap-4">
      <ChartCard title="Revenue diario" subtitle="Datos reales del período seleccionado">
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${Number(v).toLocaleString('es-AR')}`, 'Revenue']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={32} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}

// ─── Productos Section ────────────────────────────────────────────────────────
function ProductosSection({ apiData }) {
  const topProducts = (apiData?.top_products ?? []).map(p => ({
    name: p.name,
    sales: p.quantity,
    revenue: '$' + Number(p.revenue).toLocaleString('es-AR', { minimumFractionDigits: 0 }),
  }))
  if (!topProducts.length) return <div className="flex items-center justify-center h-full text-gray-400">Cargando productos...</div>
  return (
    <div className="h-full flex flex-col">
      <ChartCard title="Top Productos" subtitle="Más vendidos del período">
        <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-900">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['#','Producto','Ventas','Revenue'].map(h => (
                  <th key={h} className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-left first:text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {topProducts.map((p, i) => (
                <tr key={p.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 text-center text-xs font-bold text-gray-400">#{i+1}</td>
                  <td className="py-3 font-semibold text-gray-900 dark:text-white">{p.name}</td>
                  <td className="py-3 tabular-nums text-gray-600 dark:text-gray-300">{p.sales.toLocaleString()}</td>
                  <td className="py-3 font-bold text-green-600 tabular-nums">{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

// ─── Pagos Section ────────────────────────────────────────────────────────────
function PagosSection({ apiData }) {
  const data = buildPaymentData(apiData?.payment_methods)
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!data.length) return <div className="flex items-center justify-center h-full text-gray-400">Cargando datos de pagos...</div>
  return (
    <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard title="Métodos de Pago" subtitle="Distribución por revenue">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="45%" innerRadius={65} outerRadius={100} dataKey="value" paddingAngle={4}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => [`$${Number(v).toLocaleString('es-AR')}`, '']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <ChartCard title="Desglose por método" subtitle="Revenue real del período">
        <div className="flex flex-col gap-3 mt-2">
          {data.map((d, i) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
            return (
              <div key={d.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{d.name}</span>
                  <span className="font-bold text-gray-900 dark:text-white">${Number(d.value).toLocaleString('es-AR')} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                </div>
              </div>
            )
          })}
        </div>
      </ChartCard>
    </div>
  )
}

// ─── Insights Section ─────────────────────────────────────────────────────────
// Shows AI-generated insights about sales patterns.
// The user can trigger generation with the "Generar Insights" button.
function InsightsSection({ insightsData, onGenerate, isGenerating }) {
  // Map a trend string to a visual indicator arrow with appropriate color
  function TrendIcon({ trend }) {
    if (trend === 'up')     return <span className="text-green-500 font-bold text-lg">↑</span>
    if (trend === 'down')   return <span className="text-red-500  font-bold text-lg">↓</span>
    return <span className="text-gray-400 font-bold text-lg">→</span>
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto">
      {/* Header row with generate button */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Insights generados por IA
        </h2>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {/* Show spinner while generation is in progress */}
          {isGenerating ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerating ? 'Analizando...' : 'Generar Insights'}
        </button>
      </div>

      {/* Empty state */}
      {insightsData.length === 0 && !isGenerating && (
        <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
          No hay insights. Presioná Generar para analizar tus ventas.
        </div>
      )}

      {/* One card per insight */}
      {insightsData.map((insight, i) => (
        <div key={i} className="card p-5 flex flex-col gap-2">
          {/* Title row with trend icon */}
          <div className="flex items-center gap-2">
            <TrendIcon trend={insight.trend} />
            <span className="font-bold text-gray-900 dark:text-white">{insight.title}</span>
          </div>

          {/* Main description */}
          <p className="text-sm text-gray-600 dark:text-gray-300">{insight.description}</p>

          {/* Recommendation highlighted box */}
          {insight.recommendation && (
            <div className="mt-1 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-4 py-3">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide mb-0.5">
                Recomendación
              </p>
              <p className="text-sm text-violet-800 dark:text-violet-200">{insight.recommendation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Transactions Section ─────────────────────────────────────────────────────
// Renders a table of the most recent transactions for the merchant.
function TransactionsSection({ txData }) {
  if (!txData.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No hay transacciones disponibles.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">Últimas transacciones</h2>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 440 }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-900">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Fecha', 'Descripción', 'Método', 'Monto'].map(h => (
                  <th key={h} className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {txData.map((tx, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  {/* Date formatted to local Argentine locale with day, month and time */}
                  <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>

                  {/* Description or a fallback label */}
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-200">
                    {tx.description || 'Venta'}
                  </td>

                  {/* Payment method shown as a small badge */}
                  <td className="py-3 px-4">
                    <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg px-2 py-0.5">
                      {tx.payment_method ?? '—'}
                    </span>
                  </td>

                  {/* Amount in green with Argentine peso format */}
                  <td className="py-3 px-4 font-bold text-green-600 tabular-nums whitespace-nowrap">
                    ${Number(tx.amount ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── KPI Detail Modal ─────────────────────────────────────────────────────────
function KpiModal({ kpi, onClose }) {
  if (!kpi) return null
  const isGood = kpi.inverseTrend ? kpi.change < 0 : kpi.change >= 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div className="relative card shadow-2xl w-full max-w-sm animate-scale-in p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white">{kpi.title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">{kpi.value}</div>
        <div className={`text-sm font-bold mb-4 ${isGood?'text-green-600':'text-red-500'}`}>
          {kpi.change >= 0 ? '▲' : '▼'} {Math.abs(kpi.change)}% {kpi.changeLabel}
        </div>
        {kpi.sparkline && (
          <div className="h-16 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={kpi.sparkline}>
                <defs>
                  <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2} fill="url(#mg)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            {label:'Período',value:'12 meses'},{label:'Meta',value:isGood?'✓ Alcanzada':'En progreso'},
            {label:'Tendencia',value:kpi.change>=0?'Al alza':'A la baja'},{label:'Estado',value:isGood?'Óptimo':'Requiere acción'},
          ].map(({label,value}) => (
            <div key={label} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-gray-400 mb-0.5">{label}</p>
              <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Hub View ────────────────────────────────────────────────────────────────
function HubView({ onOpen, dateRange, setDateRange, category, setCategory, region, setRegion, isLoading, onRefresh, apiData }) {
  const today = new Date().toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'})
  const fmt = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return (
    <div className="flex flex-col h-full px-6 pt-5 pb-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Selecciona un módulo para explorar · {today}</p>
        </div>
        <button onClick={() => onOpen('kpis')} className="btn-primary hidden md:flex">
          <Eye className="w-4 h-4" />
          Vista rápida KPIs
        </button>
      </div>

      {/* KPI resumen real del backend */}
      {apiData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 flex-shrink-0">
          {[
            { label: 'Revenue total',   value: fmt(apiData.total_revenue),                              change: apiData.revenue_change_percent },
            { label: 'Transacciones',   value: apiData.total_transactions.toLocaleString(),              change: null },
            { label: 'Ticket promedio', value: '$' + Number(apiData.average_ticket).toFixed(2),         change: null },
            { label: 'Hora pico',       value: `${apiData.top_hour}:00 hs`,                             change: null },
          ].map(k => (
            <div key={k.label} className="card px-4 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{k.value}</p>
              {k.change != null && (
                <p className={`text-xs font-semibold mt-0.5 ${k.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {k.change >= 0 ? '+' : ''}{k.change.toFixed(1)}% vs período ant.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-4 flex-shrink-0">
        <FilterBar
          dateRange={dateRange} setDateRange={setDateRange}
          category={category}  setCategory={setCategory}
          region={region}       setRegion={setRegion}
          isLoading={isLoading} onRefresh={onRefresh}
        />
      </div>

      {/* Section grid - fills remaining height */}
      <div className="flex-1 min-h-0 grid grid-cols-2 md:grid-cols-3 gap-4">
        {SECTIONS.map((s) => <HubCard key={s.id} section={s} onClick={onOpen} />)}
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
// Maps section IDs to their corresponding component
const SECTION_MAP = {
  kpis:          KpisSection,
  revenue:       RevenueSection,
  productos:     ProductosSection,
  pagos:         PagosSection,
  insights:      InsightsSection,
  transacciones: TransactionsSection,
}

export default function Dashboard() {
  const [activeId,    setActiveId]    = useState(null)
  const [selectedKpi, setSelectedKpi] = useState(null)
  const [dateRange,   setDateRange]   = useState('30D')
  const [category,    setCategory]    = useState('Todas')
  const [region,      setRegion]      = useState('Global')
  const [isLoading,   setIsLoading]   = useState(false)
  const [apiData,     setApiData]     = useState(null)

  // Insights state: list of AI insight objects fetched from the backend
  const [insightsData,  setInsightsData]  = useState([])
  // Whether an insight generation request is currently in flight
  const [isGenerating,  setIsGenerating]  = useState(false)
  // List of recent transactions
  const [txData,        setTxData]        = useState([])

  // Carga datos reales del backend (dashboard + insights + transactions)
  useEffect(() => {
    const days = PERIOD_MAP[dateRange] ?? 30
    fetchDashboard(days)
      .then(setApiData)
      .catch(() => setApiData(null))
    // Load existing insights (may be empty if none generated yet)
    fetchInsights()
      .then(setInsightsData)
      .catch(() => setInsightsData([]))
    // Load the 15 most recent transactions
    fetchTransactions(15)
      .then(setTxData)
      .catch(() => setTxData([]))
  }, [dateRange])

  /**
   * Triggers backend AI insight generation for the current date range,
   * then re-fetches the updated insight list.
   */
  const handleGenerateInsights = useCallback(async () => {
    setIsGenerating(true)
    try {
      await generateInsights(PERIOD_MAP[dateRange] ?? 30)
      const fresh = await fetchInsights()
      setInsightsData(fresh)
    } catch (e) {
      // silently ignore generation errors; the existing insights remain visible
    } finally {
      setIsGenerating(false)
    }
  }, [dateRange])

  const triggerLoad = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 600)
  }, [])

  const handleFilterChange = (setter) => (v) => { setter(v); triggerLoad() }

  const activeSection = SECTIONS.find(s => s.id === activeId)
  const SectionContent = activeId ? SECTION_MAP[activeId] : null

  const filters = { dateRange, category, region }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950">
      {SectionContent && activeSection ? (
        <SectionWrapper key={activeId} section={activeSection} onBack={() => setActiveId(null)} filters={filters}>
          <SectionContent
            isLoading={isLoading}
            filters={filters}
            onKpiClick={setSelectedKpi}
            apiData={apiData}
            // Insights-specific props
            insightsData={insightsData}
            onGenerate={handleGenerateInsights}
            isGenerating={isGenerating}
            // Transactions-specific props
            txData={txData}
          />
        </SectionWrapper>
      ) : (
        <HubView
          onOpen={(id) => { setActiveId(id); triggerLoad() }}
          dateRange={dateRange} setDateRange={handleFilterChange(setDateRange)}
          category={category}   setCategory={handleFilterChange(setCategory)}
          region={region}       setRegion={handleFilterChange(setRegion)}
          isLoading={isLoading} onRefresh={triggerLoad}
          apiData={apiData}
        />
      )}

      {selectedKpi && <KpiModal kpi={selectedKpi} onClose={() => setSelectedKpi(null)} />}
    </div>
  )
}
