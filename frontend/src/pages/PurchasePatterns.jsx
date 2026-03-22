import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import {
  ShoppingCart, Star, CreditCard, Clock,
  ArrowUp, ArrowDown, DollarSign, Package, Tag,
} from 'lucide-react'
import { apiFetch } from '../context/AuthContext'

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const fmtNum  = n => new Intl.NumberFormat('es-AR').format(n)
const fmtPeso = n => '$' + new Intl.NumberFormat('es-AR').format(n)
const fmtK    = n => n >= 1_000_000
  ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1000
    ? `$${(n / 1000).toFixed(0)}K`
    : fmtPeso(n)

const PAYMENT_COLORS = {
  card: '#3b82f6',
  qr:   '#22c55e',
}
const PAYMENT_LABELS = {
  card: 'Tarjeta',
  qr:   'QR',
}

const BRAND_COLORS = {
  visa:       '#2563eb',
  mastercard: '#dc2626',
  amex:       '#0891b2',
}
const BRAND_LABELS = {
  visa:       'VISA',
  mastercard: 'Mastercard',
  amex:       'AMEX',
}

const DAYS_LABELS  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-bold text-gray-900 dark:text-white">{fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function SectionHead({ icon: Icon, title, sub, color = '#22c55e' }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18`, border: `1px solid ${color}28` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{title}</h3>
        {sub && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-px">{sub}</p>}
      </div>
    </div>
  )
}

function buildHeatmap(sales) {
  const grid = {}
  DAYS_LABELS.forEach(day => {
    HOURS.forEach(hour => {
      grid[`${day}-${hour}`] = { day, hour, value: 0 }
    })
  })
  sales.forEach(s => {
    const d = new Date(s.sold_at)
    const day = DAYS_LABELS[d.getDay()]
    const hour = d.getHours()
    const key = `${day}-${hour}`
    if (grid[key]) grid[key].value += 1
  })
  return Object.values(grid)
}

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

const PERIODS = [
  { key: 'week',  label: '7D'  },
  { key: 'month', label: '30D' },
  { key: 'year',  label: '1A'  },
]

