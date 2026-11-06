import { useEffect, useState } from 'react'
import chatService from '../../services/chatService.js'
import Button from '../../components/ui/Button.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'

const dateTime = (value) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—'

function Transcript({ conversation }) {
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    let active = true
    chatService.getAdminMessages(conversation.id, page).then((data) => {
      if (active) setState({ data, loading: false })
    }).catch((error) => { if (active) setState({ error: error.message || 'Không thể tải tin nhắn.', loading: false }) })
    return () => { active = false }
  }, [conversation.id, page, retry])
  const reload = () => { setState({ loading: true }); setRetry((value) => value + 1) }
  const changePage = (value) => { setState({ loading: true }); setPage(value) }
  return <section className="rounded-xl border border-border bg-white min-w-0 p-4 space-y-4" aria-label="Nội dung đối thoại">
    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-border pb-3">
      <div className="min-w-0"><h2 className="font-semibold break-words">{conversation.customerName}</h2><p className="text-xs text-muted break-all">{conversation.customerEmail}</p><p className="text-xs text-muted mt-1">Người phụ trách: {conversation.assignedStaffName || 'Chưa phân công'}</p></div>
      <Button variant="secondary" size="sm" disabled={state.loading} onClick={reload}>Làm mới tin nhắn</Button>
    </div>
    {state.loading ? <LoadingState message="Đang tải tin nhắn…" /> : state.error ? <ErrorState message={state.error} onRetry={reload} /> : !state.data.content.length ? <EmptyState title="Chưa có tin nhắn" /> : <>
      <p className="text-xs text-muted">Trang 1 chứa tin nhắn mới nhất.</p>
      <ol className="space-y-3 max-h-[65vh] overflow-y-auto overscroll-contain p-1">{[...state.data.content].reverse().map((message) => <li key={message.id} className={`rounded-lg border border-border p-3 ${message.senderRole === 'CUSTOMER' ? 'bg-white' : 'bg-surface-secondary'}`}>
        <div className="flex flex-wrap justify-between gap-2 text-xs"><strong className="break-words">{message.senderName} · {message.senderRole === 'CUSTOMER' ? 'Khách hàng' : 'Nhân viên'}</strong><time className="text-muted" dateTime={message.createdAt}>{dateTime(message.createdAt)}</time></div>
        <p className="text-sm whitespace-pre-wrap break-words mt-2">{message.content}</p>
      </li>)}</ol>
      <div className="flex justify-end items-center gap-2 text-xs"><Button variant="ghost" size="sm" disabled={page === 0} onClick={() => changePage(page - 1)}>Mới hơn</Button><span>Trang {page + 1}/{Math.max(1, state.data.totalPages)}</span><Button variant="ghost" size="sm" disabled={page + 1 >= state.data.totalPages} onClick={() => changePage(page + 1)}>Cũ hơn</Button></div>
    </>}
  </section>
}

export default function AdminChatPage() {
  const [input, setInput] = useState('')
  const [filters, setFilters] = useState({ search: '', status: '', page: 0 })
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ loading: true })
  const [selected, setSelected] = useState(null)
  useEffect(() => {
    let active = true
    chatService.getAdminConversations(filters).then((data) => {
      if (!active) return
      // Another staff member may change a conversation's filtered status.
      if (filters.page > 0 && filters.page >= data.totalPages) {
        setFilters((current) => ({ ...current, page: Math.max(0, data.totalPages - 1) }))
        return
      }
      setState({ data, loading: false })
    }).catch((error) => { if (active) setState({ error: error.message || 'Không thể tải đối thoại.', loading: false }) })
    return () => { active = false }
  }, [filters, retry])
  const changeFilters = (value) => { setSelected(null); setState({ loading: true }); setFilters(value) }
  const reload = () => { setSelected(null); setState({ loading: true }); setRetry((value) => value + 1) }
  return <div className="space-y-5">
    <div><h1 className="text-xl font-bold">Đối thoại khách hàng</h1><p className="text-sm text-muted mt-1">Xem lịch sử tư vấn giữa nhân viên và khách hàng.</p></div>
    <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); changeFilters({ ...filters, search: input.trim(), page: 0 }) }}>
      <label className="flex-1 min-w-48 text-xs font-semibold space-y-1">Tìm khách hàng hoặc người phụ trách<input name="chatSearch" autoComplete="off" maxLength={100} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tên hoặc email khách hàng…" className="block w-full rounded-lg border border-border bg-white px-3 min-h-11 text-sm" /></label>
      <label className="text-xs font-semibold space-y-1">Trạng thái<select name="chatStatus" value={filters.status} onChange={(event) => changeFilters({ ...filters, status: event.target.value, page: 0 })} className="block min-h-11 rounded-lg border border-border bg-white px-3 text-sm"><option value="">Tất cả</option><option value="OPEN">Đang mở</option><option value="CLOSED">Đã kết thúc</option></select></label>
      <Button type="submit" disabled={state.loading}>Tìm kiếm</Button><Button variant="secondary" onClick={reload} disabled={state.loading}>Làm mới</Button>
    </form>
    {state.loading ? <LoadingState message="Đang tải đối thoại…" /> : state.error ? <ErrorState message={state.error} onRetry={reload} /> : !state.data.content.length ? <EmptyState title="Không có đối thoại phù hợp" /> : <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="rounded-xl border border-border bg-white overflow-hidden min-w-0"><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-surface-secondary"><tr><th className="p-3">Khách hàng</th><th className="p-3">Người phụ trách</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr></thead><tbody>{state.data.content.map((conversation) => <tr key={conversation.id} className="border-t border-border"><td className="p-3"><strong className="break-words">{conversation.customerName}</strong><p className="text-xs text-muted mt-1">{dateTime(conversation.lastMessageAt || conversation.createdAt)}</p></td><td className="p-3">{conversation.assignedStaffName || 'Chưa phân công'}</td><td className="p-3">{conversation.status === 'CLOSED' ? 'Đã kết thúc' : 'Đang mở'}</td><td className="p-3"><Button size="sm" variant="secondary" aria-pressed={selected?.id === conversation.id} onClick={() => setSelected(conversation)}>Xem</Button></td></tr>)}</tbody></table></div>
          <div className="flex justify-end items-center gap-2 text-xs p-3 border-t border-border"><Button variant="ghost" size="sm" disabled={filters.page === 0} onClick={() => changeFilters({ ...filters, page: filters.page - 1 })}>Trước</Button><span>Trang {filters.page + 1}/{Math.max(1, state.data.totalPages)}</span><Button variant="ghost" size="sm" disabled={filters.page + 1 >= state.data.totalPages} onClick={() => changeFilters({ ...filters, page: filters.page + 1 })}>Sau</Button></div>
        </div>
        {selected ? <Transcript key={selected.id} conversation={selected} /> : <div className="rounded-xl border border-border bg-white p-6 text-sm text-muted">Chọn “Xem” để đọc nội dung tư vấn.</div>}
      </div>
    </>}
  </div>
}
