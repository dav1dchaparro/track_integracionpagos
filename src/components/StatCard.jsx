import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

const COLORS = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',     icon: 'text-blue-600 dark:text-blue-400',     stroke: '#3b82f6' },
  green:  { bg: 'bg-brand-50 dark:bg-brand-900/20',   icon: 'text-brand-600 dark:text-brand-400',   stroke: '#16a34a' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', stroke: '#8b5cf6' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400', stroke: '#f59e0b' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',       icon: 'text-red-600 dark:text-red-400',       stroke: '#ef4444' },
  cyan:   { bg: 'bg-cyan-50 dark:bg-cyan-900/20',     icon: 'text-cyan-600 dark:text-cyan-400',     stroke: '#06b6d4' },
  pink:   { bg: 'bg-pink-50 dark:bg-pink-900/20',     icon: 'text-pink-600 dark:text-pink-400',     stroke: '#ec4899' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600 dark:text-indigo-400', stroke: '#6366f1' },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-900/20',     icon: 'text-teal-600 dark:text-teal-400',     stroke: '#14b8a6' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'text-yellow-600 dark:text-yellow-400', stroke: '#eab308' },
}

export default function StatCard({
  title, value, change, changeLabel, changeUnit = '%',
  icon: Icon, color = 'blue', sparkline,
  inverseTrend = false, onClick, animDelay = 0,
}) {
  const isPositive = change >= 0
  const isGood = inverseTrend ? !isPositive : isPositive
  const c = COLORS[color] || COLORS.blue
  const gradientId = `spark-${title.replace(/[^a-z0-9]/gi, '').toLowerCase()}`

  return (
    <div
      onClick={onClick}
      className={`card p-5 group animate-fade-in-up ${onClick ? 'card-interactive' : ''}`}
      style={{ animationDelay: `${animDelay}ms`, animationFillMode: 'both' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate pr-2">
          {title}
        </p>
        <div className="flex items-center gap-1.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${c.bg} ${c.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
          {onClick && (
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          )}
        </div>
      </div>

      {/* Value + sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {isPositive
              ? <TrendingUp className={`w-3.5 h-3.5 flex-shrink-0 ${isGood ? 'text-brand-500' : 'text-red-500'}`} />
              : <TrendingDown className={`w-3.5 h-3.5 flex-shrink-0 ${isGood ? 'text-brand-500' : 'text-red-500'}`} />
            }
            <span className={`text-xs font-bold ${isGood ? 'text-brand-600 dark:text-brand-400' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{change}{changeUnit}
            </span>
            {changeLabel && (
              <span className="text-xs text-gray-400 truncate">{changeLabel}</span>
            )}
          </div>
        </div>

        {sparkline && (
          <div className="w-20 h-10 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c.stroke} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={c.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone" dataKey="v"
                  stroke={c.stroke} strokeWidth={1.5}
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
