import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Download, RefreshCw, Check, LayoutGrid } from 'lucide-react'

const DATE_RANGES = ['Hoy', '7D', '30D', '3M', '1A']
const CATEGORIES  = ['Todas', 'Electrónica', 'Ropa & Moda', 'Hogar', 'Deportes', 'Belleza', 'Gaming']
const REGIONS     = ['Global', 'Américas', 'Europa', 'Asia-Pac', 'LATAM']

// ─── Dropdown ────────────────────────────────────────────────────────────────
function Dropdown({ options, value, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isFiltered = value !== options[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
        style={{
          background: open || isFiltered ? 'rgba(0,230,118,0.08)' : 'var(--scifi-surface)',
          border: `1px solid ${open || isFiltered ? 'rgba(0,230,118,0.4)' : 'var(--scifi-border)'}`,
          color: open || isFiltered ? 'var(--scifi-neon)' : 'var(--scifi-text-dim)',
        }}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{value}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        {isFiltered && (
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00e676', boxShadow: '0 0 6px #00e676' }} />
        )}
      </button>

      {open && (
        <div className="dropdown-panel w-48">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              className={opt === value ? 'dropdown-item-active' : 'dropdown-item'}
            >
              <span>{opt}</span>
              {opt === value && <Check className="w-3.5 h-3.5 text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FilterBar ───────────────────────────────────────────────────────────────
export default function FilterBar({
  dateRange, setDateRange,
  category, setCategory,
  region, setRegion,
  isLoading, onRefresh,
}) {
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 2000)
    }, 1800)
  }

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Date range tabs */}
      <div className="tab-group">
        {DATE_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setDateRange(r)}
            className={dateRange === r ? 'tab-item-active' : 'tab-item'}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Category */}
      <Dropdown
        options={CATEGORIES}
        value={category}
        onChange={setCategory}
        icon={LayoutGrid}
      />

      {/* Region */}
      <Dropdown
        options={REGIONS}
        value={region}
        onChange={setRegion}
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="btn-ghost p-2 rounded-xl"
        title="Actualizar datos"
      >
        <RefreshCw className={`w-4 h-4 transition-transform ${isLoading ? 'animate-spin' : ''}`} style={isLoading ? { color: '#00e676' } : {}} />
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="btn-primary"
      >
        {exporting ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Exportando...
          </>
        ) : exportDone ? (
          <>
            <Check className="w-3.5 h-3.5" />
            ¡Listo!
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            Exportar
          </>
        )}
      </button>
    </div>
  )
}
