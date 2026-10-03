function getFieldDescription({ describedBy, error, helperText, id }) {
  return [
    describedBy,
    helperText ? `${id}-helper` : undefined,
    error ? `${id}-error` : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined
}

export default getFieldDescription
