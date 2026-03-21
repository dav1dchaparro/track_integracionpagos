import { useState, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Treemap,
  ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  DollarSign, Users, ShoppingCart, TrendingUp, Target, Heart,
  Star, Zap, BarChart2, Award, RefreshCw, Activity,
  ChevronLeft, ArrowUpRight, X, Sparkles, AlertTriangle,
  ExternalLink, LayoutGrid, Eye,
} from 'lucide-react'
import StatCard, { StatCardSkeleton } from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import FilterBar from '../components/FilterBar'

// ─── Data ─────────────────────────────────────────────────────────────────────
const sp = (arr) => arr.map((v) => ({ v }))

const kpis = [
  { title: 'Revenue Total',    value: '$891K',  change: 12.5, changeLabel: 'vs mes ant.', icon: DollarSign,  color: 'blue',   sparkline: sp([42,45,41,48,52,49,58,62,59,67,71,79]) },
  { title: 'Usuarios Activos', value: '24,521', change: 8.2,  changeLabel: 'vs mes ant.', icon: Users,       color: 'purple', sparkline: sp([180,190,185,210,220,215,240,245,260,255,270,280]) },
  { title: 'Tasa Conversión',  value: '7.8%',   change: -0.4, changeLabel: 'vs mes ant.', icon: Target,      color: 'orange', sparkline: sp([82,79,81,78,80,77,79,82,76,78,79,78]) },
  { title: 'Ticket Promedio',  value: '$234',   change: 3.1,  changeLabel: 'vs mes ant.', icon: ShoppingCart,color: 'green',  sparkline: sp([215,220,218,225,228,222,230,235,229,232,234,234]) },
  { title: 'Órdenes',          value: '3,842',  change: -2.4, changeLabel: 'vs mes ant.', icon: Activity,    color: 'cyan',   sparkline: sp([3900,3850,3920,3800,3780,3820,3860,3840,3810,3830,3850,3842]) },
  { title: 'Crecimiento MoM',  value: '18.3%',  change: 4.1,  changeLabel: 'vs mes ant.', icon: TrendingUp,  color: 'indigo', sparkline: sp([60,65,70,75,70,80,85,75,80,85,90,92]) },
  { title: 'Retención',        value: '85.2%',  change: 1.2,  changeLabel: 'vs mes ant.', icon: Heart,       color: 'pink',   sparkline: sp([82,83,82,84,83,84,85,84,85,85,85,85]) },
  { title: 'NPS Score',        value: '72',     change: 7.5,  changeLabel: 'vs mes ant.', icon: Star,        color: 'yellow', sparkline: sp([60,62,64,65,63,67,68,69,70,71,72,72]) },
  { title: 'CAC',              value: '$28.4',  change: -8.2, changeLabel: 'vs mes ant.', icon: Zap,         color: 'teal',   inverseTrend: true, sparkline: sp([40,38,36,34,35,32,31,30,31,30,29,28].map(v=>44-v)) },
  { title: 'LTV',              value: '$1,240', change: 15,   changeLabel: 'vs mes ant.', icon: Award,       color: 'blue',   sparkline: sp([900,950,980,1020,1060,1100,1140,1160,1180,1210,1230,1240]) },
  { title: 'Churn Rate',       value: '2.3%',   change: -0.4, changeLabel: 'vs mes ant.', icon: RefreshCw,   color: 'red',    inverseTrend: true, sparkline: sp([3.2,3.0,2.9,2.8,2.9,2.7,2.6,2.5,2.4,2.4,2.3,2.3].map(v=>4-v)) },
  { title: 'EBITDA',           value: '$234K',  change: 9.8,  changeLabel: 'vs mes ant.', icon: BarChart2,   color: 'green',  sparkline: sp([180,185,190,195,198,205,210,215,220,225,230,234]) },
]

