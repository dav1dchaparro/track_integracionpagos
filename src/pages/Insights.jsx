import { useState } from 'react'
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Sparkles, TrendingUp, AlertTriangle, Zap, Target, Users, DollarSign,
  Mail, Share2, Search, MousePointerClick, RotateCcw, CheckCircle2,
  Clock, ArrowUpRight, ChevronRight, Flame, Star, ShieldAlert,
  Megaphone, RefreshCw, Activity, BadgeCheck, Circle,
  Play, Pause, Eye,
} from 'lucide-react'
import ChartCard from '../components/ChartCard'

// ─── Paleta neon SciFi ────────────────────────────────────────────────────────
const NEON   = '#00e676'
const NEON2  = '#00b8d9'
const WARN   = '#fbbf24'
const DANGER = '#f87171'
const PURPLE = '#a78bfa'
const PINK   = '#f472b6'

// ─── AI Insights ──────────────────────────────────────────────────────────────
const AI_INSIGHTS = [
  {
    id: 1,
    type: 'Oportunidad',
    priority: 'Alta',
    icon: TrendingUp,
    accent: NEON,
    title: 'Potencial de upsell en Electrónica',
    description:
      '842 clientes "Campeones" compraron Electrónica en los últimos 60 días sin adquirir accesorios. El 68% de clientes con perfil similar compra accesorios el mes siguiente.',
    impact: '+$67K estimado',
    impactGood: true,
    action: 'Lanzar campaña de accesorios personalizada',
    confidence: 87,
    segment: 'Campeones',
    channel: 'Email + Push',
  },
  {
    id: 2,
    type: 'Riesgo',
    priority: 'Urgente',
    icon: AlertTriangle,
    accent: DANGER,
    title: '650 clientes con alto riesgo de churn',
    description:
      'Segmento "En Riesgo" con NPS promedio 28, sin compra en 45+ días y más de 3 contactos de soporte este mes. Probabilidad de abandono: 74% en los próximos 30 días.',
    impact: '-$145K en riesgo',
    impactGood: false,
    action: 'Win-back urgente: descuento del 20% esta semana',
    confidence: 74,
    segment: 'En Riesgo',
    channel: 'Email + SMS',
  },
  {
    id: 3,
    type: 'Eficiencia',
    priority: 'Media',
    icon: Zap,
    accent: NEON2,
    title: 'Optimizar CAC en Social Media',
    description:
      'Social Media tiene un CAC de $52.4, un 84% más caro que el promedio. Redirigir el 30% del presupuesto a SEO orgánico y email podría reducir el CAC total un 23% en 60 días.',
    impact: '-$18K/mes en adquisición',
    impactGood: true,
    action: 'Reasignar presupuesto: -30% Social, +20% SEO, +10% Email',
    confidence: 81,
    segment: 'Todos',
    channel: 'Cross-canal',
  },
  {
    id: 4,
    type: 'Tendencia',
    priority: 'Media',
    icon: Star,
    accent: WARN,
    title: 'Crecimiento en categoría Gaming +47%',
    description:
      'Gaming creció 47% MoM con un ticket promedio de $320. Menos del 5% del catálogo está en esta categoría. Expansión de inventario podría capturar demanda latente.',
    impact: '+$89K potencial/mes',
    impactGood: true,
    action: 'Ampliar catálogo Gaming y activar campaña de lanzamiento',
    confidence: 79,
    segment: 'Gen Z & Millennials',
    channel: 'Social + Display',
  },
  {
    id: 5,
    type: 'Oportunidad',
    priority: 'Baja',
    icon: Users,
    accent: PURPLE,
    title: 'Clientes leales sin programa de referidos',
    description:
      '1,240 clientes "Leales" con NPS ≥ 70 nunca han referido a nadie. Con un incentivo de $15 por referido exitoso, el ROI proyectado es 4.2x en 90 días.',
    impact: '+$52K en 90 días',
    impactGood: true,
    action: 'Activar programa de referidos con incentivo dual',
    confidence: 68,
    segment: 'Leales',
    channel: 'Email + App',
  },
]

