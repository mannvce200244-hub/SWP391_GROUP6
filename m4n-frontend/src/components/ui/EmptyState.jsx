function EmptyState({ children, message, title }) {
  return (
    <div className="state-panel">
      <h2>{title}</h2>
      <p>{message}</p>
      {children}
    </div>
  )
}

export default EmptyState
