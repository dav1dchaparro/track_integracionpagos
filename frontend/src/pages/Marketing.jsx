import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import {
  Megaphone, Mail, MessageSquare, Share2, MousePointerClick,
  TrendingUp, DollarSign, Users, Target, Zap, Play, Pause,
  CheckCircle2, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight,
  BarChart2, RefreshCw, Eye, Send, Flame, Plus, Filter,
} from 'lucide-react'

// ─── Paleta ───────────────────────────────────────────────────────────────────
const NEON   = '#00e676'
const NEON2  = '#00b8d9'
const PURPLE = '#a78bfa'
const PINK   = '#f472b6'
const WARN   = '#fbbf24'
const DANGER = '#f87171'
const ORANGE = '#fb923c'

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const kpis = [
  { label: 'ROI Campañas',      value: '324%',   change: +18.2, icon: TrendingUp,        color: NEON,   good: true  },
  { label: 'Ingresos Atrib.',   value: '$187K',  change: +12.4, icon: DollarSign,        color: NEON2,  good: true  },
  { label: 'Leads Generados',   value: '4,821',  change: +9.1,  icon: Users,             color: PURPLE, good: true  },
  { label: 'Costo por Lead',    value: '$8.40',  change: -14.3, icon: Target,            color: WARN,   good: true  },
  { label: 'CTR Promedio',      value: '4.7%',   change: +0.8,  icon: MousePointerClick, color: PINK,   good: true  },
  { label: 'Tasa Conversión',   value: '6.2%',   change: -0.3,  icon: Zap,               color: ORANGE, good: false },
]

// ─── Canal performance ────────────────────────────────────────────────────────
const channelData = [
  { canal: 'Email',    enviados: 45000, abiertos: 18900, clicks: 4200, conversiones: 890,  roi: 412 },
  { canal: 'Push',    enviados: 32000, abiertos: 12800, clicks: 2900, conversiones: 540,  roi: 287 },
  { canal: 'SMS',     enviados: 12000, abiertos: 10200, clicks: 1800, conversiones: 420,  roi: 356 },
  { canal: 'Social',  enviados: 28000, abiertos: 9100,  clicks: 3100, conversiones: 310,  roi: 198 },
  { canal: 'Display', enviados: 60000, abiertos: 7200,  clicks: 1400, conversiones: 180,  roi: 143 },
]

// ─── ROI mensual ──────────────────────────────────────────────────────────────
const roiMonthly = [
  { mes: 'Oct', email: 380, push: 240, sms: 310, social: 170 },
  { mes: 'Nov', email: 395, push: 255, sms: 325, social: 180 },
  { mes: 'Dic', email: 410, push: 270, sms: 340, social: 190 },
  { mes: 'Ene', email: 400, push: 260, sms: 330, social: 185 },
  { mes: 'Feb', email: 405, push: 275, sms: 345, social: 192 },
  { mes: 'Mar', email: 412, push: 287, sms: 356, social: 198 },
]

// ─── Funnel ───────────────────────────────────────────────────────────────────
const funnelSteps = [
  { name: 'Alcance',       value: 177000, pct: 100, color: NEON   },
  { name: 'Impresiones',   value: 98400,  pct: 55,  color: NEON2  },
  { name: 'Clics',         value: 13400,  pct: 7.6, color: PURPLE },
  { name: 'Leads',         value: 4821,   pct: 2.7, color: WARN   },
  { name: 'Conversiones',  value: 2340,   pct: 1.3, color: PINK   },
]

