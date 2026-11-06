import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import useToast from '../../components/ui/useToast.js'
import Pagination from '../../features/catalog/Pagination.jsx'
import AdminArticleEditor from '../../features/content/AdminArticleEditor.jsx'
import { ARTICLE_TYPES, ARTICLE_STATUSES, formatArticleDate } from '../../features/content/articleContent.js'
import articleService from '../../services/articleService.js'

export default function AdminArticlesPage() {
  const { addToast } = useToast()
  const [filters, setFilters] = useState({ type: '', status: '', page: 1 })
  const [retryKey, setRetryKey] = useState(0)
  const [state, setState] = useState({ status: 'loading', items: [], totalPages: 1, totalElements: 0 })
  const [editor, setEditor] = useState(null)
  const [opening, setOpening] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const editorSequence = useRef(0)
  const { type, status, page } = filters
  useEffect(() => () => { editorSequence.current += 1 }, [])
  useEffect(() => {
    let active = true
    articleService.listAdmin({ type, status, page }).then((result) => {
      if (!active) return
      if (page > result.totalPages) { setFilters((current) => ({ ...current, page: result.totalPages })); return }
      setState({ ...result, status: 'success' })
    }).catch(() => { if (active) setState((current) => ({ ...current, status: 'error' })) })
    return () => { active = false }
  }, [type, status, page, retryKey])
  const refresh = () => { setState((current) => ({ ...current, status: 'loading' })); setRetryKey((key) => key + 1) }
  const changeFilters = (next) => { setState((current) => ({ ...current, status: 'loading' })); setFilters(next) }
  const openEdit = async (id) => {
    if (opening !== null || deleting) return
    const sequence = ++editorSequence.current
    setOpening(id)
    try {
      const article = await articleService.getAdmin(id)
      if (sequence === editorSequence.current) setEditor({ article })
    } catch (error) {
      if (sequence === editorSequence.current) addToast({ type: 'error', message: error.message || 'Không thể tải bài viết.' })
    } finally { if (sequence === editorSequence.current) setOpening(null) }
  }
  const remove = async () => {
    if (deleting || !toDelete) return
    setDeleting(true)
    try {
      await articleService.delete(toDelete.id, toDelete.version)
      setToDelete(null); refresh()
      addToast({ type: 'success', message: 'Đã xóa bài viết.' })
    } catch (error) {
      addToast({ type: 'error', message: error.message || 'Không thể xóa bài viết.' })
      if (error.status === 409 || error.status === 404) { setToDelete(null); refresh() }
    } finally { setDeleting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-ink">Bài viết & Hướng dẫn</h1><p className="mt-2 text-sm text-muted">Quản lý nội dung văn hóa, nguồn gốc và hướng dẫn sử dụng, bảo quản.</p></div>
        <Button disabled={opening !== null || deleting} onClick={() => setEditor({ article: null })}><Plus size={18} aria-hidden="true" /> Tạo bản nháp</Button></div>
      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-white p-4">
        {[['type', 'Loại nội dung', ARTICLE_TYPES], ['status', 'Trạng thái', ARTICLE_STATUSES]].map(([key, label, options]) => <div key={key}><label htmlFor={`admin-article-${key}`} className="mb-2 block text-sm font-medium">{label}</label><select id={`admin-article-${key}`} value={filters[key]} onChange={(event) => changeFilters({ ...filters, [key]: event.target.value, page: 1 })} className="min-h-11 max-w-full rounded-md border border-control-border bg-white px-3 text-sm"><option value="">Tất cả</option>{Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>)}
      </div>
      <section aria-label="Danh sách nội dung" aria-busy={state.status === 'loading'} className="overflow-hidden rounded-xl border border-border bg-white">
        {state.status === 'loading' ? <p role="status" className="p-8 text-sm text-muted">Đang tải bài viết…</p>
          : state.status === 'error' ? <ErrorState message="Không thể tải danh sách nội dung. Vui lòng thử lại." onRetry={refresh} />
            : !state.items.length ? <EmptyState title="Chưa có nội dung phù hợp" message="Tạo bản nháp hoặc đổi bộ lọc để xem nội dung." />
              : <><p className="border-b border-border px-5 py-3 text-sm text-muted">{state.totalElements} bài viết & hướng dẫn</p><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#F6F7F8] text-muted"><tr><th scope="col" className="px-5 py-3">Tiêu đề</th><th scope="col" className="px-4 py-3">Loại</th><th scope="col" className="px-4 py-3">Trạng thái</th><th scope="col" className="px-4 py-3">Cập nhật</th><th scope="col" className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody>
                {state.items.map((article) => <tr key={article.id} className="border-t border-border"><td className="max-w-sm break-words px-5 py-4 font-medium text-ink">{article.title}</td><td className="px-4 py-4 text-muted">{ARTICLE_TYPES[article.type]}</td><td className={`px-4 py-4 font-medium ${article.status === 'PUBLISHED' ? 'text-jade' : 'text-muted'}`}>{ARTICLE_STATUSES[article.status]}</td><td className="whitespace-nowrap px-4 py-4 text-muted">{formatArticleDate(article.updatedAt)}</td><td className="px-4 py-2"><div className="flex justify-end gap-2"><button type="button" disabled={opening !== null || deleting} onClick={() => openEdit(article.id)} aria-label={`Sửa ${article.title}`} className="flex h-11 w-11 items-center justify-center rounded-lg border border-control-border text-ink hover:bg-[#F6F7F8] disabled:opacity-50"><Pencil size={17} aria-hidden="true" /></button><button type="button" disabled={opening !== null || deleting} onClick={() => setToDelete(article)} aria-label={`Xóa ${article.title}`} className="flex h-11 w-11 items-center justify-center rounded-lg border border-control-border text-danger hover:bg-[#F6F7F8] disabled:opacity-50"><Trash2 size={17} aria-hidden="true" /></button></div></td></tr>)}
              </tbody></table></div><Pagination currentPage={page} totalPages={state.totalPages} onPageChange={(next) => changeFilters({ ...filters, page: next })} /></>}
      </section>
      {opening !== null && <p role="status" className="text-sm text-muted">Đang tải nội dung để sửa…</p>}
      {editor && <AdminArticleEditor key={editor.article?.id || 'new'} article={editor.article} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); refresh(); addToast({ type: 'success', message: 'Đã lưu nội dung bài viết.' }) }} />}
      <ConfirmDialog isOpen={Boolean(toDelete)} title="Xóa bài viết / hướng dẫn?" description={`Nội dung “${toDelete?.title || ''}” sẽ bị xóa và không còn xuất hiện trên website.`} confirmLabel="Xóa nội dung" isLoading={deleting} onCancel={() => !deleting && setToDelete(null)} onConfirm={remove} />
    </div>
  )
}
