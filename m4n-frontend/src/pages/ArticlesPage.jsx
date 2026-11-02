import { useEffect, useState } from 'react'
import EditorialEyebrow from '../components/common/EditorialEyebrow.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { ArticleListSkeleton } from '../components/ui/Skeleton.jsx'
import ArticleCard from '../features/content/ArticleCard.jsx'
import { ARTICLE_TYPES } from '../features/content/articleContent.js'
import Pagination from '../features/catalog/Pagination.jsx'
import articleService from '../services/articleService.js'

function readFilters() {
  const query = new URLSearchParams(window.location.search)
  const ids = {}
  for (const key of ['productId', 'artisanId', 'craftVillageId']) {
    const value = query.get(key)
    if (value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))) ids[key] = Number(value)
  }
  const requestedPage = Number(query.get('page'))
  return { ...ids, type: ARTICLE_TYPES[query.get('type')] ? query.get('type') : '',
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1 }
}

export default function ArticlesPage() {
  const [filters, setFilters] = useState(readFilters)
  const [retryKey, setRetryKey] = useState(0)
  const [state, setState] = useState({ status: 'loading', items: [], totalPages: 1, totalElements: 0 })
  const { type, page, productId, artisanId, craftVillageId } = filters

  useEffect(() => {
    const onPopState = () => { setState((current) => ({ ...current, status: 'loading' })); setFilters(readFilters()); setRetryKey((key) => key + 1) }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let active = true
    articleService.listPublished({ type, page, productId, artisanId, craftVillageId }).then((result) => {
      if (!active) return
      if (page > result.totalPages) {
        setFilters((current) => ({ ...current, page: result.totalPages }))
        const query = new URLSearchParams(window.location.search)
        if (result.totalPages > 1) query.set('page', result.totalPages)
        else query.delete('page')
        window.history.replaceState(null, '', `${window.location.pathname}${query.size ? `?${query}` : ''}`)
        return
      }
      setState({ ...result, status: 'success' })
    }).catch(() => { if (active) setState((current) => ({ ...current, status: 'error' })) })
    return () => { active = false }
  }, [type, page, productId, artisanId, craftVillageId, retryKey])

  const changeFilters = (next) => {
    setState((current) => ({ ...current, status: 'loading' }))
    setFilters(next)
    const query = new URLSearchParams()
    Object.entries(next).forEach(([key, value]) => { if (value && !(key === 'page' && value === 1)) query.set(key, value) })
    window.history.replaceState(null, '', `${window.location.pathname}${query.size ? `?${query}` : ''}`)
  }
  const retry = () => { setState((current) => ({ ...current, status: 'loading' })); setRetryKey((key) => key + 1) }
  const filteredByAssociation = productId || artisanId || craftVillageId

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <EditorialEyebrow label="VĂN HÓA & TRI THỨC" />
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-5xl">Câu chuyện của nhạc cụ</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Khám phá nhạc cụ truyền thống, nghệ nhân, làng nghề và hướng dẫn sử dụng, bảo quản từ M4N.</p>
      <div className="mt-8 flex flex-wrap items-end gap-4 border-b border-border pb-6">
        <div>
          <label htmlFor="article-type-filter" className="mb-2 block text-sm font-medium text-ink">Loại nội dung</label>
          <select id="article-type-filter" value={type} onChange={(event) => changeFilters({ ...filters, type: event.target.value, page: 1 })} className="min-h-11 max-w-full rounded-lg border border-control-border bg-white px-3 text-sm">
            <option value="">Tất cả bài viết & hướng dẫn</option>
            {Object.entries(ARTICLE_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {filteredByAssociation && <button type="button" onClick={() => changeFilters({ type, page: 1 })} className="min-h-11 px-3 text-sm font-semibold text-brand">Xem tất cả nội dung</button>}
      </div>
      <section aria-labelledby="articles-list-heading" aria-busy={state.status === 'loading'}>
        <h2 id="articles-list-heading" className="sr-only">Danh sách bài viết và hướng dẫn</h2>
        {state.status === 'loading' ? <ArticleListSkeleton />
          : state.status === 'error' ? <ErrorState message="Không thể tải bài viết lúc này. Vui lòng thử lại." onRetry={retry} />
            : !state.items.length ? <EmptyState title="Chưa có bài viết" message="Nội dung phù hợp chưa được xuất bản. Bạn có thể chọn loại nội dung khác hoặc quay lại sau." />
              : <><p className="pt-5 text-sm text-muted">{state.totalElements} bài viết & hướng dẫn</p>{state.items.map((article) => <ArticleCard key={article.id} article={article} />)}
                <Pagination currentPage={page} totalPages={state.totalPages} onPageChange={(next) => { changeFilters({ ...filters, page: next }); window.scrollTo(0, 0) }} /></>}
      </section>
    </div>
  )
}
