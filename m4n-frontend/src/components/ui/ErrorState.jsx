import Button from './Button.jsx'
import { IconAlert } from './Icons.jsx'

function ErrorState({ message, onRetry, title = 'Không thể tải dữ liệu' }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-brand-border bg-brand-soft/30 max-w-lg mx-auto my-6"
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center text-brand mb-3.5">
        <IconAlert size={24} />
      </div>
      <h2 className="text-base sm:text-lg font-semibold text-ink mb-1">{title}</h2>
      {message && <p className="text-sm text-muted mb-4 max-w-sm">{message}</p>}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Thử lại
        </Button>
      ) : null}
    </div>
  )
}

export default ErrorState
