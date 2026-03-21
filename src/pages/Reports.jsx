import { FileText, Download, Eye, Calendar } from 'lucide-react'

const reports = [
  {
    id: 1,
    name: 'Reporte Mensual - Marzo 2026',
    type: 'Ventas',
    date: '21 Mar 2026',
    size: '2.4 MB',
    status: 'Completado',
  },
  {
    id: 2,
    name: 'Análisis de Usuarios Q1 2026',
    type: 'Usuarios',
    date: '15 Mar 2026',
    size: '1.8 MB',
    status: 'Completado',
  },
  {
    id: 3,
    name: 'Inventario - Febrero 2026',
    type: 'Inventario',
    date: '01 Mar 2026',
    size: '3.1 MB',
    status: 'Completado',
  },
  {
    id: 4,
    name: 'KPIs Ejecutivos Q4 2025',
    type: 'Ejecutivo',
    date: '10 Ene 2026',
    size: '980 KB',
    status: 'Completado',
  },
  {
    id: 5,
    name: 'Reporte de Marketing - Abr 2026',
    type: 'Marketing',
    date: '—',
    size: '—',
    status: 'Generando',
  },
]

const typeColors = {
  Ventas: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  Usuarios: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  Inventario: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  Ejecutivo: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  Marketing: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
}

export default function Reports() {
  return (
    <div className="space-y-6 p-6 overflow-y-auto flex-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Reportes generados y programados</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Nuevo reporte
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total reportes', value: '48', icon: FileText, color: 'text-blue-600' },
          { label: 'Este mes', value: '12', icon: Calendar, color: 'text-purple-600' },
          { label: 'Descargas', value: '234', icon: Download, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reports table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Todos los reportes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Tamaño</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[r.type]}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{r.date}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{r.size}</td>
                  <td className="px-6 py-4">
                    {r.status === 'Completado' ? (
                      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Completado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> Generando
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-colors" title="Ver">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-green-600 transition-colors" title="Descargar">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
