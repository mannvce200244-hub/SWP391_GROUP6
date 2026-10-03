import Button from './Button.jsx'

function ErrorState({ message, onRetry, title = 'Không thể tải dữ liệu' }) {
  return (
    <div className="state-panel state-panel--error" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry ? <Button onClick={onRetry}>Thử lại</Button> : null}
    </div>
  )
}

export default ErrorState
