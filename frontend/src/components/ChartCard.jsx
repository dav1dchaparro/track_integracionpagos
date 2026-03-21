export default function ChartCard({ title, subtitle, children, action, tabs, activeTab, onTabChange }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h3 className="font-bold leading-none" style={{ color: 'var(--scifi-text)' }}>{title}</h3>
          {subtitle && (
            <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--scifi-text-muted)' }}>{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {tabs && (
            <div className="tab-group">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange?.(tab)}
                  className={activeTab === tab ? 'tab-item-active' : 'tab-item'}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
          {action && (
            <button
              className="text-xs font-semibold hover:underline whitespace-nowrap transition-colors"
              style={{ color: 'var(--scifi-neon)' }}
            >
              {action}
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}