// ─── Marketing Channels ────────────────────────────────────────────────────────
const CHANNELS = [
  { name: 'Email Marketing', icon: Mail,            roi: 420, cac: 12.4, conv: 8.2,  trend: 'up',   status: 'activo',  action: 'Aumentar frecuencia a 3x/sem en segmento leales',      color: NEON   },
  { name: 'Social Media',    icon: Share2,          roi: 140, cac: 52.4, conv: 2.1,  trend: 'down', status: 'revisar', action: 'Reducir budget 30% y enfocar en contenido orgánico',   color: DANGER },
  { name: 'SEO Orgánico',    icon: Search,          roi: 380, cac: 18.2, conv: 6.8,  trend: 'up',   status: 'activo',  action: 'Publicar 4 artículos/sem sobre Gaming y Electrónica',  color: NEON2  },
  { name: 'Paid Search',     icon: MousePointerClick,roi:260, cac: 28.6, conv: 5.4,  trend: 'up',   status: 'activo',  action: 'Optimizar palabras clave de alto CTR en Electrónica',  color: WARN   },
  { name: 'Retargeting',     icon: RotateCcw,       roi: 510, cac: 9.8,  conv: 11.4, trend: 'up',   status: 'activo',  action: 'Ampliar ventana de retargeting de 7 a 21 días',        color: PURPLE },
]

// ─── Campaign Recommendations ──────────────────────────────────────────────────
const CAMPAIGNS = [
  {
    name: 'Black Friday Early Bird',
    type: 'Promoción',
    segment: 'Campeones + Leales',
    budget: '$8,500',
    roi: '520%',
    duration: '10 días',
    start: '15 Nov',
    status: 'planificada',
    accent: WARN,
    desc: 'Acceso anticipado exclusivo 72h antes del Black Friday. Descuento 25% + envío gratis.',
  },
  {
    name: 'Win-Back Churn Q4',
    type: 'Retención',
    segment: 'En Riesgo',
    budget: '$3,200',
    roi: '340%',
    duration: '21 días',
    start: 'Esta semana',
    status: 'urgente',
    accent: DANGER,
    desc: 'Email + SMS secuencia de 5 pasos. Descuento 20% + free trial de membresía premium.',
  },
  {
    name: 'Gaming Launch Wave',
    type: 'Lanzamiento',
    segment: 'Gen Z + Millennials',
    budget: '$5,800',
    roi: '280%',
    duration: '14 días',
    start: '1 Dic',
    status: 'planificada',
    accent: PURPLE,
    desc: 'Campaña de lanzamiento de nueva línea Gaming. Influencers + Social Ads + Email a interesados.',
  },
  {
    name: 'Referral Ambassador',
    type: 'Referidos',
    segment: 'Leales (NPS ≥ 70)',
    budget: '$2,100',
    roi: '420%',
    duration: '90 días',
    start: 'Esta semana',
    status: 'planificada',
    accent: NEON,
    desc: 'Programa de embajadores con $15 por referido exitoso. Dashboard en app para tracking.',
  },
]

// ─── Action Board ──────────────────────────────────────────────────────────────
const INITIAL_ACTIONS = [
  { id: 1, title: 'Crear segmento "Upsell Electrónica"',  priority: 'Alta',    status: 'pendiente',    impact: '+$67K',  deadline: '2 días',  cat: 'Segmentación' },
  { id: 2, title: 'Activar secuencia win-back SMS',        priority: 'Urgente', status: 'en-progreso',  impact: '+$145K', deadline: 'Hoy',     cat: 'Retención'    },
  { id: 3, title: 'Reducir budget Social Media 30%',       priority: 'Media',   status: 'pendiente',    impact: '-$18K',  deadline: '5 días',  cat: 'Presupuesto'  },
  { id: 4, title: 'Publicar brief a equipo de Gaming',     priority: 'Alta',    status: 'pendiente',    impact: '+$89K',  deadline: '3 días',  cat: 'Catálogo'     },
  { id: 5, title: 'Configurar programa referidos en app',  priority: 'Media',   status: 'en-progreso',  impact: '+$52K',  deadline: '7 días',  cat: 'Producto'     },
  { id: 6, title: 'A/B test subject lines email Oct',      priority: 'Baja',    status: 'completado',   impact: '+8% OR', deadline: '—',       cat: 'Email'        },
  { id: 7, title: 'Actualizar audiencias en Meta Ads',     priority: 'Alta',    status: 'pendiente',    impact: '-23% CAC',deadline: '1 día',  cat: 'Paid'         },
  { id: 8, title: 'Review mensual de KPIs con el equipo', priority: 'Media',   status: 'completado',   impact: '—',      deadline: '—',       cat: 'Gestión'      },
]

