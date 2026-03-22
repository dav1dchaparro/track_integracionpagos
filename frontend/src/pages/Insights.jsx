import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '../context/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Sparkles, TrendingUp, AlertTriangle, ShieldCheck,
  Package, ShoppingCart, RefreshCw, Send, Info, CheckCircle2,
  ArrowDownCircle, Brain, Bell, BarChart3, Boxes,
} from 'lucide-react'

// ── Palette ──────────────────────────────────────────────────────────────────
const NEON   = '#00e676'
const NEON2  = '#00b8d9'
const WARN   = '#fbbf24'
const DANGER = '#f87171'
const PURPLE = '#a78bfa'

const ALERT_META = {
  success: { icon: CheckCircle2, color: NEON,   bg: 'rgba(0,230,118,0.08)',  border: 'rgba(0,230,118,0.25)' },
  warning: { icon: AlertTriangle, color: WARN,   bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' },
  info:    { icon: Info,          color: NEON2,   bg: 'rgba(0,184,217,0.08)',  border: 'rgba(0,184,217,0.25)' },
  danger:  { icon: ShieldCheck,   color: DANGER,  bg: 'rgba(248,113,113,0.08)',border: 'rgba(248,113,113,0.25)' },
}

function confidenceColor(c) {
  if (c >= 80) return NEON
  if (c >= 60) return WARN
  return DANGER
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Insights() {
  /* ---------- state ---------- */
  const [briefing, setBriefing]           = useState(null)
  const [briefingLoading, setBriefingLoading] = useState(true)

  const [alerts, setAlerts]               = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  const [recommendations, setRecommendations] = useState(null)
  const [recsLoading, setRecsLoading]     = useState(true)

  const [stock, setStock]                 = useState([])
  const [stockLoading, setStockLoading]   = useState(true)

  // Chat state (preserved from original)
  const [chatMessages, setChatMessages]   = useState([
    { role: 'assistant', text: '¡Hola! Soy tu asistente de ventas. Pregúntame sobre tus datos, tendencias o qué hacer para vender más.' }
  ])
  const [chatInput, setChatInput]         = useState('')
  const [chatLoading, setChatLoading]     = useState(false)
  const [chatPeriod, setChatPeriod]       = useState('month')
  const chatEndRef                        = useRef(null)

  /* ---------- fetch data on mount ---------- */
  useEffect(() => {
    apiFetch('/insights/briefing')
      .then(d => setBriefing(d.briefing))
      .catch(() => setBriefing('No se pudo cargar el briefing.'))
      .finally(() => setBriefingLoading(false))

    apiFetch('/insights/alerts')
      .then(d => setAlerts(d.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setAlertsLoading(false))

    apiFetch('/forecasting/recommendations')
      .then(d => setRecommendations(d))
      .catch(() => setRecommendations(null))
      .finally(() => setRecsLoading(false))

    apiFetch('/forecasting/stock')
      .then(d => setStock(d || []))
      .catch(() => setStock([]))
      .finally(() => setStockLoading(false))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  /* ---------- chat handler ---------- */
  const handleChatSend = async (overrideQuestion) => {
    const q = (overrideQuestion ?? chatInput).trim()
    if (!q || chatLoading) return
    setChatInput('')
    const updatedMessages = [...chatMessages, { role: 'user', text: q }]
    setChatMessages(updatedMessages)
    setChatLoading(true)
    try {
      const history = updatedMessages
        .slice(1, -1)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))
      const res = await apiFetch('/insights/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, period: chatPeriod, history }),
      })
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.answer }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error al conectar con el asistente. Intenta de nuevo.' }])
    }
    setChatLoading(false)
  }

  /* ---------- derived ---------- */
  const recs = recommendations?.recommendations || []
  const chartData = recs.slice(0, 8).map(r => ({
    name: r.product_name.length > 14 ? r.product_name.slice(0, 12) + '...' : r.product_name,
    demand: r.predicted_demand_7d,
    stock: r.current_stock,
    purchase: r.recommended_purchase,
  }))

  // ── Skeleton loader ──
  const Skeleton = ({ width = '100%', height = 16, style = {} }) => (
    <div
      className="rounded animate-pulse"
      style={{
        width, height, background: 'var(--scifi-border)', opacity: 0.5,
        ...style,
      }}
    />
  )

  /* ========================================================================= */
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', boxShadow: '0 0 16px rgba(0,230,118,0.15)' }}
        >
          <Sparkles className="w-5 h-5" style={{ color: NEON }} />
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--scifi-text)' }}>
          Insights &amp; Forecasting
        </h1>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse"
          style={{ background: 'rgba(0,230,118,0.1)', color: NEON, border: '1px solid rgba(0,230,118,0.25)' }}
        >
          IA Live
        </span>
      </div>

      {/* ================================================================== */}
      {/* 1. AI BRIEFING                                                      */}
      {/* ================================================================== */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(0,230,118,0.06) 0%, var(--scifi-card) 60%)',
          border: '1px solid rgba(0,230,118,0.2)',
          boxShadow: '0 0 30px rgba(0,230,118,0.05)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5" style={{ color: NEON }} />
          <h2 className="font-bold text-base" style={{ color: 'var(--scifi-text)' }}>Briefing del Día</h2>
        </div>
        {briefingLoading ? (
          <div className="space-y-2">
            <Skeleton height={14} width="90%" />
            <Skeleton height={14} width="70%" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--scifi-text-dim)' }}>
            {briefing}
          </p>
        )}
      </div>

      {/* ================================================================== */}
      {/* 2. SMART ALERTS                                                     */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4" style={{ color: WARN }} />
          <h2 className="font-bold text-base" style={{ color: 'var(--scifi-text)' }}>Alertas Inteligentes</h2>
        </div>
        {alertsLoading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[1,2].map(i => (
              <div key={i} className="rounded-xl p-4" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
                <Skeleton height={14} width="60%" style={{ marginBottom: 8 }} />
                <Skeleton height={12} width="85%" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div
            className="rounded-xl p-5 text-center"
            style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}
          >
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: NEON, opacity: 0.6 }} />
            <p className="text-sm" style={{ color: 'var(--scifi-text-muted)' }}>Sin alertas activas. ¡Todo marcha bien!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {alerts.map((alert, i) => {
              const meta = ALERT_META[alert.level] || ALERT_META.info
              const Icon = meta.icon
              return (
                <div
                  key={i}
                  className="rounded-xl p-4 flex gap-3"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${meta.color}15` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: meta.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold mb-0.5" style={{ color: meta.color }}>{alert.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--scifi-text-dim)' }}>{alert.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 3. FORECASTING / PURCHASE RECOMMENDATIONS                          */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: PURPLE }} />
            <h2 className="font-bold text-base" style={{ color: 'var(--scifi-text)' }}>Pronóstico y Compras Sugeridas</h2>
          </div>
          {recommendations && (
            <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'var(--scifi-surface)', color: 'var(--scifi-text-muted)', border: '1px solid var(--scifi-border)' }}>
              Método: {recommendations.method === 'xgboost' ? 'XGBoost ML' : 'Promedio Móvil'}
            </span>
          )}
        </div>

        {recsLoading ? (
          <div className="rounded-xl p-5" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton width={24} height={24} style={{ borderRadius: 8, flexShrink: 0 }} />
                  <div className="flex-1 space-y-1">
                    <Skeleton height={14} width="50%" />
                    <Skeleton height={10} width="30%" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !recommendations || recs.length === 0 ? (
          <div
            className="rounded-xl p-5 text-center"
            style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}
          >
            <Package className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--scifi-text-muted)', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--scifi-text-muted)' }}>
              No hay suficientes datos de ventas para generar pronósticos aún. Sigue vendiendo y vuelve pronto.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart: demand vs stock */}
            {chartData.length > 0 && (
              <div
                className="rounded-xl p-5"
                style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4" style={{ color: NEON2 }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--scifi-text)' }}>Demanda Prevista vs Stock Actual</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--scifi-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--scifi-text-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--scifi-text-muted)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)', borderRadius: 8, color: 'var(--scifi-text)' }}
                    />
                    <Bar dataKey="demand" name="Demanda prevista" fill={PURPLE} radius={[4,4,0,0]} fillOpacity={0.85} />
                    <Bar dataKey="stock" name="Stock actual" fill={NEON2} radius={[4,4,0,0]} fillOpacity={0.7} />
                    <Bar dataKey="purchase" name="Compra sugerida" fill={NEON} radius={[4,4,0,0]} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recommendations table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ color: 'var(--scifi-text)' }}>
                  <thead>
                    <tr style={{ background: 'var(--scifi-surface)' }}>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--scifi-text-muted)' }}>Producto</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--scifi-text-muted)' }}>Demanda Semanal</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--scifi-text-muted)' }}>Predicción</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--scifi-text-muted)' }}>Stock</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--scifi-text-muted)' }}>Comprar</th>
                      <th className="text-center text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--scifi-text-muted)' }}>Confianza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.map((r, i) => {
                      const urgency = r.recommended_purchase > 0
                      return (
                        <tr
                          key={r.product_id}
                          className="transition-colors"
                          style={{
                            borderTop: '1px solid var(--scifi-border)',
                            background: i % 2 === 0 ? 'transparent' : 'var(--scifi-surface)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,230,118,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--scifi-surface)'}
                        >
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {urgency && <ArrowDownCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: WARN }} />}
                              <span className="truncate max-w-[180px]">{r.product_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--scifi-text-dim)' }}>
                            {r.predicted_demand_7d}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: PURPLE }}>
                            {r.predicted_demand_7d.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums" style={{ color: r.current_stock <= 0 ? DANGER : 'var(--scifi-text-dim)' }}>
                            {r.current_stock}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {r.recommended_purchase > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md"
                                style={{ background: 'rgba(0,230,118,0.1)', color: NEON, border: '1px solid rgba(0,230,118,0.25)' }}
                              >
                                <ShoppingCart className="w-3 h-3" />
                                {r.recommended_purchase}
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--scifi-text-muted)' }}>OK</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--scifi-surface)' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${r.confidence}%`,
                                    background: confidenceColor(r.confidence),
                                    boxShadow: `0 0 4px ${confidenceColor(r.confidence)}60`,
                                  }}
                                />
                              </div>
                              <span className="text-[11px] tabular-nums font-semibold" style={{ color: confidenceColor(r.confidence) }}>
                                {r.confidence}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {recommendations.generated_at && (
                <div className="px-4 py-2 text-right" style={{ borderTop: '1px solid var(--scifi-border)' }}>
                  <span className="text-[10px]" style={{ color: 'var(--scifi-text-muted)' }}>
                    Generado: {new Date(recommendations.generated_at).toLocaleString('es-MX')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 4. STOCK OVERVIEW                                                   */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Boxes className="w-4 h-4" style={{ color: NEON2 }} />
          <h2 className="font-bold text-base" style={{ color: 'var(--scifi-text)' }}>Inventario Actual</h2>
          <button
            className="ml-auto text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all"
            style={{ background: 'var(--scifi-surface)', color: 'var(--scifi-text-muted)', border: '1px solid var(--scifi-border)' }}
            onClick={() => {
              setStockLoading(true)
              apiFetch('/forecasting/stock')
                .then(d => setStock(d || []))
                .catch(() => {})
                .finally(() => setStockLoading(false))
            }}
          >
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
        </div>

        {stockLoading ? (
          <div className="rounded-xl p-5" style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}>
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <Skeleton key={i} height={14} width={`${70 - i * 10}%`} />
              ))}
            </div>
          </div>
        ) : stock.length === 0 ? (
          <div
            className="rounded-xl p-5 text-center"
            style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}
          >
            <Boxes className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--scifi-text-muted)', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--scifi-text-muted)' }}>
              No hay datos de inventario registrados. Usa la API de stock para agregar niveles.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ color: 'var(--scifi-text)' }}>
                <thead>
                  <tr style={{ background: 'var(--scifi-surface)' }}>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--scifi-text-muted)' }}>Producto</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--scifi-text-muted)' }}>Stock</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--scifi-text-muted)' }}>Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((s, i) => (
                    <tr
                      key={s.product_id}
                      className="transition-colors"
                      style={{
                        borderTop: '1px solid var(--scifi-border)',
                        background: i % 2 === 0 ? 'transparent' : 'var(--scifi-surface)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,184,217,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--scifi-surface)'}
                    >
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.current_stock <= 5 ? DANGER : NEON2 }} />
                          <span>{s.product_name}</span>
                          {s.current_stock <= 5 && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                              style={{ background: 'rgba(248,113,113,0.1)', color: DANGER, border: '1px solid rgba(248,113,113,0.25)' }}
                            >
                              Bajo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: s.current_stock <= 5 ? DANGER : 'var(--scifi-text)' }}>
                        {s.current_stock}
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--scifi-text-muted)' }}>
                        {s.updated_at ? new Date(s.updated_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 5. AI CHAT (preserved from original)                                */}
      {/* ================================================================== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--scifi-card)', border: '1px solid var(--scifi-border)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--scifi-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)' }}>
              <Sparkles className="w-4 h-4" style={{ color: NEON }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--scifi-text)' }}>Asistente IA</p>
              <p className="text-[11px]" style={{ color: 'var(--scifi-text-muted)' }}>Powered by Groq</p>
            </div>
          </div>
          <select
            value={chatPeriod}
            onChange={e => setChatPeriod(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg outline-none"
            style={{ background: 'var(--scifi-surface)', color: 'var(--scifi-text)', border: '1px solid var(--scifi-border)' }}
          >
            <option value="today">Hoy</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
          </select>
        </div>

        <div className="h-72 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--scifi-bg)' }}>
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: msg.role === 'user' ? 'rgba(0,184,217,0.15)' : 'rgba(0,230,118,0.15)',
                  color: msg.role === 'user' ? NEON2 : NEON,
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,184,217,0.3)' : 'rgba(0,230,118,0.3)'}`,
                }}
              >
                {msg.role === 'user' ? 'Tú' : 'IA'}
              </div>
              <div
                className="max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.role === 'user' ? 'rgba(0,184,217,0.08)' : 'var(--scifi-surface)',
                  color: 'var(--scifi-text)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,184,217,0.2)' : 'var(--scifi-border)'}`,
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold" style={{ background: 'rgba(0,230,118,0.15)', color: NEON, border: '1px solid rgba(0,230,118,0.3)' }}>IA</div>
              <div className="rounded-xl px-3 py-2" style={{ background: 'var(--scifi-surface)', border: '1px solid var(--scifi-border)' }}>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: NEON, animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {chatMessages.length <= 1 && (
          <div className="px-3 pt-2 pb-0 flex flex-wrap gap-2 border-t" style={{ borderColor: 'var(--scifi-border)' }}>
            {[
              '¿Cuál es mi producto más vendido?',
              '¿Cómo puedo vender más este período?',
              '¿Qué método de pago prefieren mis clientes?',
              '¿Cuáles son mis horas pico de ventas?',
            ].map(q => (
              <button
                key={q}
                onClick={() => handleChatSend(q)}
                disabled={chatLoading}
                className="text-[11px] px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 hover:opacity-80"
                style={{ background: 'rgba(0,230,118,0.08)', color: NEON, border: '1px solid rgba(0,230,118,0.2)' }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="p-3 flex gap-2 border-t" style={{ borderColor: 'var(--scifi-border)' }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChatSend()}
            placeholder="Pregunta sobre tus ventas..."
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--scifi-surface)', color: 'var(--scifi-text)', border: '1px solid var(--scifi-border)' }}
          />
          <button
            onClick={() => handleChatSend()}
            disabled={chatLoading || !chatInput.trim()}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: 'rgba(0,230,118,0.15)', color: NEON, border: '1px solid rgba(0,230,118,0.3)' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  )
}
