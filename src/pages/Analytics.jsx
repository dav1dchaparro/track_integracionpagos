import {
  ComposedChart, BarChart, Bar,
  Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Sparkles, TrendingUp, AlertTriangle, Zap, Star,
  ArrowRight, Users, DollarSign, Target, RefreshCw, Activity, ShoppingCart,
} from 'lucide-react'
import ChartCard from '../components/ChartCard'

// ─── Predictive KPIs (próximo mes) ────────────────────────────────────────────
const predictiveKPIs = [
  { label: 'Revenue est.', value: '$126K', delta: '+12.5%', good: true, icon: DollarSign, color: '#3b82f6' },
  { label: 'Nuevos usuarios', value: '2,840', delta: '+15.8%', good: true, icon: Users, color: '#8b5cf6' },
  { label: 'Órdenes est.', value: '4,120', delta: '+7.2%', good: true, icon: ShoppingCart, color: '#10b981' },
  { label: 'Churn esperado', value: '1.8%', delta: '-22%', good: true, icon: RefreshCw, color: '#f59e0b' },
  { label: 'CAC proyectado', value: '$24.2', delta: '-14.8%', good: true, icon: Target, color: '#14b8a6' },
  { label: 'LTV proyectado', value: '$1,380', delta: '+11.3%', good: true, icon: Activity, color: '#6366f1' },
]

// ─── AI Insights ──────────────────────────────────────────────────────────────
const insights = [
  {
    type: 'Oportunidad', priority: 'Alta',
    icon: TrendingUp,
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
    borderColor: '#10b981',
    title: 'Potencial de upsell en Electrónica',
    description:
      '842 clientes "Campeones" compraron Electrónica en los últimos 60 días sin adquirir accesorios. El 68% de clientes con perfil idéntico compra accesorios el mes siguiente.',
    impact: '+$67K estimado',
    impactGood: true,
    action: 'Lanzar campaña personalizada de accesorios',
    confidence: 87,
  },
  {
    type: 'Riesgo Crítico', priority: 'Urgente',
    icon: AlertTriangle,
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    borderColor: '#ef4444',
    title: '650 clientes con alto riesgo de churn',
    description:
      'Segmento "En Riesgo" con NPS promedio 28, sin compra en 45+ días y 3+ contactos de soporte este mes. Probabilidad de abandono: 74% en los próximos 30 días.',
    impact: '-$145K en riesgo',
    impactGood: false,
    action: 'Activar win-back con descuento del 20% esta semana',
    confidence: 74,
  },
  {
    type: 'Eficiencia', priority: 'Media',
    icon: Zap,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
    borderColor: '#3b82f6',
    title: 'Optimizar CAC en canal Social Media',
    description:
      'Social Media tiene un CAC de $52.4, un 84% más caro que el promedio. Redirigir el 30% del presupuesto a SEO orgánico y email podría reducir el CAC total un 23% en 60 días.',
    impact: '-$18K/mes en adquisición',
    impactGood: true,
    action: 'Rebalancear presupuesto: -30% Social, +30% SEO',
    confidence: 81,
  },
  {
    type: 'Tendencia', priority: 'Media',
    icon: Star,
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
    borderColor: '#8b5cf6',
    title: 'Demanda emergente en Belleza',
    description:
      'Belleza creció un 38% MoM los últimos 3 meses superando el forecast en todos los períodos. Stock actual cubre solo 18 días. Hay $320K en ventas potenciales sin cubrir.',
    impact: '+$320K oportunidad',
    impactGood: true,
    action: 'Ampliar inventario y negociar con proveedores prioritarios',
    confidence: 91,
  },
]

