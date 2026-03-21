import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Area, ComposedChart,
} from 'recharts'
import {
  DollarSign, ShoppingCart, Target, TrendingUp,
  Medal, Trophy, Star, CheckCircle, Clock, XCircle,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Per-seller mock data ─────────────────────────────────────────────────────
const SELLER_DATA = {
  2: {
    weekly: [
      { d: 'Lun', v: 8200 }, { d: 'Mar', v: 9100 }, { d: 'Mié', v: 7800 },
      { d: 'Jue', v: 10200 }, { d: 'Vie', v: 9600 }, { d: 'Sáb', v: 11200 }, { d: 'Dom', v: 6900 },
    ],
    orders: [
      { id: '#4521', client: 'Tech Solutions SL',  amount: 1250, status: 'Completado', date: '21 Mar' },
      { id: '#4520', client: 'Global Markets SA',  amount: 890,  status: 'En proceso',  date: '21 Mar' },
      { id: '#4518', client: 'Innovate Corp',      amount: 2100, status: 'Completado', date: '20 Mar' },
      { id: '#4515', client: 'Prime Industries',   amount: 650,  status: 'Completado', date: '19 Mar' },
      { id: '#4512', client: 'NextGen Ltd',        amount: 1800, status: 'Cancelado',  date: '18 Mar' },
    ],
  },
  3: {
    weekly: [
      { d: 'Lun', v: 5200 }, { d: 'Mar', v: 6100 }, { d: 'Mié', v: 5800 },
      { d: 'Jue', v: 7200 }, { d: 'Vie', v: 6600 }, { d: 'Sáb', v: 7800 }, { d: 'Dom', v: 5900 },
    ],
    orders: [
      { id: '#4522', client: 'Digital Wave Inc',  amount: 980,  status: 'Completado', date: '21 Mar' },
      { id: '#4519', client: 'SmartBiz SL',       amount: 720,  status: 'En proceso',  date: '20 Mar' },
      { id: '#4516', client: 'Apex Solutions',    amount: 1450, status: 'Completado', date: '20 Mar' },
      { id: '#4513', client: 'FutureTech',        amount: 560,  status: 'Completado', date: '19 Mar' },
      { id: '#4510', client: 'MarketPro SA',      amount: 890,  status: 'Cancelado',  date: '18 Mar' },
    ],
  },
  4: {
    weekly: [
      { d: 'Lun', v: 9800 }, { d: 'Mar', v: 11200 }, { d: 'Mié', v: 10100 },
      { d: 'Jue', v: 12800 }, { d: 'Vie', v: 11600 }, { d: 'Sáb', v: 13400 }, { d: 'Dom', v: 8900 },
    ],
    orders: [
      { id: '#4523', client: 'Enterprise Group',    amount: 3200, status: 'Completado', date: '21 Mar' },
      { id: '#4521', client: 'NorthStar Ltd',       amount: 1850, status: 'En proceso',  date: '21 Mar' },
      { id: '#4517', client: 'Vision Corp',         amount: 2750, status: 'Completado', date: '20 Mar' },
      { id: '#4514', client: 'Alpha Partners',      amount: 1200, status: 'Completado', date: '19 Mar' },
      { id: '#4511', client: 'Premium Solutions',   amount: 4100, status: 'En proceso',  date: '18 Mar' },
    ],
  },
}

const DEFAULT_DATA = {
  weekly: [
    { d: 'Lun', v: 1200 }, { d: 'Mar', v: 900 }, { d: 'Mié', v: 1500 },
    { d: 'Jue', v: 800 }, { d: 'Vie', v: 1100 }, { d: 'Sáb', v: 600 }, { d: 'Dom', v: 400 },
  ],
  orders: [],
}

const STATUS_CFG = {
  Completado: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 text-green-700' },
  'En proceso': { icon: Clock,       color: 'text-blue-600',  bg: 'bg-blue-50 text-blue-700'   },
  Cancelado:  { icon: XCircle,     color: 'text-red-500',   bg: 'bg-red-50 text-red-700'     },
}

const RANK_ICONS = ['🥇', '🥈', '🥉']

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function WeeklyTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-gray-700">{label}</p>
      <p className="text-green-600 font-semibold mt-0.5">${payload[0].value.toLocaleString()}</p>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function MyKpiCard({ title, value, change, icon: Icon, color }) {
  const up = change >= 0
  return (
    <div className="card p-5 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
          {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(change)}%
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
      </div>
    </div>
  )
}

// ─── Goal progress ────────────────────────────────────────────────────────────
function GoalProgress({ goal }) {
  const pct = Math.min(goal, 100)
  const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const msg   = pct >= 90 ? '🔥 ¡Increíble ritmo!' : pct >= 70 ? '💪 Vas muy bien' : pct >= 50 ? '📈 Sigue empujando' : '⚡ ¡Acelera!'

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Meta mensual</h3>
        </div>
        <span className="text-xs text-gray-400">Marzo 2026</span>
      </div>

      <div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{pct}%</span>
          <span className="text-xs font-medium text-gray-500">de $66.7K objetivo</span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
          />
        </div>
        <p className="text-xs font-semibold mt-2" style={{ color }}>{msg}</p>
      </div>
    </div>
  )
}

