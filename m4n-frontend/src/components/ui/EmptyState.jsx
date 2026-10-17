import { IconPackage } from './Icons.jsx'

function EmptyState({ children, icon: Icon = IconPackage, message, title }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-border bg-surface/60 max-w-lg mx-auto my-6">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-border/80 flex items-center justify-center text-secondary mb-3.5">
          <Icon size={28} />
        </div>
      )}
      <h2 className="text-base sm:text-lg font-semibold text-ink mb-1">{title}</h2>
      {message && <p className="text-sm text-muted mb-4 max-w-sm">{message}</p>}
      {children}
    </div>
  )
}

export default EmptyState