const revenueMonthly = [
  {mes:'Ene',revenue:42,profit:18},{mes:'Feb',revenue:38,profit:15},{mes:'Mar',revenue:55,profit:24},
  {mes:'Abr',revenue:49,profit:21},{mes:'May',revenue:63,profit:30},{mes:'Jun',revenue:71,profit:35},
  {mes:'Jul',revenue:68,profit:32},{mes:'Ago',revenue:79,profit:40},{mes:'Sep',revenue:85,profit:45},
  {mes:'Oct',revenue:91,profit:48},{mes:'Nov',revenue:98,profit:52},{mes:'Dic',revenue:112,profit:61},
]
const revenueWeekly = [
  {mes:'S1',revenue:21,profit:9},{mes:'S2',revenue:25,profit:11},{mes:'S3',revenue:28,profit:13},
  {mes:'S4',revenue:23,profit:10},{mes:'S5',revenue:30,profit:14},{mes:'S6',revenue:27,profit:12},
  {mes:'S7',revenue:32,profit:15},{mes:'S8',revenue:29,profit:13},
]
const categoryData = [
  {name:'Electrónica',value:35},{name:'Ropa',value:25},{name:'Hogar',value:20},{name:'Deportes',value:12},{name:'Otros',value:8},
]
const PIE_COLORS = ['#16a34a','#22c55e','#86efac','#4ade80','#bbf7d0']

const waterfallData = [
  {name:'Q3 Base',base:0,value:500,fill:'#3b82f6'},{name:'Ventas',base:500,value:250,fill:'#16a34a'},
  {name:'Suscripciones',base:750,value:180,fill:'#16a34a'},{name:'Servicios',base:930,value:95,fill:'#16a34a'},
  {name:'Reembolsos',base:950,value:75,fill:'#ef4444'},{name:'Descuentos',base:905,value:45,fill:'#ef4444'},
  {name:'Gastos Op.',base:785,value:120,fill:'#ef4444'},{name:'Total Q4',base:0,value:785,fill:'#8b5cf6'},
]

const treemapData = [
  {name:'Electrónica',value:450,fill:'#16a34a'},{name:'Ropa & Moda',value:280,fill:'#8b5cf6'},
  {name:'Hogar & Deco',value:190,fill:'#06b6d4'},{name:'Deportes',value:220,fill:'#f59e0b'},
  {name:'Belleza',value:320,fill:'#ec4899'},{name:'Libros',value:95,fill:'#64748b'},
  {name:'Alimentación',value:180,fill:'#14b8a6'},{name:'Gaming',value:150,fill:'#6366f1'},
]

const topProducts = [
  {name:'iPhone 15 Pro', category:'Electrónica',sales:1240,revenue:'$1,488K',trend:'+12%'},
  {name:'MacBook Air M3',category:'Electrónica',sales:890, revenue:'$1,157K',trend:'+8%'},
  {name:'Nike Air Max',  category:'Deportes',   sales:2100,revenue:'$378K',  trend:'+22%'},
  {name:'Samsung 4K TV', category:'Electrónica',sales:670, revenue:'$469K',  trend:'-3%'},
  {name:'Sofá Premium',  category:'Hogar',      sales:430, revenue:'$387K',  trend:'+15%'},
  {name:'AirPods Pro 2', category:'Electrónica',sales:1890,revenue:'$567K',  trend:'+31%'},
]

const rfmSegments = [
  {name:'Campeones',  count:842, pct:18,revenue:'$312K',clv:'$1,890',action:'Recompensar + referidos',   color:'#16a34a',bg:'bg-green-50 dark:bg-green-900/20', border:'border-green-300 dark:border-green-700'},
  {name:'Leales',     count:1240,pct:26,revenue:'$428K',clv:'$1,450',action:'Upsell y cross-sell',        color:'#3b82f6',bg:'bg-blue-50 dark:bg-blue-900/20',   border:'border-blue-300 dark:border-blue-700'},
  {name:'Potenciales',count:890, pct:19,revenue:'$198K',clv:'$780',  action:'Activar con primera oferta', color:'#8b5cf6',bg:'bg-purple-50 dark:bg-purple-900/20',border:'border-purple-300 dark:border-purple-700'},
  {name:'En Riesgo',  count:650, pct:14,revenue:'$145K',clv:'$560',  action:'Win-back: -20% urgente',     color:'#f59e0b',bg:'bg-yellow-50 dark:bg-yellow-900/20',border:'border-yellow-300 dark:border-yellow-700'},
  {name:'Nuevos',     count:580, pct:12,revenue:'$82K', clv:'$240',  action:'Onboarding en 7 días',       color:'#06b6d4',bg:'bg-cyan-50 dark:bg-cyan-900/20',   border:'border-cyan-300 dark:border-cyan-700'},
  {name:'Perdidos',   count:540, pct:11,revenue:'$42K', clv:'$180',  action:'Encuesta + oferta final',    color:'#ef4444',bg:'bg-red-50 dark:bg-red-900/20',    border:'border-red-300 dark:border-red-700'},
]