// ─── Chart Data ────────────────────────────────────────────────────────────────
const channelROIData = CHANNELS.map(c => ({ name: c.name.split(' ')[0], roi: c.roi, cac: c.cac }))

const radarData = [
  { subject: 'Email',     A: 92 },
  { subject: 'SEO',       A: 78 },
  { subject: 'Paid',      A: 65 },
  { subject: 'Social',    A: 40 },
  { subject: 'Retarget',  A: 88 },
  { subject: 'Referidos', A: 55 },
]

const funnelData = [
  { stage: 'Alcance',      value: 180000 },
  { stage: 'Sesiones',     value: 42000  },
  { stage: 'Leads',        value: 8400   },
  { stage: 'Oportunidades',value: 2100   },
  { stage: 'Clientes',     value: 840    },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const priorityMeta = {
  Urgente: { color: DANGER,  bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)'  },
  Alta:    { color: WARN,    bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.3)'   },
  Media:   { color: NEON2,   bg: 'rgba(0,184,217,0.1)',    border: 'rgba(0,184,217,0.3)'    },
  Baja:    { color: PURPLE,  bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.3)'  },
}

const statusMeta = {
  pendiente:   { label: 'Pendiente',   icon: Circle,       color: 'var(--scifi-text-muted)' },
  'en-progreso':{ label: 'En Progreso', icon: Play,         color: NEON2                     },
  completado:  { label: 'Completado',  icon: CheckCircle2, color: NEON                      },
}

function PriorityBadge({ priority }) {
  const m = priorityMeta[priority] || priorityMeta.Baja
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}
    >
      {priority}
    </span>
  )
}

