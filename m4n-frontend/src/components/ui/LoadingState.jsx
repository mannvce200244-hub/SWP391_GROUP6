function LoadingState({ message = 'Đang tải dữ liệu…' }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="state-panel"
      role="status"
    >
      <span aria-hidden="true" className="loading-indicator" />
      <p>{message}</p>
    </div>
  )
}

export default LoadingState
