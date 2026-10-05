function EditorialEyebrow({
  brandPrefix = '',
  children,
  className = '',
  label,
  showResonance = true,
}) {
  const content = label || children

  if (!content) return null

  return (
    <div
      className={`inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-ink select-none ${className}`}
    >
      {showResonance && (
        <span className="resonance-motif" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      )}
      {brandPrefix ? (
        <>
          <span className="text-brand font-bold">{brandPrefix}</span>
          <span className="text-border-strong font-normal" aria-hidden="true">
            /
          </span>
        </>
      ) : null}
      <span>{content}</span>
    </div>
  )
}

export default EditorialEyebrow
