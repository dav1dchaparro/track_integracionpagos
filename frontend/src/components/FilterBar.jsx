import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Download, RefreshCw, Check, LayoutGrid } from 'lucide-react'

const DATE_RANGES = ['Hoy', '7D', '30D', '3M', '1A']
const CATEGORIES  = ['Todas', 'Electrónica', 'Ropa & Moda', 'Hogar', 'Deportes', 'Belleza', 'Gaming']
const REGIONS     = ['Global', 'Américas', 'Europa', 'Asia-Pac', 'LATAM']

// ─── Dropdown ────────────────────────────────────────────────────────────────
function Dropdown({ label, options, value, onChange, icon: Icon }) {
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
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${
          open || isFiltered
            ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-900/20 dark:border-brand-700 dark:text-brand-400'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{value}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        {isFiltered && (
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
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
        label={category}
        options={CATEGORIES}
        value={category}
        onChange={setCategory}
        icon={LayoutGrid}
      />

      {/* Region */}
      <Dropdown
        label={region}
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
        <RefreshCw className={`w-4 h-4 transition-transform ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className={`btn ${
          exportDone
            ? 'bg-brand-600 text-white border-brand-600'
            : 'btn-primary'
        }`}
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