// ─── Team ranking ─────────────────────────────────────────────────────────────
function TeamRanking({ sellers, currentUserId }) {
  const sorted = [...sellers].sort((a, b) => (b.stats?.revenue || 0) - (a.stats?.revenue || 0))

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Medal className="w-4 h-4 text-brand-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Ranking del equipo</h3>
      </div>

      <div className="space-y-2.5">
        {sorted.map((s, i) => {
          const isMe = s.id === currentUserId
          const pct  = sorted[0].stats?.revenue ? Math.round((s.stats.revenue / sorted[0].stats.revenue) * 100) : 0

          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                isMe ? 'bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800' : ''
              }`}
            >
              <span className="text-lg w-6 flex-shrink-0">{RANK_ICONS[i] ?? `#${i + 1}`}</span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: isMe ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}
              >
                {s.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                  {s.name} {isMe && <span className="text-green-600 font-bold">(tú)</span>}
                </p>
                <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-1">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: isMe ? 'linear-gradient(90deg, #22c55e, #16a34a)' : '#94a3b8',
                    }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
                ${(s.stats?.revenue || 0).toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SellerDashboard() {
  const { user, sellers } = useAuth()
  const data = SELLER_DATA[user?.id] || DEFAULT_DATA
  const stats = user?.stats || { revenue: 0, orders: 0, conversion: 0, ticket: 0, goal: 0 }

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayRevenue = data.weekly[data.weekly.length - 1]?.v || 0

  const kpis = [
    { title: 'Revenue del mes',      value: `$${(stats.revenue / 1000).toFixed(0)}K`, change: 8.2,  icon: DollarSign,  color: 'green'  },
    { title: 'Mis órdenes',          value: stats.orders,                              change: 5.1,  icon: ShoppingCart,color: 'blue'   },
    { title: 'Tasa de conversión',   value: `${stats.conversion}%`,                   change: 1.3,  icon: Target,      color: 'purple' },
    { title: 'Ticket promedio',      value: `$${stats.ticket}`,                       change: -0.8, icon: TrendingUp,  color: 'amber'  },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 space-y-5 flex-1">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Hola, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="card px-4 py-2.5 flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-[10px] text-gray-400 leading-none">Hoy</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">${todayRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="card px-4 py-2.5 flex items-center gap-2.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user?.department}</p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => <MyKpiCard key={k.title} {...k} />)}
        </div>

        {/* Middle row: chart + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Weekly chart */}
          <div className="card p-5 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Mis ventas — esta semana</h3>
              <span className="badge-green">Live</span>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.weekly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<WeeklyTip />} />
                  <Area type="monotone" dataKey="v" fill="url(#sg)" stroke="none" />
                  <LineChart>
                    <Line type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                  <Bar dataKey="v" fill="#16a34a" opacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={32} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Goal + Ranking */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <GoalProgress goal={stats.goal} />
            <TeamRanking sellers={sellers} currentUserId={user?.id} />
          </div>
        </div>

        {/* Recent orders */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Mis últimas órdenes</h3>
            <span className="text-xs text-gray-400">{data.orders.length} órdenes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  {['ID', 'Cliente', 'Monto', 'Estado', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.orders.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Sin órdenes registradas aún</td></tr>
                ) : data.orders.map(o => {
                  const cfg = STATUS_CFG[o.status] || STATUS_CFG['En proceso']
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{o.id}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{o.client}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">${o.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${cfg.bg}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{o.date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
