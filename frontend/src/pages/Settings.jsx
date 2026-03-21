import { useState } from 'react'
import { User, Bell, Shield, Save } from 'lucide-react'

export default function Settings() {
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@analytics.com',
    role: 'Administrador',
    phone: '+34 600 123 456',
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reports: false,
    marketing: false,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Administra tu cuenta y preferencias</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Perfil</h2>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            A
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{profile.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{profile.role}</p>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1">
              Cambiar foto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nombre completo', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Rol', key: 'role' },
            { label: 'Teléfono', key: 'phone' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <input
                type="text"
                value={profile[key]}
                onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h2>
        </div>

        <div className="space-y-4">
          {[
            { key: 'email', label: 'Notificaciones por email', desc: 'Recibe alertas en tu correo electrónico' },
            { key: 'push', label: 'Notificaciones push', desc: 'Alertas en tiempo real en el navegador' },
            { key: 'reports', label: 'Reportes automáticos', desc: 'Recibe reportes semanales generados automáticamente' },
            { key: 'marketing', label: 'Actualizaciones de producto', desc: 'Novedades y mejoras de la plataforma' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifications[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications[key] ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Seguridad</h2>
        </div>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300">
            Cambiar contraseña
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300">
            Activar autenticación en dos pasos (2FA)
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300">
            Ver sesiones activas
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