// ─── Campañas ─────────────────────────────────────────────────────────────────
const campaigns = [
  {
    id: 1,
    name: 'Black Friday Early Access',
    type: 'Email',
    status: 'activa',
    segment: 'Campeones + Leales',
    sent: 12400,
    openRate: '42.3%',
    ctr: '8.1%',
    conv: '3.2%',
    revenue: '$38,400',
    roi: '412%',
    start: '15 Mar',
    end: '30 Mar',
    progress: 62,
  },
  {
    id: 2,
    name: 'Win-back: En Riesgo',
    type: 'Email + SMS',
    status: 'activa',
    segment: 'En Riesgo',
    sent: 6500,
    openRate: '31.8%',
    ctr: '5.4%',
    conv: '1.8%',
    revenue: '$14,200',
    roi: '287%',
    start: '18 Mar',
    end: '25 Mar',
    progress: 85,
  },
  {
    id: 3,
    name: 'Upsell Electrónica',
    type: 'Push + Email',
    status: 'pausada',
    segment: 'Potenciales',
    sent: 8900,
    openRate: '28.5%',
    ctr: '4.9%',
    conv: '2.1%',
    revenue: '$21,800',
    roi: '356%',
    start: '10 Mar',
    end: '31 Mar',
    progress: 44,
  },
  {
    id: 4,
    name: 'Onboarding Nuevos',
    type: 'Email',
    status: 'programada',
    segment: 'Nuevos Clientes',
    sent: 0,
    openRate: '—',
    ctr: '—',
    conv: '—',
    revenue: '—',
    roi: '—',
    start: '01 Abr',
    end: '07 Abr',
    progress: 0,
  },
  {
    id: 5,
    name: 'Retargeting Social Q1',
    type: 'Social',
    status: 'completada',
    segment: 'Abandonaron carrito',
    sent: 22000,
    openRate: '18.2%',
    ctr: '3.7%',
    conv: '0.9%',
    revenue: '$9,900',
    roi: '198%',
    start: '01 Mar',
    end: '15 Mar',
    progress: 100,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  activa:      { label: 'Activa',      color: NEON,   icon: Play,          bg: 'rgba(0,230,118,0.08)',   border: 'rgba(0,230,118,0.25)' },
  pausada:     { label: 'Pausada',     color: WARN,   icon: Pause,         bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' },
  programada:  { label: 'Programada', color: NEON2,  icon: Clock,         bg: 'rgba(0,184,217,0.08)',  border: 'rgba(0,184,217,0.25)'  },
  completada:  { label: 'Completada', color: PURPLE, icon: CheckCircle2,  bg: 'rgba(167,139,250,0.08)',border: 'rgba(167,139,250,0.25)' },
}

const TYPE_ICON = { Email: Mail, SMS: MessageSquare, Push: Send, Social: Share2, Display: Eye }
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : n

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d1f12', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#8bab8e', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: 12, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? p.value + '%' : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Marketing() {
  const [activeTab, setActiveTab] = useState('overview')
  const [filterStatus, setFilterStatus] = useState('todas')
  const [channelMetric, setChannelMetric] = useState('roi')

  const visibleCampaigns = filterStatus === 'todas'
    ? campaigns
    : campaigns.filter((c) => c.status === filterStatus)

  const METRIC_LABELS = { roi: 'ROI (%)', conversiones: 'Conversiones', clicks: 'Clics', abiertos: 'Apertura' }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ background: 'var(--scifi-bg)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-5 h-5" style={{ color: NEON }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--scifi-text)' }}>Marketing</h1>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
              style={{ color: NEON, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}
            >
              LIVE
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--scifi-text-muted)' }}>
            Rendimiento de campañas · Marzo 2026
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.98]"
          style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', color: NEON }}
        >
          <Plus className="w-4 h-4" />
          Nueva campaña
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--scifi-surface)', border: '1px solid var(--scifi-border)' }}>
        {[
          { id: 'overview',   label: 'Resumen'   },
          { id: 'campaigns',  label: 'Campañas'  },
          { id: 'channels',   label: 'Canales'   },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={
              activeTab === tab.id
                ? { background: 'rgba(0,230,118,0.12)', color: NEON, border: '1px solid rgba(0,230,118,0.25)' }
                : { color: 'var(--scifi-text-dim)', border: '1px solid transparent' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW ══════════ */}
      {activeTab === 'overview' && (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {kpis.map((k) => {
              const Icon = k.icon
              const isPos = k.change > 0
              const isGood = (k.good && isPos) || (!k.good && !isPos)
              return (
                <div
                  key={k.label}
                  className="card p-4 flex flex-col gap-3"
                  style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${k.color}14`, border: `1px solid ${k.color}30` }}>
                      <Icon className="w-4 h-4" style={{ color: k.color }} />
                    </div>
                    <span
                      className="text-xs font-semibold flex items-center gap-0.5"
                      style={{ color: isGood ? NEON : DANGER }}
                    >
                      {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(k.change)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ color: 'var(--scifi-text)' }}>{k.value}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--scifi-text-muted)' }}>{k.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ROI mensual + Funnel */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* ROI por canal */}
            <div className="xl:col-span-2 card p-5" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--scifi-text)' }}>ROI por Canal · 6 meses</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={roiMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,230,118,0.06)" />
                  <XAxis dataKey="mes" tick={{ fill: '#3d5e42', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#3d5e42', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#8bab8e' }} />
                  <Line type="monotone" dataKey="email"  name="Email"  stroke={NEON}   strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="push"   name="Push"   stroke={NEON2}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sms"    name="SMS"    stroke={PURPLE} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="social" name="Social" stroke={PINK}   strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Funnel */}
            <div className="card p-5" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--scifi-text)' }}>Funnel de Conversión</p>
              <div className="space-y-2.5">
                {funnelSteps.map((step, i) => (
                  <div key={step.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--scifi-text-dim)' }}>{step.name}</span>
                      <span className="text-xs font-mono" style={{ color: step.color }}>{fmt(step.value)}</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${step.pct}%`, background: step.color, boxShadow: `0 0 6px ${step.color}60` }}
                      />
                    </div>
                    {i < funnelSteps.length - 1 && (
                      <p className="text-[10px] text-right mt-0.5 font-mono" style={{ color: 'var(--scifi-text-muted)' }}>
                        {((funnelSteps[i + 1].value / step.value) * 100).toFixed(1)}% →
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Campañas activas — resumen rápido */}
          <div className="card p-5" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--scifi-text)' }}>Campañas Activas</p>
              <button onClick={() => setActiveTab('campaigns')} className="text-xs font-medium flex items-center gap-1" style={{ color: NEON }}>
                Ver todas <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {campaigns.filter((c) => c.status === 'activa').map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(0,230,118,0.03)', border: '1px solid var(--scifi-border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--scifi-text)' }}>{c.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--scifi-text-muted)' }}>{c.segment} · {c.type}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold" style={{ color: NEON }}>{c.roi}</p>
                    <p className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>ROI</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold" style={{ color: 'var(--scifi-text)' }}>{c.revenue}</p>
                    <p className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>Ingresos</p>
                  </div>
                  <div className="w-24 hidden lg:block">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--scifi-text-muted)' }}>
                      <span>Progreso</span><span>{c.progress}%</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${c.progress}%`, background: NEON, boxShadow: `0 0 6px ${NEON}60` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════ CAMPAÑAS ══════════ */}
      {activeTab === 'campaigns' && (
        <>
          {/* Filtro de estado */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4" style={{ color: 'var(--scifi-text-muted)' }} />
            {['todas', 'activa', 'pausada', 'programada', 'completada'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all"
                style={
                  filterStatus === s
                    ? { background: 'rgba(0,230,118,0.12)', color: NEON, border: '1px solid rgba(0,230,118,0.3)' }
                    : { color: 'var(--scifi-text-dim)', border: '1px solid var(--scifi-border)', background: 'transparent' }
                }
              >
                {s === 'todas' ? 'Todas' : STATUS_CFG[s]?.label}
              </button>
            ))}
          </div>

          {/* Tabla de campañas */}
          <div className="card overflow-hidden" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--scifi-border)' }}>
                    {['Campaña', 'Estado', 'Tipo', 'Enviados', 'Apertura', 'CTR', 'Conv.', 'Ingresos', 'ROI', 'Período'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--scifi-text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleCampaigns.map((c, i) => {
                    const cfg = STATUS_CFG[c.status]
                    const StatusIcon = cfg.icon
                    return (
                      <tr
                        key={c.id}
                        style={{ borderBottom: i < visibleCampaigns.length - 1 ? '1px solid var(--scifi-border)' : 'none' }}
                        className="group transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,230,118,0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--scifi-text)' }}>{c.name}</p>
                            <p className="text-[11px]" style={{ color: 'var(--scifi-text-muted)' }}>{c.segment}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--scifi-text-dim)' }}>{c.type}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--scifi-text-dim)' }}>
                          {c.sent > 0 ? fmt(c.sent) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: c.openRate !== '—' ? NEON2 : 'var(--scifi-text-muted)' }}>{c.openRate}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: c.ctr !== '—' ? PURPLE : 'var(--scifi-text-muted)' }}>{c.ctr}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: c.conv !== '—' ? WARN : 'var(--scifi-text-muted)' }}>{c.conv}</td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--scifi-text)' }}>{c.revenue}</td>
                        <td className="px-4 py-3">
                          {c.roi !== '—' ? (
                            <span className="text-xs font-bold" style={{ color: NEON }}>{c.roi}</span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--scifi-text-muted)' }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--scifi-text-muted)' }}>
                          {c.start} → {c.end}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Progress bars de campañas activas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleCampaigns.filter((c) => c.progress > 0 && c.progress < 100).map((c) => {
              const cfg = STATUS_CFG[c.status]
              return (
                <div key={c.id} className="card p-4" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--scifi-text)' }}>{c.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--scifi-text-muted)' }}>{c.start} → {c.end}</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: cfg.color }}>{c.progress}%</span>
                  </div>
                  <div className="w-full rounded-full h-2 mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${c.progress}%`, background: cfg.color, boxShadow: `0 0 8px ${cfg.color}50` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Apertura', val: c.openRate, color: NEON2  },
                      { label: 'CTR',      val: c.ctr,      color: PURPLE },
                      { label: 'ROI',      val: c.roi,      color: NEON   },
                    ].map((m) => (
                      <div key={m.label}>
                        <p className="text-sm font-bold" style={{ color: m.color }}>{m.val}</p>
                        <p className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ══════════ CANALES ══════════ */}
      {activeTab === 'channels' && (
        <>
          {/* Selector de métrica */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--scifi-text-muted)' }}>Métrica:</span>
            {Object.entries(METRIC_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setChannelMetric(key)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={
                  channelMetric === key
                    ? { background: 'rgba(0,230,118,0.12)', color: NEON, border: '1px solid rgba(0,230,118,0.3)' }
                    : { color: 'var(--scifi-text-dim)', border: '1px solid var(--scifi-border)', background: 'transparent' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Barchart canales */}
          <div className="card p-5" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--scifi-text)' }}>
              {METRIC_LABELS[channelMetric]} por Canal
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={channelData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,230,118,0.06)" vertical={false} />
                <XAxis dataKey="canal" tick={{ fill: '#8bab8e', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#3d5e42', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={channelMetric} name={METRIC_LABELS[channelMetric]} radius={[4, 4, 0, 0]}>
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={[NEON, NEON2, PURPLE, PINK, ORANGE][i]} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de canales */}
          <div className="card overflow-hidden" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--scifi-border)' }}>
                    {['Canal', 'Enviados', 'Abiertos', 'Tasa Apertura', 'Clics', 'CTR', 'Conversiones', 'ROI'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--scifi-text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {channelData.map((c, i) => {
                    const Icon = TYPE_ICON[c.canal] || BarChart2
                    const apertura = ((c.abiertos / c.enviados) * 100).toFixed(1)
                    const ctr = ((c.clicks / c.abiertos) * 100).toFixed(1)
                    const colors = [NEON, NEON2, PURPLE, PINK, ORANGE]
                    const col = colors[i]
                    return (
                      <tr
                        key={c.canal}
                        style={{ borderBottom: i < channelData.length - 1 ? '1px solid var(--scifi-border)' : 'none' }}
                        className="transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,230,118,0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: `${col}14`, border: `1px solid ${col}30` }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: col }} />
                            </div>
                            <span className="font-semibold" style={{ color: 'var(--scifi-text)' }}>{c.canal}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--scifi-text-dim)' }}>{fmt(c.enviados)}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--scifi-text-dim)' }}>{fmt(c.abiertos)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div className="h-1.5 rounded-full" style={{ width: `${apertura}%`, background: col }} />
                            </div>
                            <span className="text-xs font-mono" style={{ color: col }}>{apertura}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--scifi-text-dim)' }}>{fmt(c.clicks)}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: PURPLE }}>{ctr}%</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: WARN }}>{fmt(c.conversiones)}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold" style={{ color: NEON }}>{c.roi}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards canal highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {channelData.map((c, i) => {
              const Icon = TYPE_ICON[c.canal] || BarChart2
              const colors = [NEON, NEON2, PURPLE, PINK, ORANGE]
              const col = colors[i]
              const apertura = ((c.abiertos / c.enviados) * 100).toFixed(1)
              return (
                <div key={c.canal} className="card p-4" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${col}14`, border: `1px solid ${col}30` }}>
                      <Icon className="w-4 h-4" style={{ color: col }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--scifi-text)' }}>{c.canal}</p>
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color: col }}>{c.roi}%</p>
                  <p className="text-[10px] mb-3" style={{ color: 'var(--scifi-text-muted)' }}>ROI</p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span style={{ color: 'var(--scifi-text-muted)' }}>Apertura</span><span style={{ color: 'var(--scifi-text-dim)' }}>{apertura}%</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--scifi-text-muted)' }}>Conversiones</span><span style={{ color: 'var(--scifi-text-dim)' }}>{fmt(c.conversiones)}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--scifi-text-muted)' }}>Enviados</span><span style={{ color: 'var(--scifi-text-dim)' }}>{fmt(c.enviados)}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
