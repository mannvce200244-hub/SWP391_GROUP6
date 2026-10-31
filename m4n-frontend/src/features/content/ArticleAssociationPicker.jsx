import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import articleService from '../../services/articleService.js'

export default function ArticleAssociationPicker({ kind, label, selected, onSelect, disabled }) {
  const [keyword, setKeyword] = useState('')
  const [state, setState] = useState({ status: 'idle', items: [] })
  const requestSequence = useRef(0)
  useEffect(() => () => { requestSequence.current += 1 }, [])
  const search = async () => {
    if (disabled || state.status === 'loading') return
    const sequence = ++requestSequence.current
    setState({ status: 'loading', items: [] })
    try {
      const items = await articleService.searchAssociations(kind, keyword)
      if (sequence === requestSequence.current) setState({ status: 'success', items })
    } catch {
      if (sequence === requestSequence.current) setState({ status: 'error', items: [] })
    }
  }
  const searchId = `article-${kind}-search`
  return (
    <fieldset disabled={disabled} className="min-w-0 rounded-lg border border-border bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-ink">{label} (không bắt buộc)</legend>
      {selected ? <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 break-words font-medium text-ink">Đã chọn: {selected.name} · #{selected.id}</span>
        <button type="button" onClick={() => onSelect(null)} className="min-h-11 shrink-0 px-2 text-brand" aria-label={`Bỏ liên kết ${label.toLowerCase()}`}>Bỏ liên kết</button>
      </div> : <p className="mb-3 text-xs text-muted">Chưa liên kết.</p>}
      <label htmlFor={searchId} className="mb-1.5 block text-xs text-muted">Tìm {label.toLowerCase()} theo tên</label>
      <div className="flex gap-2">
        <input id={searchId} name={`${kind}Search`} autoComplete="off" value={keyword} onChange={(event) => setKeyword(event.target.value)} maxLength={200}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); search() } }}
          className="min-h-11 min-w-0 flex-1 rounded-md border border-control-border bg-white px-3 text-sm" />
        <Button variant="secondary" onClick={search} loading={state.status === 'loading'} loadingLabel="Đang tìm…">Tìm</Button>
      </div>
      {state.status === 'error' && <p role="alert" className="mt-3 text-xs text-danger">Không thể tải danh sách. Bấm Tìm để thử lại.</p>}
      {state.status === 'success' && (!state.items.length ? <p role="status" className="mt-3 text-xs text-muted">Không tìm thấy kết quả phù hợp.</p>
        : <ul className="mt-3 max-h-48 overflow-y-auto rounded-md border border-border">
          {state.items.map((item) => <li key={item.id}><button type="button" onClick={() => onSelect(item)} aria-pressed={selected?.id === item.id}
            className={`min-h-11 w-full border-b border-border bg-white px-3 py-2 text-left text-sm last:border-0 hover:bg-[#F6F7F8] ${selected?.id === item.id ? 'font-semibold text-brand' : 'text-ink'}`}>{item.name} · #{item.id}</button></li>)}
        </ul>)}
    </fieldset>
  )
}
