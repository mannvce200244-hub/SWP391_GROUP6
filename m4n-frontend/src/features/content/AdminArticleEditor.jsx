import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import articleService from '../../services/articleService.js'
import ArticleAssociationPicker from './ArticleAssociationPicker.jsx'
import { ARTICLE_TYPES, ARTICLE_STATUSES, validateArticleForm } from './articleContent.js'

function initialForm(article) {
  return { title: article?.title || '', summary: article?.summary || '', content: article?.content || '',
    type: article?.type || 'ARTICLE', imageUrl: article?.imageUrl || '', videoUrl: article?.videoUrl || '', status: article?.status || 'DRAFT' }
}

function initialAssociations(article) {
  const selected = {}
  for (const kind of ['product', 'artisan', 'craftVillage']) selected[kind] = article?.[`${kind}Id`] ? { id: article[`${kind}Id`], name: article[`${kind}Name`] } : null
  return selected
}

export default function AdminArticleEditor({ article, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(article))
  const [associations, setAssociations] = useState(() => initialAssociations(article))
  const [version, setVersion] = useState(article?.version)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [pending, setPending] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [reloadOpen, setReloadOpen] = useState(false)
  const original = useRef(JSON.stringify({ form: initialForm(article), associations: initialAssociations(article) }))
  const formRef = useRef(null)
  const requestClose = () => {
    if (pending) return
    if (JSON.stringify({ form, associations }) !== original.current) setDiscardOpen(true)
    else onClose()
  }
  const dialogRef = useDialogFocus(true, requestClose, pending)
  const hasUnsavedChanges = useEffectEvent(() => JSON.stringify({ form, associations }) !== original.current)
  useEffect(() => {
    const protectUnsaved = (event) => {
      if (hasUnsavedChanges()) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', protectUnsaved)
    return () => window.removeEventListener('beforeunload', protectUnsaved)
  }, [])
  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }
  const fieldProps = (field) => ({ id: `article-${field}`, name: field, autoComplete: 'off', value: form[field], disabled: pending,
    onChange: (event) => change(field, event.target.value), 'aria-invalid': errors[field] ? 'true' : undefined,
    'aria-describedby': errors[field] ? `article-${field}-error` : undefined,
    className: 'min-h-11 w-full rounded-lg border border-control-border bg-white px-3 py-2 text-sm text-ink' })
  const fieldError = (field) => errors[field] && <p id={`article-${field}-error`} role="alert" className="mt-1.5 text-xs text-danger">{errors[field]}</p>
  const focusError = () => requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus())
  const submit = async (event) => {
    event.preventDefault()
    if (pending) return
    const validationErrors = validateArticleForm(form)
    setErrors(validationErrors)
    setServerError('')
    if (Object.keys(validationErrors).length) { focusError(); return }
    setPending(true)
    try {
      const { status, ...content } = form
      const payload = { ...content, productId: associations.product?.id ?? null, artisanId: associations.artisan?.id ?? null,
        craftVillageId: associations.craftVillage?.id ?? null }
      const saved = article ? await articleService.update(article.id, { ...payload, status, expectedVersion: version }) : await articleService.create(payload)
      onSaved(saved)
    } catch (error) {
      setErrors(error.fieldErrors || {})
      setServerError(error.message || 'Không thể lưu bài viết. Vui lòng thử lại.')
      setConflict(error.status === 409)
      focusError()
    } finally {
      setPending(false)
    }
  }
  const reload = async () => {
    if (pending) return
    setPending(true)
    try {
      const latest = await articleService.getAdmin(article.id)
      const nextForm = initialForm(latest)
      const nextAssociations = initialAssociations(latest)
      setForm(nextForm); setAssociations(nextAssociations); setVersion(latest.version)
      original.current = JSON.stringify({ form: nextForm, associations: nextAssociations })
      setConflict(false); setServerError(''); setErrors({}); setReloadOpen(false)
    } catch (error) {
      setServerError(error.message || 'Không thể tải bản mới. Vui lòng thử lại.')
      setReloadOpen(false)
    } finally { setPending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-5" onClick={(event) => { if (event.target === event.currentTarget) requestClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="article-editor-heading" tabIndex={-1}
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-border p-5">
          <h2 id="article-editor-heading" className="text-lg font-bold text-ink">{article ? 'Sửa bài viết / hướng dẫn' : 'Tạo bản nháp'}</h2>
          <button type="button" aria-label="Đóng trình sửa bài viết" disabled={pending} onClick={requestClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-[#F6F7F8]"><X size={20} aria-hidden="true" /></button>
        </div>
        <form ref={formRef} id="article-editor-form" noValidate onSubmit={submit} className="space-y-5 overflow-y-auto overscroll-contain p-5">
          {serverError && <div role="alert" className="rounded-lg border border-danger-border bg-white p-3 text-sm text-danger">
            <p>{serverError}</p>{conflict && article && <button type="button" onClick={() => setReloadOpen(true)} className="mt-2 min-h-11 font-semibold underline">Tải bản mới để kiểm tra</button>}
          </div>}
          <div><label htmlFor="article-title" className="mb-2 block text-sm font-medium">Tiêu đề <span className="text-danger">*</span></label><input {...fieldProps('title')} maxLength={200} required data-dialog-initial-focus />{fieldError('title')}</div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="article-type" className="mb-2 block text-sm font-medium">Loại nội dung <span className="text-danger">*</span></label><select {...fieldProps('type')}>{Object.entries(ARTICLE_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{fieldError('type')}</div>
            {article ? <div><label htmlFor="article-status" className="mb-2 block text-sm font-medium">Trạng thái xuất bản <span className="text-danger">*</span></label><select {...fieldProps('status')}>{Object.entries(ARTICLE_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{fieldError('status')}</div>
              : <p className="self-center text-sm text-muted">Bài mới được lưu thành bản nháp. Mở sửa để kiểm tra và xuất bản.</p>}
          </div>
          <div><label htmlFor="article-summary" className="mb-2 block text-sm font-medium">Tóm tắt (không bắt buộc)</label><textarea {...fieldProps('summary')} rows={3} maxLength={500} />{fieldError('summary')}</div>
          <div><label htmlFor="article-content" className="mb-2 block text-sm font-medium">Nội dung <span className="text-danger">*</span></label><textarea {...fieldProps('content')} rows={10} maxLength={30000} required />{fieldError('content')}<p className="mt-1.5 text-xs text-muted">Văn bản thuần, giữ xuống dòng. Tối đa 30.000 ký tự.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">{[['imageUrl', 'URL ảnh'], ['videoUrl', 'URL video']].map(([field, label]) => <div key={field}><label htmlFor={`article-${field}`} className="mb-2 block text-sm font-medium">{label} (không bắt buộc)</label><input {...fieldProps(field)} type="url" maxLength={500} placeholder="https://…" />{fieldError(field)}</div>)}</div>
          <p className="text-xs leading-5 text-muted">Chỉ dùng URL HTTPS. Video mở trên trang nguồn trong tab mới.</p>
          {[['product', 'Sản phẩm'], ['artisan', 'Nghệ nhân'], ['craftVillage', 'Làng nghề']].map(([kind, label]) => <ArticleAssociationPicker key={kind} kind={kind} label={label} selected={associations[kind]} disabled={pending}
            onSelect={(selected) => setAssociations((current) => ({ ...current, [kind]: selected }))} />)}
        </form>
        <div className="flex justify-end gap-3 border-t border-border p-4"><Button variant="quiet" disabled={pending} onClick={requestClose}>Hủy</Button><Button type="submit" form="article-editor-form" loading={pending} loadingLabel="Đang lưu…">{article ? 'Lưu thay đổi' : 'Lưu bản nháp'}</Button></div>
      </div>
      <ConfirmDialog isOpen={discardOpen} title="Bỏ thay đổi đang nhập?" description="Thay đổi chưa lưu sẽ bị mất." confirmLabel="Bỏ thay đổi" onCancel={() => setDiscardOpen(false)} onConfirm={onClose} />
      <ConfirmDialog isOpen={reloadOpen} title="Tải bản mới của bài viết?" description="Nội dung đang nhập sẽ được thay bằng dữ liệu đã lưu mới nhất. Kiểm tra lại trước khi lưu." confirmLabel="Tải bản mới" variant="primary" isLoading={pending} onCancel={() => setReloadOpen(false)} onConfirm={reload} />
    </div>
  )
}
