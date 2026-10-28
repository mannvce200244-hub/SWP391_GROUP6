export function reconcileCartSelection(current, owner, items) {
  const currentIds = items.map((item) => item.id)
  if (!owner) return { owner: null, selectedIds: [], knownIds: [] }
  if (current.owner !== owner) return { owner, selectedIds: currentIds, knownIds: currentIds }

  const availableIds = new Set(currentIds)
  const knownIds = new Set(current.knownIds)
  const selectedIds = current.selectedIds
    .filter((id) => availableIds.has(id))
    .concat(currentIds.filter((id) => !knownIds.has(id)))
  const unchanged = selectedIds.length === current.selectedIds.length
    && selectedIds.every((id, index) => id === current.selectedIds[index])
    && currentIds.length === current.knownIds.length
    && currentIds.every((id, index) => id === current.knownIds[index])
  return unchanged ? current : { owner, selectedIds, knownIds: currentIds }
}

