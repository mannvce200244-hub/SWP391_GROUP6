import { useEffect, useId, useState } from 'react'
import articleService from '../../services/articleService.js'
import ArticleCard from './ArticleCard.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

export default function RelatedArticles({ productId, artisanId, craftVillageId }) {
  const headingId = useId()
  const [state, setState] = useState({ status: 'loading', items: [] })
  const [retryKey, setRetryKey] = useState(0)
  useEffect(() => {
    let active = true
    articleService.listPublished({ productId, artisanId, craftVillageId, size: 3 }).then((result) => {
      if (active) setState({ ...result, status: 'success' })
    }).catch(() => { if (active) setState({ status: 'error', items: [] }) })
    return () => { active = false }
  }, [productId, artisanId, craftVillageId, retryKey])
  const filters = new URLSearchParams()
  if (productId) filters.set('productId', productId)
  if (artisanId) filters.set('artisanId', artisanId)
  if (craftVillageId) filters.set('craftVillageId', craftVillageId)

  return (
    <section aria-labelledby={headingId} aria-busy={state.status === 'loading'} className="mt-10 border-t border-border py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-xl font-bold text-ink sm:text-2xl">Bài viết & Hướng dẫn liên quan</h2>
        {state.items.length > 0 && <RouterLink href={`${CUSTOMER_ROUTES.articles}?${filters}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand">Xem tất cả →</RouterLink>}
      </div>
      {state.status === 'loading' ? <p role="status" className="mt-5 text-sm text-muted">Đang tải nội dung liên quan…</p>
        : state.status === 'error' ? <ErrorState message="Không thể tải bài viết liên quan." onRetry={() => { setState({ status: 'loading', items: [] }); setRetryKey((key) => key + 1) }} />
          : state.items.length ? state.items.map((article) => <ArticleCard key={article.id} article={article} />)
            : <p className="mt-5 text-sm text-muted">Chưa có bài viết hoặc hướng dẫn liên quan được xuất bản.</p>}
    </section>
  )
}