// ─── Revenue Forecast ─────────────────────────────────────────────────────────
// lower = base invisible para el intervalo, band = upper - lower (visible)
const forecastData = [
  { mes: 'Jul',   actual: 68,  lower: 0,   band: 0  },
  { mes: 'Ago',   actual: 79,  lower: 0,   band: 0  },
  { mes: 'Sep',   actual: 85,  lower: 0,   band: 0  },
  { mes: 'Oct',   actual: 91,  lower: 0,   band: 0  },
  { mes: 'Nov',   actual: 98,  lower: 0,   band: 0  },
  { mes: 'Dic',   actual: 112, forecast: 112, lower: 112, band: 0  },
  { mes: 'Ene ▸', forecast: 119, lower: 109, band: 20 },
  { mes: 'Feb ▸', forecast: 127, lower: 114, band: 26 },
  { mes: 'Mar ▸', forecast: 136, lower: 120, band: 32 },
  { mes: 'Abr ▸', forecast: 145, lower: 127, band: 36 },
  { mes: 'May ▸', forecast: 156, lower: 135, band: 42 },
  { mes: 'Jun ▸', forecast: 168, lower: 143, band: 50 },
]

// ─── RFM Segments ─────────────────────────────────────────────────────────────
const rfmSegments = [
  {
    name: 'Campeones', count: 842, pct: 18, revenue: '$312K', clv: '$1,890',
    action: 'Recompensar + pedir referidos',
    color: '#10b981', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700',
  },
  {
    name: 'Leales', count: 1240, pct: 26, revenue: '$428K', clv: '$1,450',
    action: 'Upsell y cross-sell agresivo',
    color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700',
  },
  {
    name: 'Potenciales', count: 890, pct: 19, revenue: '$198K', clv: '$780',
    action: 'Activar con primera oferta especial',
    color: '#8b5cf6', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700',
  },
  {
    name: 'En Riesgo', count: 650, pct: 14, revenue: '$145K', clv: '$560',
    action: 'Win-back urgente: -20% descuento',
    color: '#f59e0b', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700',
  },
  {
    name: 'Nuevos', count: 580, pct: 12, revenue: '$82K', clv: '$240',
    action: 'Onboarding + primer valor en 7 días',
    color: '#06b6d4', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-300 dark:border-cyan-700',
  },
  {
    name: 'Perdidos', count: 540, pct: 11, revenue: '$42K', clv: '$180',
    action: 'Encuesta de salida + oferta final',
    color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700',
  },
]

// ─── Churn Risk ───────────────────────────────────────────────────────────────
const churnRiskData = [
  { segment: 'Perdidos',    riesgo: 91, color: '#dc2626' },
  { segment: 'En Riesgo',   riesgo: 74, color: '#f97316' },
  { segment: 'Nuevos',      riesgo: 28, color: '#f59e0b' },
  { segment: 'Potenciales', riesgo: 22, color: '#eab308' },
  { segment: 'Leales',      riesgo: 8,  color: '#22c55e' },
  { segment: 'Campeones',   riesgo: 3,  color: '#16a34a' },
]