const scatterData = [
  {name:'Electrónica',sessions:15000,conversions:1200,fill:'#16a34a'},
  {name:'Ropa',       sessions:22000,conversions:2100,fill:'#8b5cf6'},
  {name:'Hogar',      sessions:9500, conversions:780, fill:'#06b6d4'},
  {name:'Deportes',   sessions:12000,conversions:950, fill:'#f59e0b'},
  {name:'Belleza',    sessions:18000,conversions:1800,fill:'#ec4899'},
  {name:'Gaming',     sessions:11000,conversions:890, fill:'#6366f1'},
  {name:'Alimentación',sessions:25000,conversions:3200,fill:'#14b8a6'},
]

const radarData = [
  {area:'Ventas',actual:85,objetivo:90},{area:'Marketing',actual:72,objetivo:80},
  {area:'Soporte',actual:90,objetivo:85},{area:'Producto',actual:68,objetivo:75},
  {area:'Logística',actual:78,objetivo:80},{area:'Finanzas',actual:82,objetivo:85},
]

const HEATMAP_DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const HEATMAP_MATRIX = [
  [2,1,1,1,1,2,3,8,12,18,22,25,20,18,22,24,20,15,12,10,8,5,3,2],
  [2,1,1,1,1,2,5,15,42,68,85,90,72,75,82,88,76,62,48,32,22,13,7,3],
  [2,1,1,1,1,2,5,18,44,70,87,92,74,77,84,90,78,64,50,34,23,14,7,3],
  [2,1,1,1,1,2,5,16,40,65,82,88,70,72,80,85,73,60,45,30,20,12,6,3],
  [2,1,1,1,1,2,5,17,42,67,84,90,72,74,82,87,75,62,47,32,22,13,7,3],
  [2,1,1,1,1,2,5,15,38,61,78,83,66,68,75,80,70,57,44,36,30,20,11,4],
  [3,2,1,1,1,2,4,10,18,28,35,38,32,30,35,38,33,26,22,17,12,8,5,3],
]

const forecastData = [
  {mes:'Jul',actual:68,lower:0,band:0},{mes:'Ago',actual:79,lower:0,band:0},
  {mes:'Sep',actual:85,lower:0,band:0},{mes:'Oct',actual:91,lower:0,band:0},
  {mes:'Nov',actual:98,lower:0,band:0},{mes:'Dic',actual:112,forecast:112,lower:112,band:0},
  {mes:'Ene ▸',forecast:119,lower:109,band:20},{mes:'Feb ▸',forecast:127,lower:114,band:26},
  {mes:'Mar ▸',forecast:136,lower:120,band:32},{mes:'Abr ▸',forecast:145,lower:127,band:36},
]

const aiInsights = [
  {type:'Oportunidad',icon:TrendingUp,color:'#16a34a',badgeClass:'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
   title:'Upsell en Electrónica',desc:'842 clientes "Campeones" sin accesorios. 68% de perfiles similares compran el mes siguiente.',impact:'+$67K',good:true,confidence:87},
  {type:'Riesgo Crítico',icon:AlertTriangle,color:'#ef4444',badgeClass:'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
   title:'650 clientes con churn alto',desc:'NPS promedio 28, sin compra en 45+ días. Probabilidad de abandono: 74% en 30 días.',impact:'-$145K',good:false,confidence:74},
  {type:'Eficiencia',icon:Zap,color:'#3b82f6',badgeClass:'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
   title:'CAC alto en Social Media',desc:'CAC de $52.4, un 84% más caro que promedio. Redirigir 30% a SEO reduce CAC total 23%.',impact:'-$18K/mes',good:true,confidence:81},
  {type:'Tendencia',icon:Sparkles,color:'#8b5cf6',badgeClass:'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
   title:'Demanda emergente en Belleza',desc:'Belleza creció 38% MoM x3 meses seguidos. Stock cubre solo 18 días. $320K en riesgo.',impact:'+$320K',good:true,confidence:91},
]

