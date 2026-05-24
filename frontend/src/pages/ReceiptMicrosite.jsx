import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Star, Clock, Coffee, Heart, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const WEEKDAY_PRETTY = {
  lunes: 'el lunes',
  martes: 'el martes',
  'miércoles': 'el miércoles',
  jueves: 'el jueves',
  viernes: 'el viernes',
  'sábado': 'el sábado',
  domingo: 'el domingo',
}

export default function ReceiptMicrosite() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/r/${token}`)
      .then((r) => {
        if (r.status === 410) throw new Error('expired')
        if (!r.ok) throw new Error('not_found')
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-3">{error === 'expired' ? '⏰' : '🔎'}</div>
          <h1 className="text-2xl font-bold mb-2">
            {error === 'expired' ? 'Este enlace expiró' : 'Recibo no encontrado'}
          </h1>
          <p className="text-gray-400 text-sm">
            {error === 'expired'
              ? 'Los enlaces de los recibos viven 24hs. Pedile al comercio uno nuevo.'
              : 'El recibo que escaneaste no existe o ya no está disponible.'}
          </p>
        </div>
      </div>
    )
  }

  const { store_name, sale_total, sale_date, google_review_url, next_visit } = data
  const saleDate = new Date(sale_date)
  const formattedDate = saleDate.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 text-white">
      <div className="max-w-md mx-auto px-5 py-10 space-y-6">
        {/* Header */}
        <header className="text-center pt-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white/15 items-center justify-center backdrop-blur-sm mb-4">
            <Coffee className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{store_name}</h1>
          <p className="text-emerald-100 text-sm mt-1">¡Gracias por tu compra!</p>
        </header>

        {/* Sale recap */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-100 font-bold">Total</p>
              <p className="text-3xl font-black">${sale_total.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-emerald-100 font-bold">Fecha</p>
              <p className="text-sm font-medium">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Google review CTA */}
        {google_review_url && (
          <a
            href={google_review_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white text-emerald-700 rounded-2xl p-5 shadow-xl hover:scale-[1.02] active:scale-100 transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-black text-base leading-tight">Dejá tu reseña</p>
                <p className="text-xs text-emerald-700/70 mt-0.5">
                  Tu opinión nos ayuda a mejorar
                </p>
              </div>
              <div className="text-2xl font-black">→</div>
            </div>
          </a>
        )}

        {/* Next visit suggestion */}
        {next_visit && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-emerald-100 font-bold mb-1">
                  Te esperamos
                </p>
                <p className="font-bold text-base leading-tight">
                  {WEEKDAY_PRETTY[next_visit.weekday] || next_visit.weekday} de {next_visit.time_range}
                </p>
                <p className="text-xs text-emerald-100 mt-1">
                  Es nuestro horario más concurrido — vení temprano.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-6 pb-2">
          <p className="text-xs text-emerald-100/80 flex items-center justify-center gap-1.5">
            Powered by <span className="font-bold">Atlas Nexus</span>
            <Heart className="w-3 h-3 fill-current" />
          </p>
        </footer>
      </div>
    </div>
  )
}
