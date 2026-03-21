import { useState, useEffect } from 'react'
import { Plus, Tag, Trash2, AlertCircle } from 'lucide-react'
import { apiFetch } from '../context/AuthContext'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchCategories = async () => {
    try {
      setCategories(await apiFetch('/categories/'))
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchCategories() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)
    try {
      await apiFetch('/categories/', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      })
      setName('')
      fetchCategories()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias</h1>
          <p className="text-sm text-gray-500 mt-1">Crea y administra las categorias de tus productos</p>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="Nombre de la categoria"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <Plus className="w-4 h-4" />
            Crear
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2.5 px-3.5 py-3 mb-6 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* List */}
        <div className="space-y-2">
          {categories.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-sm">No hay categorias todavia. Crea la primera.</p>
          )}
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 dark:bg-green-900/20">
                  <Tag className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(cat.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