// ─── Hub section definitions ──────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'kpis', title: 'KPIs & Métricas', subtitle: '12 indicadores clave del negocio',
    icon: BarChart2, from: '#16a34a', to: '#065f46',
    stats: [{v:'$891K',l:'Revenue'},{v:'24.5K',l:'Usuarios'},{v:'18.3%',l:'Crecimiento'}],
  },
  {
    id: 'revenue', title: 'Revenue & Profit', subtitle: 'Ingresos, rentabilidad y desglose',
    icon: TrendingUp, from: '#2563eb', to: '#312e81',
    stats: [{v:'$891K',l:'Revenue'},{v:'$234K',l:'EBITDA'},{v:'+12.5%',l:'Crecimiento'}],
  },
  {
    id: 'productos', title: 'Productos & Categorías', subtitle: 'Ventas, treemap y top productos',
    icon: ShoppingCart, from: '#7c3aed', to: '#4c1d95',
    stats: [{v:'3,842',l:'Órdenes'},{v:'$234',l:'Ticket'},{v:'8',l:'Categorías'}],
  },
  {
    id: 'clientes', title: 'Clientes & Segmentos', subtitle: 'RFM, comportamiento y dispersión',
    icon: Users, from: '#0891b2', to: '#164e63',
    stats: [{v:'4,742',l:'Clientes'},{v:'85.2%',l:'Retención'},{v:'NPS 72',l:'Score'}],
  },
  {
    id: 'actividad', title: 'Actividad & Desempeño', subtitle: 'Heatmap horario y radar de áreas',
    icon: Activity, from: '#ea580c', to: '#7c2d12',
    stats: [{v:'7.8%',l:'Conversión'},{v:'3.8M',l:'Sesiones'},{v:'Jue 10h',l:'Pico'}],
  },
  {
    id: 'predictivo', title: 'Analytics Predictivo', subtitle: 'IA, pronósticos y alertas',
    icon: Sparkles, from: '#db2777', to: '#831843',
    stats: [{v:'$126K',l:'Forecast'},{v:'4',l:'Insights IA'},{v:'87%',l:'Confianza'}],
  },
]