export default function PurchasePatterns() {
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch(`/dashboard/summary?period=${period}`),
      apiFetch('/sales/?limit=100'),
    ])
      .then(([summary, salesList]) => {
        setData(summary)
        setSales(salesList)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#22c55e' }} />
      </div>
    )
  }

  const { kpis, payment_methods, card_brands, top_products } = data
  const heatmap = buildHeatmap(sales)
  const maxHeat = Math.max(1, ...heatmap.map(c => c.value))

  // Build chart data
  const paymentData = Object.entries(payment_methods).map(([key, val]) => ({
    name: PAYMENT_LABELS[key] || key,
    value: val.count,
    total: val.total,
    color: PAYMENT_COLORS[key] || '#9ca3af',
  }))

  const brandData = Object.entries(card_brands).map(([key, val]) => ({
    name: BRAND_LABELS[key] || key,
    value: val.count,
    total: val.total,
    color: BRAND_COLORS[key] || '#9ca3af',
  }))
  const brandTotal = brandData.reduce((a, b) => a + b.value, 0)
  brandData.forEach(b => { b.pct = brandTotal ? ((b.value / brandTotal) * 100).toFixed(1) : 0 })

  const KPI_CARDS = [
    { label: 'Transacciones',   value: fmtNum(kpis.total_orders),    icon: ShoppingCart, color: '#3b82f6' },
    { label: 'Revenue Total',   value: fmtK(kpis.total_revenue),     icon: DollarSign,   color: '#22c55e' },
    { label: 'Ticket Promedio', value: fmtPeso(kpis.avg_ticket),     icon: CreditCard,   color: '#8b5cf6' },
    { label: 'Productos',       value: fmtNum(kpis.total_products),  icon: Package,      color: '#f59e0b' },
    { label: 'Categorías',      value: fmtNum(kpis.total_categories),icon: Tag,          color: '#06b6d4' },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5 animate-fade-in-up max-w-[1400px]">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Patrones de Compra</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Análisis detallado de comportamiento transaccional
            </p>
          </div>
          <div className="tab-group self-start sm:self-auto">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={period === p.key ? 'tab-item-active' : 'tab-item'}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI Row ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {KPI_CARDS.map((k) => (
            <div key={k.label} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${k.color}15`, border: `1px solid ${k.color}22` }}>
                  <k.icon className="w-4 h-4" style={{ color: k.color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── Row: Método de pago + Emisora ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Método de pago */}
          <div className="card p-5">
            <SectionHead icon={CreditCard} title="Método de Pago"
              sub="Distribución de medios de pago" color="#3b82f6" />
            {paymentData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={paymentData} dataKey="value"
                      innerRadius={46} outerRadius={70}
                      paddingAngle={3} startAngle={90} endAngle={-270}>
                      {paymentData.map((m, i) => <Cell key={i} fill={m.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-1">
                  {paymentData.map((m) => (
                    <div key={m.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                      <span className="text-[11px] text-gray-600 dark:text-gray-400 flex-1">{m.name}</span>
                      <span className="text-[11px] font-semibold text-gray-900 dark:text-white tabular-nums">{fmtNum(m.value)}</span>
                      <span className="text-[10px] text-gray-400 tabular-nums">{fmtK(m.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos de pagos</p>
            )}
          </div>

          {/* Emisora de tarjeta */}
          <div className="card p-5">
            <SectionHead icon={CreditCard} title="Emisora de Tarjeta"
              sub="VISA · Mastercard · AMEX" color="#dc2626" />
            {brandData.length > 0 ? (
              <div className="space-y-3 mt-1">
                {brandData.map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 tabular-nums">{fmtNum(c.value)}</span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: c.color }}>{c.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos de tarjetas</p>
            )}
          </div>
        </div>

        {/* ── Heatmap horarios ────────────────────────────────── */}
        <div className="card p-5">
          <SectionHead icon={Clock} title="Horarios de Compra"
            sub="Concentración de transacciones por hora y día de semana" color="#8b5cf6" />
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Hour labels */}
              <div className="flex items-center mb-1.5 pl-10">
                {HOURS.filter((_, i) => i % 2 === 0).map(h => (
                  <div key={h} className="flex-1 text-center text-[9px] text-gray-400">{h}h</div>
                ))}
              </div>
              {/* Grid rows */}
              {DAYS_LABELS.map(day => (
                <div key={day} className="flex items-center gap-1 mb-1">
                  <span className="w-9 text-[10px] text-gray-400 text-right flex-shrink-0 pr-1">{day}</span>
                  <div className="flex flex-1 gap-px">
                    {HOURS.map(hour => {
                      const cell = heatmap.find(c => c.day === day && c.hour === hour)
                      const v = cell?.value ?? 0
                      const opacity = v === 0 ? 0.06 : 0.06 + (v / maxHeat) * 0.94
                      return (
                        <div key={hour}
                          className="flex-1 h-5 rounded-sm cursor-default transition-opacity hover:opacity-75"
                          style={{ backgroundColor: `rgba(139,92,246,${opacity.toFixed(2)})` }}
                          title={`${day} ${hour}:00 — ${v} transacciones`} />
                      )
                    })}
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-1.5 mt-3 pl-10">
                <span className="text-[9px] text-gray-400 mr-1">Baja</span>
                {[0.06, 0.25, 0.45, 0.65, 0.85, 1].map((op, i) => (
                  <div key={i} className="w-5 h-3 rounded-sm"
                    style={{ backgroundColor: `rgba(139,92,246,${op})` }} />
                ))}
                <span className="text-[9px] text-gray-400 ml-1">Alta</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Productos estrella ──────────────────────────────── */}
        <div className="card p-5">
          <SectionHead icon={Star} title="Productos Estrella"
            sub="Top 10 productos por volumen de ventas" color="#f59e0b" />
          {top_products.length > 0 ? (
            <div className="space-y-3">
              {top_products.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-1">
                  <span className="text-sm font-bold text-gray-200 dark:text-gray-700 w-5 flex-shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
                        {fmtK(p.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.categories.length > 0 && (
                        <span className="text-[10px] text-gray-400">{p.categories.join(', ')}</span>
                      )}
                      {p.categories.length > 0 && (
                        <span className="text-[10px] text-gray-300 dark:text-gray-700">·</span>
                      )}
                      <span className="text-[10px] text-gray-500">{fmtNum(p.units)} u.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos de productos</p>
          )}
        </div>

      </div>
    </div>
  )
}
