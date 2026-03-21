import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

const COLORS = {
  blue:   { bg: 'rgba(56,189,248,0.1)',   icon: '#38bdf8', stroke: '#38bdf8' },
  green:  { bg: 'rgba(0,230,118,0.1)',    icon: '#00e676', stroke: '#00e676' },
  purple: { bg: 'rgba(167,139,250,0.1)',  icon: '#a78bfa', stroke: '#a78bfa' },
  orange: { bg: 'rgba(251,191,36,0.1)',   icon: '#fbbf24', stroke: '#fbbf24' },
  red:    { bg: 'rgba(248,113,113,0.1)',  icon: '#f87171', stroke: '#f87171' },
  cyan:   { bg: 'rgba(34,211,238,0.1)',   icon: '#22d3ee', stroke: '#22d3ee' },
  pink:   { bg: 'rgba(244,114,182,0.1)',  icon: '#f472b6', stroke: '#f472b6' },
  indigo: { bg: 'rgba(129,140,248,0.1)',  icon: '#818cf8', stroke: '#818cf8' },
  teal:   { bg: 'rgba(45,212,191,0.1)',   icon: '#2dd4bf', stroke: '#2dd4bf' },
  yellow: { bg: 'rgba(250,204,21,0.1)',   icon: '#facc15', stroke: '#facc15' },
}

export default function StatCard({
  title, value, change, changeLabel, changeUnit = '%',
  icon: Icon, color = 'green', sparkline,
  inverseTrend = false, onClick, animDelay = 0,
}) {
  const isPositive = change >= 0
  const isGood = inverseTrend ? !isPositive : isPositive
  const c = COLORS[color] || COLORS.green
  const gradientId = `spark-${title.replace(/[^a-z0-9]/gi, '').toLowerCase()}`
  const trendColor = isGood ? '#00e676' : '#f87171'

  return (
    <div
      onClick={onClick}
      className={`card p-5 group animate-fade-in-up ${onClick ? 'card-interactive' : ''}`}
      style={{ animationDelay: `${animDelay}ms`, animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-bold uppercase tracking-widest truncate pr-2"
          style={{ color: 'var(--scifi-text-muted)', letterSpacing: '0.1em' }}
        >
          {title}
        </p>
        <div className="flex items-center gap-1.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
            style={{ background: c.bg }}
          >
            <Icon className="w-4 h-4" style={{ color: c.icon }} />
          </div>
          {onClick && (
            <ArrowUpRight
              className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ color: '#00e676' }}
            />
          )}
        </div>
      </div>

      {/* Value + sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none" style={{ color: 'var(--scifi-text)' }}>
            {value}
          </p>
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {isPositive
              ? <TrendingUp  className="w-3.5 h-3.5 flex-shrink-0" style={{ color: trendColor }} />
              : <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: trendColor }} />
            }
            <span className="text-xs font-bold" style={{ color: trendColor }}>
              {isPositive ? '+' : ''}{change}{changeUnit}
            </span>
            {changeLabel && (
              <span className="text-xs truncate" style={{ color: 'var(--scifi-text-muted)' }}>
                {changeLabel}
              </span>
            )}
          </div>
        </div>

        {sparkline && (
          <div className="w-20 h-10 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c.stroke} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={c.stroke} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone" dataKey="v"
                  stroke={c.stroke} strokeWidth={1.8}
                  fill={`url(#${gradientId})`}
                  dot={false} isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function StatCardSkeleton({ delay = 0 }) {
  return (
    <div
      className="card p-5 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton w-8 h-8 rounded-xl" />
      </div>
      <div className="skeleton h-7 w-24 rounded mb-2" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  )
}