// ─── Custom chart renderers ───────────────────────────────────────────────────
const ScatterTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="card p-3 shadow-lg text-xs">
      <p className="font-bold mb-1">{d.name}</p>
      <p className="text-gray-500">Sesiones: <b>{d.sessions.toLocaleString()}</b></p>
      <p className="text-gray-500">Conv.: <b>{d.conversions.toLocaleString()}</b></p>
      <p className="text-green-600 font-bold">{((d.conversions/d.sessions)*100).toFixed(1)}% tasa</p>
    </div>
  )
}
const WaterfallTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const bar = payload.find(p => p.dataKey === 'value')
  if (!bar) return null
  const entry = waterfallData.find(d => d.name === label)
  return (
    <div className="card p-3 shadow-lg text-xs">
      <p className="font-bold mb-1">{label}</p>
      <p style={{color:entry?.fill}} className="font-bold">${bar.value}K</p>
    </div>
  )
}
const TreemapContent = ({ x, y, width, height, name, value, fill, depth }) => {
  if (depth === 0 || !width || !height || width < 5 || height < 5) return null
  return (
    <g>
      <rect x={x+1} y={y+1} width={width-2} height={height-2} fill={fill} rx={6} />
      {width > 60 && height > 40 && (
        <>
          <text x={x+width/2} y={y+height/2-9} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="700">{name}</text>
          <text x={x+width/2} y={y+height/2+9} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={10}>${value}K</text>
        </>
      )}
      {width > 35 && height > 20 && width <= 60 && (
        <text x={x+width/2} y={y+height/2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={9} fontWeight="600">{name}</text>
      )}
    </g>
  )
}

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
function KpisSection({ isLoading, onKpiClick }) {
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
function RevenueSection() {
  const [tab, setTab] = useState('Mensual')
  const data = tab === 'Mensual' ? revenueMonthly : revenueWeekly
  return (
    <div className="h-full grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Line chart */}
      <div className="xl:col-span-2 flex flex-col gap-4">
        <ChartCard title="Revenue & Profit" subtitle={`Últimos ${tab === 'Mensual' ? '12 meses' : '8 semanas'} (miles $)`}
          tabs={['Mensual','Semanal']} activeTab={tab} onTabChange={setTab}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} tickFormatter={v=>`$${v}K`} />
                <Tooltip formatter={v=>[`$${v}K`,'']} contentStyle={{borderRadius:12,fontSize:12}} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} dot={{r:3}} activeDot={{r:5}} name="Revenue" />
                <Line type="monotone" dataKey="profit"  stroke="#22c55e" strokeWidth={2} dot={{r:3}} strokeDasharray="6 3" name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Waterfall */}
        <ChartCard title="Desglose de Ingresos" subtitle="Waterfall Q3 → Q4 (miles $)">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{top:5,right:10,left:10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fontSize:10}} />
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${v}K`} domain={[0,1200]} />
                <Tooltip content={<WaterfallTip />} />
                <Bar dataKey="base" stackId="wf" fillOpacity={0} strokeOpacity={0} />
                <Bar dataKey="value" stackId="wf" radius={[4,4,0,0]} maxBarSize={48}>
                  {waterfallData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Pie + stats */}
      <div className="flex flex-col gap-4">
        <ChartCard title="Por Categoría" subtitle="Distribución de ventas">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                  {categoryData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v=>[`${v}%`,'']} contentStyle={{borderRadius:12,fontSize:12}} />
                <Legend wrapperStyle={{fontSize:12}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Quick stats */}
        <div className="card p-5 flex-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Resumen financiero</p>
          {[
            {label:'Margen bruto',value:'26.2%',good:true},
            {label:'Costo operativo',value:'$658K',good:null},
            {label:'Meta Q4',value:'93% alcanzada',good:true},
            {label:'Proyección anual',value:'$1.08M',good:true},
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
              <span className={`text-sm font-bold ${item.good === true ? 'text-green-600 dark:text-green-400' : item.good === false ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Productos Section ────────────────────────────────────────────────────────
function ProductosSection() {
  const [view, setView] = useState('Treemap')
  return (
    <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard title="Revenue por Categoría" subtitle="Distribución jerárquica (miles $)"
        tabs={['Treemap','Barras']} activeTab={view} onTabChange={setView}>
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            {view === 'Treemap' ? (
              <Treemap data={treemapData} dataKey="value" aspectRatio={4/3} stroke="none" content={p => <TreemapContent {...p} />} />
            ) : (
              <BarChart data={treemapData} margin={{top:5,right:10,left:10,bottom:40}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fontSize:10}} angle={-30} textAnchor="end" />
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${v}K`} />
                <Tooltip formatter={v=>[`$${v}K`,'']} contentStyle={{borderRadius:12,fontSize:12}} />
                <Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={48}>
                  {treemapData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {treemapData.map(d => (
            <span key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-sm" style={{backgroundColor:d.fill}} />{d.name}
            </span>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Top Productos" subtitle="Más vendidos este mes" action="Ver todos →">
        <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-900">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['#','Producto','Categoría','Ventas','Revenue','Trend'].map(h => (
                  <th key={h} className="py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide text-left first:text-center last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {topProducts.map((p, i) => (
                <tr key={p.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 text-center text-xs font-bold text-gray-400">#{i+1}</td>
                  <td className="py-3 font-semibold text-gray-900 dark:text-white">{p.name}</td>
                  <td className="py-3"><span className="badge-green">{p.category}</span></td>
                  <td className="py-3 tabular-nums text-gray-600 dark:text-gray-300">{p.sales.toLocaleString()}</td>
                  <td className="py-3 font-bold text-gray-900 dark:text-white tabular-nums">{p.revenue}</td>
                  <td className="py-3 text-right font-bold">
                    <span className={p.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}>{p.trend}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

// ─── Clientes Section ─────────────────────────────────────────────────────────
function ClientesSection() {
  return (
    <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard title="Segmentación RFM" subtitle="Recency · Frequency · Monetary">
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 380 }}>
          {rfmSegments.map((seg) => (
            <div key={seg.name} className={`flex items-center gap-3 p-3 rounded-xl border ${seg.bg} ${seg.border}`}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:seg.color}} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{seg.name}</p>
                  <div className="flex items-center gap-3 text-xs flex-shrink-0">
                    <span className="text-gray-500">{seg.count.toLocaleString()} ({seg.pct}%)</span>
                    <span className="font-bold text-gray-900 dark:text-white">{seg.revenue}</span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${seg.pct*3.5}%`,backgroundColor:seg.color}} />
                  </div>
                  <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{seg.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Sesiones vs Conversiones" subtitle="Correlación por categoría">
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{top:10,right:20,bottom:25,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="sessions" type="number" tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}
                label={{value:'Sesiones',position:'insideBottom',offset:-15,fontSize:12}} />
              <YAxis dataKey="conversions" type="number" tick={{fontSize:11}}
                label={{value:'Conversiones',angle:-90,position:'insideLeft',offset:15,fontSize:12}} />
              <Tooltip content={<ScatterTip />} />
              <Scatter data={scatterData}>
                {scatterData.map((e,i) => <Cell key={i} fill={e.fill} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {scatterData.map(d => (
            <span key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full" style={{backgroundColor:d.fill}} />{d.name}
            </span>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}

// ─── Actividad Section ───────────────────────────────────────────────────────
function ActividadSection() {
  return (
    <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard title="Radar de Desempeño" subtitle="Rendimiento actual vs objetivo por área">
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{top:10,right:30,bottom:10,left:30}}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="area" tick={{fontSize:12}} />
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:10}} />
              <Radar name="Actual"   dataKey="actual"   stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Objetivo" dataKey="objetivo" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={2} strokeDasharray="5 3" />
              <Legend /><Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Heatmap de Actividad" subtitle="Visitas por día y hora">
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="flex mb-1.5 ml-10">
              {Array.from({length:24},(_,h) => (
                <div key={h} className="flex-1 text-center" style={{fontSize:9,color:'#9ca3af'}}>
                  {h%4===0?`${h}h`:''}
                </div>
              ))}
            </div>
            {HEATMAP_DAYS.map((day,di) => (
              <div key={day} className="flex items-center mb-1">
                <span className="w-10 text-right pr-2 text-xs text-gray-500 flex-shrink-0">{day}</span>
                <div className="flex flex-1 gap-0.5">
                  {HEATMAP_MATRIX[di].map((val,h) => (
                    <div key={h} className="flex-1 h-5 rounded-sm cursor-pointer hover:opacity-70 transition-opacity"
                      style={{backgroundColor:`rgba(22,163,74,${(val/100).toFixed(2)})`,minWidth:3}}
                      title={`${day} ${h}:00 — ${val} visitas`}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-xs text-gray-400">Menos</span>
              {[0.05,0.2,0.4,0.6,0.8,1].map(op => (
                <div key={op} className="w-4 h-4 rounded-sm" style={{backgroundColor:`rgba(22,163,74,${op})`}} />
              ))}
              <span className="text-xs text-gray-400">Más</span>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  )
}

// ─── Predictivo Section ───────────────────────────────────────────────────────
function PredectivoSection() {
  return (
    <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* AI Insights */}
      <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '100%' }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <p className="font-bold text-gray-900 dark:text-white">Insights de IA</p>
          <span className="badge-green">4 detectados</span>
        </div>
        {aiInsights.map((ins) => (
          <div key={ins.title} className="card p-4 border-l-4 flex flex-col gap-2" style={{borderLeftColor:ins.color}}>
            <div className="flex items-start justify-between gap-2">
              <span className={`badge ${ins.badgeClass} flex items-center gap-1`}>
                <ins.icon className="w-3 h-3" />{ins.type}
              </span>
              <span className={`text-sm font-bold flex-shrink-0 ${ins.good?'text-green-600 dark:text-green-400':'text-red-500'}`}>{ins.impact}</span>
            </div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{ins.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ins.desc}</p>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{width:`${ins.confidence}%`,backgroundColor:ins.color}} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Confianza: {ins.confidence}%</span>
              <button className="text-xs font-semibold flex items-center gap-1" style={{color:ins.color}}>
                <ExternalLink className="w-3 h-3" /> Ver detalle
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Forecast chart */}
      <ChartCard title="Pronóstico de Revenue" subtitle="Histórico + predicción IA · IC 85%">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData} margin={{top:10,right:20,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${v}K`} />
              <Tooltip contentStyle={{borderRadius:12,fontSize:12}} />
              <Area type="monotone" dataKey="lower" stackId="ci" fill="transparent" stroke="none" legendType="none" isAnimationActive={false} />
              <Area type="monotone" dataKey="band" stackId="ci" fill="#16a34a" fillOpacity={0.12} stroke="none" legendType="none" isAnimationActive={false} />
              <Line type="monotone" dataKey="actual" stroke="#16a34a" strokeWidth={2.5} dot={{r:3}} connectNulls={false} name="Real" />
              <Line type="monotone" dataKey="forecast" stroke="#16a34a" strokeWidth={2} strokeDasharray="8 4" dot={{r:3,stroke:'#16a34a',fill:'#fff',strokeWidth:2}} connectNulls={false} name="Pronóstico" />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {/* Predictive KPIs mini grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            {l:'Revenue est.',v:'$126K',c:'text-green-600'},{l:'Nuevos usuarios',v:'2,840',c:'text-blue-600'},
            {l:'Churn esperado',v:'1.8%',c:'text-green-600'},{l:'CAC proyectado',v:'$24.2',c:'text-green-600'},
            {l:'LTV proyectado',v:'$1,380',c:'text-blue-600'},{l:'Órdenes est.',v:'4,120',c:'text-green-600'},
          ].map(k => (
            <div key={k.l} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
              <p className="text-[11px] text-gray-400 truncate">{k.l}</p>
              <p className={`text-sm font-bold mt-0.5 ${k.c}`}>{k.v}</p>
            </div>
          ))}
        </div>
      </ChartCard>
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
function HubView({ onOpen, dateRange, setDateRange, category, setCategory, region, setRegion, isLoading, onRefresh }) {
  const today = new Date().toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'})
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

      {/* Filter bar */}
      <div className="mb-5 flex-shrink-0">
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
const SECTION_MAP = {
  kpis:      KpisSection,
  revenue:   RevenueSection,
  productos: ProductosSection,
  clientes:  ClientesSection,
  actividad: ActividadSection,
  predictivo:PredectivoSection,
}

export default function Dashboard() {
  const [activeId,   setActiveId]   = useState(null)
  const [selectedKpi,setSelectedKpi]= useState(null)
  const [dateRange,  setDateRange]  = useState('30D')
  const [category,   setCategory]   = useState('Todas')
  const [region,     setRegion]     = useState('Global')
  const [isLoading,  setIsLoading]  = useState(false)

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
          />
        </SectionWrapper>
      ) : (
        <HubView
          onOpen={(id) => { setActiveId(id); triggerLoad() }}
          dateRange={dateRange} setDateRange={handleFilterChange(setDateRange)}
          category={category}   setCategory={handleFilterChange(setCategory)}
          region={region}       setRegion={handleFilterChange(setRegion)}
          isLoading={isLoading} onRefresh={triggerLoad}
        />
      )}

      {selectedKpi && <KpiModal kpi={selectedKpi} onClose={() => setSelectedKpi(null)} />}
    </div>
  )
}
