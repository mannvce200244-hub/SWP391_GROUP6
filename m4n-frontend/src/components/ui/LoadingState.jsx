function LoadingState({ message = 'Đang tải dữ liệu…' }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col items-center justify-center text-center p-8 sm:p-12 min-h-[160px] text-muted"
      role="status"
    >
      <span
        aria-hidden="true"
        className="w-6 h-6 border-2 border-border border-t-brand rounded-full animate-spin mb-3"
      />
      <p className="text-sm font-medium text-muted">{message}</p>
    </div>
  )
}

export default LoadingState