// ─── Cohort Retention ─────────────────────────────────────────────────────────
const cohortData = [
  { cohort: 'Oct 25', size: 1240, m0: 100, m1: 82, m2: 71, m3: 65, m4: 60, m5: 56 },
  { cohort: 'Nov 25', size: 980,  m0: 100, m1: 85, m2: 74, m3: 68, m4: 62, m5: null },
  { cohort: 'Dic 25', size: 1450, m0: 100, m1: 80, m2: 69, m3: 63, m4: null, m5: null },
  { cohort: 'Ene 26', size: 1120, m0: 100, m1: 86, m2: 75, m3: null, m4: null, m5: null },
  { cohort: 'Feb 26', size: 870,  m0: 100, m1: 88, m2: null, m3: null, m4: null, m5: null },
  { cohort: 'Mar 26', size: 1090, m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null },
]
const COHORT_KEYS = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5']
const COHORT_HEADERS = ['M+0', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5']

// ─── Helpers ──────────────────────────────────────────────────────────────────
const retentionStyle = (v) => {
  if (v === null || v === undefined) return { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-300 dark:text-gray-600' }
  if (v === 100) return { bg: 'bg-indigo-600', text: 'text-white' }
  if (v >= 75)   return { bg: 'bg-green-500',  text: 'text-white' }
  if (v >= 60)   return { bg: 'bg-green-400',  text: 'text-white' }
  if (v >= 45)   return { bg: 'bg-yellow-400', text: 'text-gray-900' }
  return           { bg: 'bg-orange-400',       text: 'text-white' }
}

// ─── Custom Forecast Tooltip ──────────────────────────────────────────────────
const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const actual   = payload.find(p => p.dataKey === 'actual')
  const forecast = payload.find(p => p.dataKey === 'forecast')
  const lower    = payload.find(p => p.dataKey === 'lower')
  const band     = payload.find(p => p.dataKey === 'band')
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 dark:text-white mb-1.5">{label}</p>
      {actual?.value != null && (
        <p className="text-blue-600 dark:text-blue-400">Real: <span className="font-bold">${actual.value}K</span></p>
      )}
      {forecast?.value != null && (
        <>
          <p className="text-blue-500">Pronóstico: <span className="font-bold">${forecast.value}K</span></p>
          {lower?.value > 0 && band?.value > 0 && (
            <p className="text-gray-400 mt-1">
              IC 85%: ${lower.value}K – ${lower.value + band.value}K
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Analytics() {
  return (
    <div className="space-y-8 p-6 overflow-y-auto flex-1">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Avanzado</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Análisis predictivo, segmentación y insights accionables para escalar el negocio
        </p>
      </div>

      {/* ── Predictive KPIs ── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Proyección · próximo mes
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {predictiveKPIs.map((kpi) => (
            <div key={kpi.label} className="card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                <span className={`text-xs font-bold ${kpi.good ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {kpi.delta}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{kpi.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Insights ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white leading-none">Insights de IA</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">4 acciones prioritarias detectadas</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {insights.map((ins) => (
            <div
              key={ins.title}
              className="card p-5 border-l-4 flex flex-col gap-3"
              style={{ borderLeftColor: ins.borderColor }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ins.badgeClass}`}>
                    <ins.icon className="w-3 h-3" />
                    {ins.type}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{ins.priority}</span>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${ins.impactGood ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {ins.impact}
                </span>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{ins.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{ins.description}</p>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Confianza del modelo</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{ins.confidence}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${ins.confidence}%`, backgroundColor: ins.borderColor }}
                  />
                </div>
              </div>

              {/* Action */}
              <button
                className="flex items-center gap-2 text-xs font-semibold mt-1 group"
                style={{ color: ins.borderColor }}
              >
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                {ins.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue Forecast ── */}
      <ChartCard
        title="Pronóstico de Revenue"
        subtitle="Histórico (Jul–Dic) + Predicción IA 6 meses · Intervalo confianza 85%"
      >
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={forecastData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}K`} />
            <Tooltip content={<ForecastTooltip />} />

            {/* Confidence band (stacked areas — lower is invisible offset) */}
            <Area
              type="monotone" dataKey="lower" stackId="ci"
              fill="transparent" stroke="none"
              legendType="none" isAnimationActive={false}
            />
            <Area
              type="monotone" dataKey="band" stackId="ci"
              fill="#3b82f6" fillOpacity={0.12} stroke="none"
              legendType="none" isAnimationActive={false}
            />

            {/* Historical */}
            <Line
              type="monotone" dataKey="actual"
              stroke="#3b82f6" strokeWidth={2.5}
              dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }}
              connectNulls={false} name="Revenue real"
            />
            {/* Forecast */}
            <Line
              type="monotone" dataKey="forecast"
              stroke="#3b82f6" strokeWidth={2} strokeDasharray="8 4"
              dot={{ r: 3, stroke: '#3b82f6', fill: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 5 }} connectNulls={false} name="Pronóstico IA"
            />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Manual legend for confidence interval */}
        <div className="flex items-center gap-2 mt-2 justify-end">
          <div className="w-8 h-3 rounded-sm bg-blue-400 opacity-20 border border-blue-400 border-opacity-40" />
          <span className="text-xs text-gray-400">Intervalo confianza 85%</span>
        </div>
      </ChartCard>

      {/* ── RFM + Churn Risk ── */}
      <div className="grid xl:grid-cols-2 gap-6">

        {/* RFM Segments */}
        <ChartCard title="Segmentación RFM de Clientes" subtitle="Recency · Frequency · Monetary">
          <div className="space-y-2 mt-1">
            {rfmSegments.map((seg) => (
              <div
                key={seg.name}
                className={`flex items-center gap-3 p-3 rounded-lg border ${seg.bg} ${seg.border}`}
              >
                {/* Color dot + name */}
                <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{seg.name}</p>
                    <div className="flex items-center gap-3 text-xs flex-shrink-0">
                      <span className="text-gray-500 dark:text-gray-400">{seg.count.toLocaleString()} ({seg.pct}%)</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{seg.revenue}</span>
                      <span className="text-gray-400">CLV {seg.clv}</span>
                    </div>
                  </div>
                  {/* Bar showing % of total */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${seg.pct * 3.5}%`, backgroundColor: seg.color }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 truncate max-w-[160px]">{seg.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Churn Risk */}
        <ChartCard title="Riesgo de Churn por Segmento" subtitle="Probabilidad de abandono en 30 días">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="vertical"
              data={churnRiskData}
              margin={{ top: 5, right: 40, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="segment" type="category" width={90} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Riesgo de churn']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="riesgo" radius={[0, 4, 4, 0]} maxBarSize={28} label={{ position: 'right', fontSize: 11, formatter: (v) => `${v}%` }}>
                {churnRiskData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Alert box for critical segment */}
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">
              <span className="font-semibold">Acción urgente:</span> 1,190 clientes (segmentos "Perdidos" y "En Riesgo") representan $187K en riesgo de pérdida este mes.
            </p>
          </div>
        </ChartCard>
      </div>

      {/* ── Cohort Retention ── */}
      <ChartCard
        title="Análisis de Cohortes"
        subtitle="Retención mensual por cohorte de adquisición — verde = alta retención, naranja = baja retención"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 w-24">Cohorte</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 w-20">Clientes</th>
                {COHORT_HEADERS.map((h) => (
                  <th key={h} className="text-center py-2 px-1 text-xs font-semibold text-gray-500 dark:text-gray-400 w-16">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="space-y-1">
              {cohortData.map((row) => (
                <tr key={row.cohort}>
                  <td className="py-1.5 pr-4 text-xs font-semibold text-gray-700 dark:text-gray-300">{row.cohort}</td>
                  <td className="py-1.5 px-2 text-right text-xs text-gray-500 dark:text-gray-400">
                    {row.size.toLocaleString()}
                  </td>
                  {COHORT_KEYS.map((key) => {
                    const val = row[key]
                    const s = retentionStyle(val)
                    return (
                      <td key={key} className="py-1.5 px-1 text-center">
                        <div className={`mx-auto w-14 h-8 rounded-md flex items-center justify-center text-xs font-bold ${s.bg} ${s.text}`}>
                          {val != null ? `${val}%` : ''}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cohort legend */}
          <div className="flex items-center gap-3 mt-4 justify-end">
            <span className="text-xs text-gray-400">Retención:</span>
            {[
              { label: '≥75%', bg: 'bg-green-500 text-white' },
              { label: '≥60%', bg: 'bg-green-400 text-white' },
              { label: '≥45%', bg: 'bg-yellow-400 text-gray-900' },
              { label: '<45%', bg: 'bg-orange-400 text-white' },
            ].map((item) => (
              <span key={item.label} className={`text-xs px-2 py-0.5 rounded font-medium ${item.bg}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </ChartCard>

    </div>
  )
}
