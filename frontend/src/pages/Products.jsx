import { useState, useEffect } from 'react'
import { Plus, Package, AlertCircle, Pencil, Check, X } from 'lucide-react'
import { apiFetch } from '../context/AuthContext'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [selectedCats, setSelectedCats] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editCats, setEditCats] = useState([])

  const fetchProducts = async () => {
    try { setProducts(await apiFetch('/products/')) } catch { /* ignore */ }
  }

  const fetchCategories = async () => {
    try { setCategories(await apiFetch('/categories/')) } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const toggleCat = (id) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleEditCat = (id) => {
    setEditCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const startEdit = (prod) => {
    setEditingId(prod.id)
    setEditCats(prod.categories.map((c) => c.id))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditCats([])
  }

  const saveEdit = async (productId) => {
    try {
      await apiFetch(`/products/${productId}/categories`, {
        method: 'PUT',
        body: JSON.stringify({ category_ids: editCats }),
      })
      setEditingId(null)
      fetchProducts()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim() || !price) return
    setError('')
    setLoading(true)
    try {
      await apiFetch('/products/', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          price: parseFloat(price),
          category_ids: selectedCats,
        }),
      })
      setName('')
      setPrice('')
      setSelectedCats([])
      fetchProducts()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">Crea y administra tus productos</p>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 dark:bg-gray-800 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                placeholder="Nombre del producto"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Precio</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setError('') }}
                placeholder="0.00"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Category selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Categorias</label>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400">No hay categorias. Crea una primero.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCat(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        selectedCats.includes(cat.id)
                          ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !price}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              <Plus className="w-4 h-4" />
              Crear producto
            </button>
          </div>
        </form>

        {/* List */}
        <div className="space-y-2">
          {products.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-sm">No hay productos todavia. Crea el primero.</p>
          )}
          {products.map((prod) => (
            <div
              key={prod.id}
              className="px-4 py-3 bg-white rounded-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{prod.name}</p>
                    <span className="text-xs font-bold text-green-600">${prod.price.toFixed(2)}</span>
                  </div>
                </div>
                {editingId !== prod.id ? (
                  <button
                    onClick={() => startEdit(prod)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all dark:hover:bg-green-900/20"
                    title="Editar categorias"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => saveEdit(prod.id)}
                      className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-all dark:hover:bg-green-900/20"
                      title="Guardar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all dark:hover:bg-red-900/20"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Categories display / edit */}
              <div className="flex flex-wrap gap-1.5 mt-2 ml-11">
                {editingId === prod.id ? (
                  categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleEditCat(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                        editCats.includes(cat.id)
                          ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400'
                          : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-green-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))
                ) : (
                  prod.categories?.length > 0 ? (
                    prod.categories.map((c) => (
                      <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        {c.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Sin categorias</span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
