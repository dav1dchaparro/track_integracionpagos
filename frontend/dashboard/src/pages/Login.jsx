// Login.jsx — Simple merchant login screen for SmartReceipt.
// Matches the dark theme of the main dashboard (bg-gray-950).
// On successful submit it calls the onLogin(merchantId) prop provided by App.jsx.

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

/**
 * Login page component.
 *
 * Props:
 *   onLogin(merchantId: string) — called when the user submits the form.
 *                                 App.jsx uses this to set the active merchant
 *                                 and transition to the dashboard.
 */
export default function Login({ onLogin }) {
  // Controlled input value for the merchant ID field
  const [merchantId, setMerchantId] = useState('')

  /**
   * Handles form submission.
   * Trims whitespace and calls onLogin only when there is a non-empty value.
   */
  function handleSubmit(e) {
    e.preventDefault()
    const id = merchantId.trim()
    if (id) onLogin(id)
  }

  /**
   * Demo shortcut: fills in the well-known demo merchant ID so the user
   * doesn't have to type anything during a live demo or presentation.
   */
  function fillDemo() {
    setMerchantId('demo_merchant_001')
  }

  return (
    // Full-screen dark background matching the dashboard theme
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ── Logo / branding ── */}
        <div className="flex flex-col items-center mb-8">
          {/* Icon badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center mb-4 shadow-lg shadow-green-900/40">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">SmartReceipt</h1>
          <p className="text-sm text-gray-400 mt-1">Ingresá tu Merchant ID para continuar</p>
        </div>

        {/* ── Login card ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Merchant ID input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="merchant-id" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Merchant ID
              </label>
              <input
                id="merchant-id"
                type="text"
                value={merchantId}
                onChange={e => setMerchantId(e.target.value)}
                placeholder="demo_merchant_001"
                autoFocus
                className="w-full rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-600 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/60 focus:border-green-500 transition-colors"
              />
            </div>

            {/* Primary submit button */}
            <button
              type="submit"
              disabled={!merchantId.trim()}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
            >
              Entrar al Dashboard
            </button>
          </form>

          {/* Demo shortcut — fills the input without requiring the user to type */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={fillDemo}
              className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
            >
              Usar cuenta demo
            </button>
          </div>
        </div>

        {/* Fine-print footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          SmartReceipt · Hackathon Track Integración Pagos
        </p>
      </div>
    </div>
  )
}