function ConfidenceBar({ value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--scifi-surface)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{value}%</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Insights() {
  const [actions, setActions] = useState(INITIAL_ACTIONS)
  const [activeInsight, setActiveInsight] = useState(null)
  const [filterPriority, setFilterPriority] = useState('Todos')
  const [campaignTab, setCampaignTab] = useState('planificada')

  const marketingScore = 74

  const toggleActionStatus = (id) => {
    setActions(prev => prev.map(a => {
      if (a.id !== id) return a
      const next = { pendiente: 'en-progreso', 'en-progreso': 'completado', completado: 'pendiente' }
      return { ...a, status: next[a.status] }
    }))
  }

  const filteredInsights = filterPriority === 'Todos'
    ? AI_INSIGHTS
    : AI_INSIGHTS.filter(i => i.priority === filterPriority)

  const completedCount = actions.filter(a => a.status === 'completado').length
  const inProgressCount = actions.filter(a => a.status === 'en-progreso').length

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', boxShadow: '0 0 16px rgba(0,230,118,0.15)' }}
            >
              <Sparkles className="w-5 h-5" style={{ color: NEON }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--scifi-text)' }}>
              Insights &amp; Recomendaciones
            </h1>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse"
              style={{ background: 'rgba(0,230,118,0.1)', color: NEON, border: '1px solid rgba(0,230,118,0.25)' }}
            >
              IA Live
            </span>
          </div>
          <p className="text-sm ml-12" style={{ color: 'var(--scifi-text-muted)' }}>
            Análisis inteligente de marketing · Actualizado hace 3 min
          </p>
        </div>

        {/* Marketing Health Score */}
        <div
          className="flex items-center gap-4 px-5 py-3 rounded-xl"
          style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}
        >
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--scifi-text-muted)' }}>Marketing Score</p>
            <p className="text-2xl font-bold" style={{ color: NEON }}>{marketingScore}<span className="text-sm font-normal" style={{ color: 'var(--scifi-text-muted)' }}>/100</span></p>
          </div>
          <div className="w-14 h-14 relative flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(0,230,118,0.1)" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="22" fill="none"
                stroke={NEON} strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - marketingScore / 100)}`}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px #00e676)' }}
              />
            </svg>
            <Flame className="absolute w-5 h-5" style={{ color: NEON }} />
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Insights activos',    value: AI_INSIGHTS.length,                              color: NEON,   icon: Sparkles     },
          { label: 'Impacto potencial',   value: '+$253K',                                        color: WARN,   icon: DollarSign   },
          { label: 'Acciones pendientes', value: actions.filter(a=>a.status==='pendiente').length, color: DANGER, icon: AlertTriangle },
          { label: 'Completadas',         value: completedCount,                                  color: PURPLE, icon: BadgeCheck   },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold leading-none" style={{ color }}>{value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--scifi-text-muted)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Insights ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--scifi-text)' }}>
            <Sparkles className="w-4 h-4" style={{ color: NEON }} />
            Insights de IA
          </h2>
          {/* Priority filter */}
          <div className="flex gap-1">
            {['Todos', 'Urgente', 'Alta', 'Media', 'Baja'].map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all"
                style={{
                  background: filterPriority === p ? 'rgba(0,230,118,0.12)' : 'transparent',
                  color: filterPriority === p ? NEON : 'var(--scifi-text-muted)',
                  border: filterPriority === p ? '1px solid rgba(0,230,118,0.3)' : '1px solid transparent',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredInsights.map((ins) => {
            const Icon = ins.icon
            const isOpen = activeInsight === ins.id
            return (
              <div
                key={ins.id}
                className="card overflow-hidden transition-all duration-200"
                style={{
                  borderLeft: `3px solid ${ins.accent}`,
                  boxShadow: isOpen ? `0 0 20px ${ins.accent}18` : 'none',
                }}
              >
                {/* Summary row */}
                <button
                  className="w-full flex items-center gap-4 p-4 text-left"
                  onClick={() => setActiveInsight(isOpen ? null : ins.id)}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${ins.accent}15` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: ins.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <PriorityBadge priority={ins.priority} />
                      <span className="text-[11px]" style={{ color: 'var(--scifi-text-muted)' }}>{ins.type}</span>
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--scifi-text)' }}>{ins.title}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 mr-2">
                    <div className="text-right">
                      <p
                        className="text-sm font-bold"
                        style={{ color: ins.impactGood ? NEON : DANGER }}
                      >
                        {ins.impact}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>Impacto est.</p>
                    </div>
                    <div className="w-24">
                      <p className="text-[10px] mb-1" style={{ color: 'var(--scifi-text-muted)' }}>Confianza</p>
                      <ConfidenceBar value={ins.confidence} color={ins.accent} />
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                    style={{ color: 'var(--scifi-text-muted)', transform: isOpen ? 'rotate(90deg)' : '' }}
                  />
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--scifi-border)' }}>
                    <div className="grid sm:grid-cols-3 gap-4 pt-4">
                      <div className="sm:col-span-2">
                        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--scifi-text-dim)' }}>
                          {ins.description}
                        </p>
                        <div
                          className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ background: `${ins.accent}08`, border: `1px solid ${ins.accent}20` }}
                        >
                          <ArrowUpRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ins.accent }} />
                          <div>
                            <p className="text-xs font-bold mb-0.5" style={{ color: ins.accent }}>Acción recomendada</p>
                            <p className="text-sm" style={{ color: 'var(--scifi-text)' }}>{ins.action}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Segmento objetivo', value: ins.segment },
                          { label: 'Canal sugerido',    value: ins.channel },
                          { label: 'Impacto estimado',  value: ins.impact  },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--scifi-text-muted)' }}>{label}</p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--scifi-text)' }}>{value}</p>
                          </div>
                        ))}
                        <button
                          className="w-full py-2 rounded-lg text-xs font-bold mt-2 transition-all"
                          style={{
                            background: `${ins.accent}15`,
                            border: `1px solid ${ins.accent}40`,
                            color: ins.accent,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = `${ins.accent}25`}
                          onMouseLeave={e => e.currentTarget.style.background = `${ins.accent}15`}
                        >
                          Ejecutar acción →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Channel ROI */}
        <ChartCard title="ROI por Canal" subtitle="Retorno sobre inversión %" action="Ver detalle">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={channelROIData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)', borderRadius: 8, color: 'var(--scifi-text)' }}
                formatter={(v) => [`${v}%`, 'ROI']}
              />
              <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                {channelROIData.map((entry, i) => (
                  <Cell key={i} fill={CHANNELS[i].color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Radar de canales */}
        <ChartCard title="Efectividad de Canales" subtitle="Score 0–100 por dimensión">
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
              <PolarGrid stroke="rgba(0,230,118,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--scifi-text-muted)', fontSize: 11 }} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke={NEON} fill={NEON} fillOpacity={0.12} strokeWidth={2}
                dot={{ fill: NEON, r: 3 }}
              />
              <Tooltip
                contentStyle={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)', borderRadius: 8, color: 'var(--scifi-text)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Funnel */}
        <ChartCard title="Funnel de Conversión" subtitle="Usuarios este mes">
          <div className="space-y-2 mt-1">
            {funnelData.map((f, i) => {
              const maxVal = funnelData[0].value
              const pct = (f.value / maxVal) * 100
              const colors = [NEON, NEON2, WARN, PURPLE, PINK]
              return (
                <div key={f.stage}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color: 'var(--scifi-text-dim)' }}>{f.stage}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: colors[i] }}>
                      {f.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--scifi-surface)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: colors[i], boxShadow: `0 0 6px ${colors[i]}60` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>
      </div>

      {/* ── Channel Deep Dive ── */}
      <ChartCard title="Análisis por Canal de Marketing" subtitle="ROI, CAC y acción recomendada" action="Exportar">
        <div className="space-y-2">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon
            const trendUp = ch.trend === 'up'
            return (
              <div
                key={ch.name}
                className="flex items-center gap-4 p-3 rounded-xl transition-all"
                style={{ background: 'var(--scifi-surface)', border: '1px solid var(--scifi-border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = ch.color + '40'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--scifi-border)'}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ch.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: ch.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--scifi-text)' }}>{ch.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--scifi-text-muted)' }}>{ch.action}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-center">
                  <div>
                    <p className="text-sm font-bold" style={{ color: ch.color }}>{ch.roi}%</p>
                    <p className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>ROI</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--scifi-text)' }}>${ch.cac}</p>
                    <p className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>CAC</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--scifi-text)' }}>{ch.conv}%</p>
                    <p className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>Conv.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="hidden sm:block text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{
                      background: ch.status === 'activo' ? 'rgba(0,230,118,0.1)' : 'rgba(248,113,113,0.1)',
                      color: ch.status === 'activo' ? NEON : DANGER,
                      border: `1px solid ${ch.status === 'activo' ? 'rgba(0,230,118,0.25)' : 'rgba(248,113,113,0.25)'}`,
                    }}
                  >
                    {ch.status === 'activo' ? 'Activo' : 'Revisar'}
                  </span>
                  <TrendingUp
                    className="w-4 h-4"
                    style={{
                      color: trendUp ? NEON : DANGER,
                      transform: trendUp ? '' : 'scaleY(-1)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </ChartCard>

      {/* ── Campaigns + Actions ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Campaign Recommendations */}
        <ChartCard
          title="Campañas Recomendadas"
          subtitle="IA · Ordenadas por prioridad e impacto"
          tabs={['planificada', 'urgente']}
          activeTab={campaignTab}
          onTabChange={setCampaignTab}
        >
          <div className="space-y-3 mt-1">
            {CAMPAIGNS.filter(c => campaignTab === 'urgente' ? c.status === 'urgente' : c.status === 'planificada').map((camp) => (
              <div
                key={camp.name}
                className="rounded-xl p-4 transition-all"
                style={{
                  background: 'var(--scifi-surface)',
                  border: `1px solid ${camp.accent}25`,
                  borderLeft: `3px solid ${camp.accent}`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--scifi-text)' }}>{camp.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: `${camp.accent}12`, color: camp.accent, border: `1px solid ${camp.accent}25` }}>
                        {camp.type}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--scifi-text-muted)' }}>{camp.segment}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: NEON }}>{camp.roi} ROI</p>
                    <p className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>{camp.budget}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--scifi-text-muted)' }}>{camp.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1" style={{ color: 'var(--scifi-text-muted)' }}>
                    <Clock className="w-3 h-3" />
                    <span className="text-[11px]">{camp.duration} · Inicio: {camp.start}</span>
                  </div>
                  <button
                    className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-lg transition-all"
                    style={{ background: `${camp.accent}12`, color: camp.accent, border: `1px solid ${camp.accent}25` }}
                    onMouseEnter={e => e.currentTarget.style.background = `${camp.accent}22`}
                    onMouseLeave={e => e.currentTarget.style.background = `${camp.accent}12`}
                  >
                    <Megaphone className="w-3 h-3" />
                    Activar
                  </button>
                </div>
              </div>
            ))}
            {CAMPAIGNS.filter(c => campaignTab === 'urgente' ? c.status === 'urgente' : c.status === 'planificada').length === 0 && (
              <p className="text-center py-6 text-sm" style={{ color: 'var(--scifi-text-muted)' }}>No hay campañas en este estado</p>
            )}
          </div>
        </ChartCard>

        {/* Action Board */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base" style={{ color: 'var(--scifi-text)' }}>
              Tablero de Acciones
            </h3>
            <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--scifi-text-muted)' }}>
              <span className="flex items-center gap-1"><Play className="w-3 h-3" style={{ color: NEON2 }} />{inProgressCount} en curso</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" style={{ color: NEON }} />{completedCount} completadas</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--scifi-surface)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / actions.length) * 100}%`, background: NEON, boxShadow: `0 0 8px ${NEON}` }}
              />
            </div>
            <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--scifi-text-muted)' }}>
              {completedCount}/{actions.length} completadas
            </p>
          </div>

          <div className="space-y-2">
            {actions.map((action) => {
              const meta = statusMeta[action.status]
              const StatusIcon = meta.icon
              const pm = priorityMeta[action.priority] || priorityMeta.Baja
              return (
                <div
                  key={action.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: 'var(--scifi-surface)',
                    border: '1px solid var(--scifi-border)',
                    opacity: action.status === 'completado' ? 0.6 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = pm.color + '40'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--scifi-border)'}
                  onClick={() => toggleActionStatus(action.id)}
                >
                  <StatusIcon className="w-4 h-4 flex-shrink-0" style={{ color: meta.color }} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{
                        color: 'var(--scifi-text)',
                        textDecoration: action.status === 'completado' ? 'line-through' : 'none',
                      }}
                    >
                      {action.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>{action.cat}</span>
                      {action.deadline !== '—' && (
                        <>
                          <span style={{ color: 'var(--scifi-text-muted)' }}>·</span>
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: action.deadline === 'Hoy' ? DANGER : 'var(--scifi-text-muted)' }}>
                            <Clock className="w-2.5 h-2.5" />{action.deadline}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <PriorityBadge priority={action.priority} />
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: NEON }}>{action.impact}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--scifi-text-muted)' }}>
            Clic en una acción para cambiar su estado
          </p>
        </div>
      </div>

    </div>
  )
}
