import { useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import {
  ShoppingCart, RefreshCw, XCircle, Star, Package,
  Users, Clock, Store, CreditCard, ArrowUp, ArrowDown,
  Award, AlertTriangle, TrendingUp, UserCheck,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────────────────────

const MOVEMENT_TYPES = [
  { name: 'Compra contado',   value: 4823, color: '#22c55e', pct: 38.2 },
  { name: 'Compra en cuotas', value: 5212, color: '#3b82f6', pct: 41.3 },
  { name: 'Nota de crédito',  value: 897,  color: '#8b5cf6', pct: 7.1  },
  { name: 'Canje/Descuento',  value: 779,  color: '#06b6d4', pct: 6.2  },
  { name: 'Devolución',       value: 412,  color: '#f59e0b', pct: 3.3  },
  { name: 'Cancelación',      value: 289,  color: '#ef4444', pct: 2.3  },
]

const CUSTOMER_SEGMENTS = [
  { segment: 'VIP',       clientes: 234,  monto: 528000, ticket: 4234, color: '#f59e0b' },
  { segment: 'Premium',   clientes: 456,  monto: 364000, ticket: 3280, color: '#8b5cf6' },
  { segment: 'Regular',   clientes: 1823, monto: 218000, ticket: 1820, color: '#3b82f6' },
  { segment: 'Ocasional', clientes: 2341, monto: 82000,  ticket: 820,  color: '#22c55e' },
  { segment: 'Nuevo',     clientes: 892,  monto: 34000,  ticket: 380,  color: '#06b6d4' },
]

const PAYMENT_METHODS = [
  { name: 'Tarjeta Crédito',   value: 5823, color: '#3b82f6' },
  { name: 'Tarjeta Débito',    value: 3234, color: '#22c55e' },
  { name: 'Transferencia',     value: 2234, color: '#8b5cf6' },
  { name: 'Efectivo',          value: 1089, color: '#f59e0b' },
  { name: 'Billetera Digital', value: 897,  color: '#06b6d4' },
]

const CARD_ISSUERS = [
  { name: 'VISA',       value: 5234, color: '#2563eb', pct: 41.2 },
  { name: 'Mastercard', value: 3891, color: '#dc2626', pct: 30.6 },
  { name: 'AMEX',       value: 1823, color: '#0891b2', pct: 14.4 },
  { name: 'Naranja',    value: 892,  color: '#ea580c', pct: 7.0  },
  { name: 'Cabal',      value: 412,  color: '#7c3aed', pct: 3.2  },
  { name: 'Otras',      value: 460,  color: '#9ca3af', pct: 3.6  },
]

const INSTALLMENTS = [
  { cuotas: '1',  label: '1 cuota',   cantidad: 4823, pct: 38 },
  { cuotas: '3',  label: '3 cuotas',  cantidad: 2134, pct: 17 },
  { cuotas: '6',  label: '6 cuotas',  cantidad: 2891, pct: 23 },
  { cuotas: '12', label: '12 cuotas', cantidad: 1623, pct: 13 },
  { cuotas: '18', label: '18 cuotas', cantidad: 892,  pct: 7  },
  { cuotas: '24', label: '24 cuotas', cantidad: 256,  pct: 2  },
]

const DAYS  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function buildHeatmap() {
  const seed = [2, 1, 1, 1, 2, 4, 8, 18, 32, 44, 52, 60, 65, 62, 55, 48, 50, 58, 55, 42, 30, 18, 10, 5]
  return DAYS.flatMap((day, di) =>
    HOURS.map(hour => {
      const base = seed[hour] ?? 5
      const dayFactor = di < 5 ? 1.2 : di === 5 ? 0.8 : 0.35
      const noise = 0.75 + Math.random() * 0.5
      return { day, hour, value: Math.min(100, Math.round(base * dayFactor * noise)) }
    })
  )
}
const HEATMAP = buildHeatmap()

const SELLERS_DATA = [
  { nombre: 'Ana García',   ventas: 2341, monto: 9364000, ticket: 4000, dev: 23, conv: 68, sucursal: 'Casa Central' },
  { nombre: 'Carlos Ruiz',  ventas: 1823, monto: 7292000, ticket: 4000, dev: 41, conv: 54, sucursal: 'Palermo'      },
  { nombre: 'María López',  ventas: 1634, monto: 6536000, ticket: 4000, dev: 18, conv: 72, sucursal: 'Online'       },
  { nombre: 'Pedro Silva',  ventas: 1234, monto: 4936000, ticket: 4000, dev: 56, conv: 48, sucursal: 'Belgrano'     },
  { nombre: 'Lucía Torres', ventas: 892,  monto: 3568000, ticket: 4000, dev: 12, conv: 63, sucursal: 'Recoleta'     },
  { nombre: 'Martín Díaz',  ventas: 756,  monto: 3024000, ticket: 4000, dev: 34, conv: 51, sucursal: 'San Isidro'   },
]

const BRANCHES_DATA = [
  { sucursal: 'Casa Central', monto: 19292000, ventas: 4823 },
  { sucursal: 'Online',       monto: 13648000, ventas: 3412 },
  { sucursal: 'Palermo',      monto: 11564000, ventas: 2891 },
  { sucursal: 'Recoleta',     monto: 8536000,  ventas: 2134 },
  { sucursal: 'Belgrano',     monto: 7292000,  ventas: 1823 },
  { sucursal: 'San Isidro',   monto: 4988000,  ventas: 1247 },
]

const STAR_PRODUCTS = [
  { nombre: 'MacBook Pro 16"',     categoria: 'Electrónica',  unidades: 234,  monto: 5616000,  crecimiento: 12 },
  { nombre: 'iPhone 15 Pro Max',   categoria: 'Electrónica',  unidades: 456,  monto: 4104000,  crecimiento: 8  },
  { nombre: 'PlayStation 5',       categoria: 'Gaming',       unidades: 189,  monto: 2268000,  crecimiento: 31 },
  { nombre: 'AirPods Pro 2',       categoria: 'Electrónica',  unidades: 823,  monto: 1646000,  crecimiento: 23 },
  { nombre: 'Samsung 65" QLED',    categoria: 'Electrónica',  unidades: 167,  monto: 1503000,  crecimiento: 5  },
  { nombre: 'Nike Air Max 270',    categoria: 'Indumentaria', unidades: 1234, monto: 1234000,  crecimiento: 18 },
]

const DEAD_PRODUCTS = [
  { nombre: 'Fax HP OfficeJet 250',    categoria: 'Oficina',      stock: 12,  unidades: 0, diasSinVenta: 184 },
  { nombre: 'Impresora Matricial OKI', categoria: 'Oficina',      stock: 8,   unidades: 2, diasSinVenta: 127 },
  { nombre: 'Teléfono Fijo Panasonic', categoria: 'Telefonía',    stock: 23,  unidades: 4, diasSinVenta: 93  },
  { nombre: 'USB 2.0 Kingston 4GB',    categoria: 'Accesorios',   stock: 147, unidades: 6, diasSinVenta: 78  },
  { nombre: 'DVD Player Samsung',      categoria: 'Electrónica',  stock: 19,  unidades: 3, diasSinVenta: 64  },
  { nombre: 'Cámara Fujifilm FinePix', categoria: 'Fotografía',   stock: 7,   unidades: 1, diasSinVenta: 55  },
]

const RETURNS_DATA = [
  { motivo: 'Producto defectuoso',     cantidad: 156, monto: 624000 },
  { motivo: 'No corresponde descrip.', cantidad: 98,  monto: 392000 },
  { motivo: 'Cambio de opinión',       cantidad: 87,  monto: 348000 },
  { motivo: 'Talla/medida incorrecta', cantidad: 76,  monto: 304000 },
  { motivo: 'Demora en entrega',       cantidad: 43,  monto: 172000 },
  { motivo: 'Pedido duplicado',        cantidad: 23,  monto: 92000  },
]

const FREQUENT_CUSTOMERS = [
  { nombre: 'Roberto Sánchez',  compras: 47, monto: 564000, ticket: 12000, ultima: '20 mar', segmento: 'VIP'     },
  { nombre: 'Patricia Morales', compras: 38, monto: 456000, ticket: 12000, ultima: '21 mar', segmento: 'VIP'     },
  { nombre: 'Alejandro Pérez',  compras: 34, monto: 272000, ticket: 8000,  ultima: '19 mar', segmento: 'Premium' },
  { nombre: 'Gabriela Torres',  compras: 29, monto: 232000, ticket: 8000,  ultima: '18 mar', segmento: 'Premium' },
  { nombre: 'Nicolás Castro',   compras: 28, monto: 168000, ticket: 6000,  ultima: '20 mar', segmento: 'Premium' },
  { nombre: 'Valentina Ruiz',   compras: 25, monto: 200000, ticket: 8000,  ultima: '17 mar', segmento: 'Regular' },
  { nombre: 'Santiago Gómez',   compras: 23, monto: 138000, ticket: 6000,  ultima: '15 mar', segmento: 'Regular' },
  { nombre: 'Florencia López',  compras: 22, monto: 132000, ticket: 6000,  ultima: '16 mar', segmento: 'Regular' },
]

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const fmtNum  = n => new Intl.NumberFormat('es-AR').format(n)
const fmtPeso = n => '$' + new Intl.NumberFormat('es-AR').format(n)
const fmtK    = n => n >= 1_000_000
  ? `$${(n / 1_000_000).toFixed(1)}M`
  : `$${(n / 1000).toFixed(0)}K`

const SEGMENT_CLS = {
  VIP:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Premium:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Regular:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Ocasional:'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Nuevo:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

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

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────

const PERIODS = ['7D', '30D', '3M', '6M', '1A']

export default function PurchasePatterns() {
  const [period, setPeriod] = useState('30D')

  const totalTx  = MOVEMENT_TYPES.reduce((a, b) => a + b.value, 0)
  const totalDev = MOVEMENT_TYPES.find(m => m.name === 'Devolución')?.value ?? 0
  const tasaDev  = ((totalDev / totalTx) * 100).toFixed(1)

  const KPI_CARDS = [
    { label: 'Transacciones',   value: fmtNum(totalTx),  icon: ShoppingCart, color: '#3b82f6', delta: '+8.4%', up: true  },
    { label: 'Ticket Promedio', value: '$4.230',          icon: CreditCard,   color: '#22c55e', delta: '+3.2%', up: true  },
    { label: 'Tasa Devolución', value: tasaDev + '%',     icon: RefreshCw,    color: '#f59e0b', delta: '-0.8%', up: false },
    { label: 'Clientes Frec.',  value: fmtNum(1847),      icon: UserCheck,    color: '#8b5cf6', delta: '+12%',  up: true  },
    { label: 'Prod. Estrella',  value: '23',              icon: Star,         color: '#f59e0b', delta: '+2',    up: true  },
    { label: 'Cuotas Promedio', value: '6.4',             icon: TrendingUp,   color: '#06b6d4', delta: '+1.2',  up: false },
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
              <button key={p} onClick={() => setPeriod(p)}
                className={period === p ? 'tab-item-active' : 'tab-item'}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI Row ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {KPI_CARDS.map((k) => (
            <div key={k.label} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${k.color}15`, border: `1px solid ${k.color}22` }}>
                  <k.icon className="w-4 h-4" style={{ color: k.color }} />
                </div>
                <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                  k.up ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {k.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {k.delta}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── Row: Movimientos + Segmentos ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Tipos de movimiento */}
          <div className="card p-5">
            <SectionHead icon={ShoppingCart} title="Tipos de Movimiento"
              sub={`${fmtNum(totalTx)} transacciones en el período`} />
            <div className="flex items-center gap-3">
              <div className="w-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={MOVEMENT_TYPES} dataKey="value"
                      innerRadius={42} outerRadius={68}
                      paddingAngle={2} startAngle={90} endAngle={-270}>
                      {MOVEMENT_TYPES.map((m, i) => <Cell key={i} fill={m.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {MOVEMENT_TYPES.map((m) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-[11px] text-gray-600 dark:text-gray-400 flex-1 truncate">{m.name}</span>
                    <span className="text-[11px] font-semibold text-gray-900 dark:text-white tabular-nums">{fmtNum(m.value)}</span>
                    <span className="text-[10px] text-gray-400 w-9 text-right tabular-nums">{m.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Segmentación de clientes */}
          <div className="card p-5">
            <SectionHead icon={Users} title="Segmentación de Clientes"
              sub="Por comportamiento y valor de compra" color="#8b5cf6" />
            <div className="space-y-3.5">
              {CUSTOMER_SEGMENTS.map((s) => {
                const max = Math.max(...CUSTOMER_SEGMENTS.map(x => x.monto))
                const pct = (s.monto / max) * 100
                return (
                  <div key={s.segment}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${SEGMENT_CLS[s.segment]}`}>
                          {s.segment}
                        </span>
                        <span className="text-[11px] text-gray-500">{fmtNum(s.clientes)} clientes</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{fmtK(s.monto)}</span>
                        <span className="text-[10px] text-gray-400 ml-1.5">ticket {fmtPeso(s.ticket)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Row: Método de pago + Emisora + Cuotas ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Método de pago */}
          <div className="card p-5">
            <SectionHead icon={CreditCard} title="Método de Pago"
              sub="Distribución de medios de pago" color="#3b82f6" />
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={PAYMENT_METHODS} dataKey="value"
                  innerRadius={46} outerRadius={70}
                  paddingAngle={3} startAngle={90} endAngle={-270}>
                  {PAYMENT_METHODS.map((m, i) => <Cell key={i} fill={m.color} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {PAYMENT_METHODS.map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 flex-1">{m.name}</span>
                  <span className="text-[11px] font-semibold text-gray-900 dark:text-white tabular-nums">{fmtNum(m.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emisora de tarjeta */}
          <div className="card p-5">
            <SectionHead icon={CreditCard} title="Emisora de Tarjeta"
              sub="VISA · Mastercard · AMEX · otras" color="#dc2626" />
            <div className="space-y-3 mt-1">
              {CARD_ISSUERS.map((c) => (
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
          </div>

          {/* Cantidad de cuotas */}
          <div className="card p-5">
            <SectionHead icon={CreditCard} title="Cantidad de Cuotas"
              sub="Distribución de financiamiento" color="#06b6d4" />
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={INSTALLMENTS} margin={{ top: 14, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}
                  stroke="currentColor" strokeOpacity={0.06} />
                <XAxis dataKey="cuotas" tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="cantidad" name="Transacciones" fill="#06b6d4"
                  radius={[4, 4, 0, 0]} maxBarSize={36}>
                  <LabelList dataKey="pct" position="top"
                    formatter={v => `${v}%`}
                    style={{ fontSize: 9, fill: '#9ca3af' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-1 mb-1">
                  <span className="w-9 text-[10px] text-gray-400 text-right flex-shrink-0 pr-1">{day}</span>
                  <div className="flex flex-1 gap-px">
                    {HOURS.map(hour => {
                      const cell = HEATMAP.find(c => c.day === day && c.hour === hour)
                      const v = cell?.value ?? 0
                      const opacity = 0.06 + (v / 100) * 0.94
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

        {/* ── Vendedores + Sucursales ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Ranking vendedores */}
          <div className="card p-5 lg:col-span-2">
            <SectionHead icon={Users} title="Rendimiento por Vendedor"
              sub="Ventas, monto, devoluciones y conversión" color="#22c55e" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Vendedor / Sucursal', 'Transac.', 'Monto', 'Dev.', 'Conv.'].map(h => (
                      <th key={h} className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 pr-4 first:pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {SELLERS_DATA.map((s, i) => (
                    <tr key={s.nombre} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold text-gray-400 w-4">#{i + 1}</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{s.nombre}</p>
                            <p className="text-[10px] text-gray-400">{s.sucursal}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                        {fmtNum(s.ventas)}
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                        {fmtK(s.monto)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          s.dev > 40 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : s.dev > 25 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {s.dev}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-green-500"
                              style={{ width: `${s.conv}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{s.conv}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sucursales */}
          <div className="card p-5">
            <SectionHead icon={Store} title="Por Sucursal"
              sub="Monto total de ventas" color="#f59e0b" />
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={BRANCHES_DATA} layout="vertical"
                margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false}
                  stroke="currentColor" strokeOpacity={0.06} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v / 1_000_000).toFixed(0)}M`} />
                <YAxis type="category" dataKey="sucursal"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false} width={76} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="monto" name="Monto" fill="#f59e0b"
                  radius={[0, 4, 4, 0]} maxBarSize={18}>
                  <LabelList dataKey="monto" position="right"
                    formatter={fmtK}
                    style={{ fontSize: 9, fill: '#9ca3af' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Productos estrella + muertos ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Estrella */}
          <div className="card p-5">
            <SectionHead icon={Star} title="Productos Estrella"
              sub="Mayor volumen de ventas y tendencia de crecimiento" color="#f59e0b" />
            <div className="space-y-3">
              {STAR_PRODUCTS.map((p, i) => (
                <div key={p.nombre} className="flex items-center gap-3 py-1">
                  <span className="text-sm font-bold text-gray-200 dark:text-gray-700 w-5 flex-shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.nombre}</p>
                      <span className="text-[11px] font-bold text-green-600 dark:text-green-400 flex items-center gap-px flex-shrink-0">
                        <ArrowUp className="w-3 h-3" />{p.crecimiento}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400">{p.categoria}</span>
                      <span className="text-[10px] text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-[10px] text-gray-500">{fmtNum(p.unidades)} u.</span>
                      <span className="text-[10px] text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{fmtK(p.monto)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sin movimiento */}
          <div className="card p-5">
            <SectionHead icon={Package} title="Productos Sin Movimiento"
              sub="Stock inmovilizado — requiere acción" color="#ef4444" />
            <div className="space-y-2.5">
              {DEAD_PRODUCTS.map((p) => (
                <div key={p.nombre} className="flex items-start gap-3 py-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-px"
                    style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.nombre}</p>
                      <span className="text-[11px] font-bold text-red-500 flex-shrink-0 tabular-nums">
                        {p.diasSinVenta}d
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400">{p.categoria}</span>
                      <span className="text-[10px] text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-[10px] text-gray-500">Stock: {p.stock} u.</span>
                      <span className="text-[10px] text-gray-300 dark:text-gray-700">·</span>
                      <span className={`text-[10px] font-semibold ${p.unidades === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                        {p.unidades === 0 ? 'Sin ventas' : `${p.unidades} u. vend.`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-red-500">6 productos</span> con +55 días sin movimiento
                representan stock inmovilizado de <span className="font-bold text-gray-800 dark:text-gray-200">~$2.1M</span>.
              </p>
            </div>
          </div>
        </div>

        {/* ── Devoluciones y cancelaciones ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Gráfico por motivo */}
          <div className="card p-5">
            <SectionHead icon={RefreshCw} title="Devoluciones por Motivo"
              sub={`${fmtNum(totalDev)} devoluciones en el período`} color="#f59e0b" />
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={RETURNS_DATA} layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false}
                  stroke="currentColor" strokeOpacity={0.06} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="motivo"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false} width={130} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="cantidad" name="Cantidad" fill="#f59e0b"
                  radius={[0, 4, 4, 0]} maxBarSize={16}>
                  <LabelList dataKey="cantidad" position="right"
                    style={{ fontSize: 10, fill: '#9ca3af' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detalle financiero */}
          <div className="card p-5">
            <SectionHead icon={XCircle} title="Detalle Financiero"
              sub="Monto recuperado por motivo de devolución/cancelación" color="#ef4444" />
            <div className="space-y-1">
              {RETURNS_DATA.map((r) => {
                const pct = Math.round((r.cantidad / totalDev) * 100)
                return (
                  <div key={r.motivo} className="py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-gray-700 dark:text-gray-300">{r.motivo}</p>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{r.cantidad}</span>
                        <span className="text-[10px] text-gray-400 ml-2 tabular-nums">{fmtK(r.monto)}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: 'rgba(239,68,68,0.55)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Impacto total del período</p>
                <span className="text-sm font-bold text-red-500">$1.93M</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Tasa de devolución: <span className="font-semibold">{tasaDev}%</span> · Objetivo: &lt; 3%
              </p>
            </div>
          </div>
        </div>

        {/* ── Clientes frecuentes ─────────────────────────────── */}
        <div className="card p-5">
          <SectionHead icon={Award} title="Clientes Frecuentes"
            sub="Top 8 compradores por volumen de transacciones" color="#22c55e" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Cliente', 'Segmento', 'Compras', 'Monto Total', 'Ticket Prom.', 'Última compra'].map(h => (
                    <th key={h} className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {FREQUENT_CUSTOMERS.map((c) => {
                  const initials = c.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)
                  return (
                    <tr key={c.nombre} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[11px] font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {initials}
                          </div>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">{c.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${SEGMENT_CLS[c.segmento] ?? ''}`}>
                          {c.segmento}
                        </span>
                      </td>
                      <td className="py-3 pr-5 text-xs font-bold text-gray-900 dark:text-white tabular-nums">{c.compras}</td>
                      <td className="py-3 pr-5 text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">{fmtK(c.monto)}</td>
                      <td className="py-3 pr-5 text-xs text-gray-600 dark:text-gray-400 tabular-nums">{fmtPeso(c.ticket)}</td>
                      <td className="py-3 text-xs text-gray-500">{c.ultima}</td>
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
