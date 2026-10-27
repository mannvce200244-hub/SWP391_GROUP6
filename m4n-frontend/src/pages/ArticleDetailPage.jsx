import { useEffect, useState } from 'react'
import ErrorState from '../components/ui/ErrorState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'
import { ARTICLE_TYPES, formatArticleDate, isArticleMediaUrl } from '../features/content/articleContent.js'
import articleService from '../services/articleService.js'

export default function ArticleDetailPage({ articleId }) {
  const [state, setState] = useState({ status: 'loading', article: null })
  const [retryKey, setRetryKey] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => {
    let active = true
    articleService.getPublished(articleId).then((article) => {
      if (active) setState({ status: article ? 'success' : 'empty', article })
    }).catch(() => { if (active) setState({ status: 'error', article: null }) })
    return () => { active = false }
  }, [articleId, retryKey])
  useEffect(() => {
    if (!state.article?.title) return undefined
    const previousTitle = document.title
    document.title = `${state.article.title} · M4N`
    return () => { document.title = previousTitle }
  }, [state.article?.title])
  const retry = () => { setState({ status: 'loading', article: null }); setRetryKey((key) => key + 1) }
  const article = state.article

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <RouterLink href={CUSTOMER_ROUTES.articles} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand">← Bài viết & Hướng dẫn</RouterLink>
      {state.status === 'loading' ? <p role="status" className="py-12 text-muted">Đang tải bài viết…</p>
        : state.status === 'error' ? <ErrorState message="Không thể tải nội dung bài viết. Vui lòng thử lại." onRetry={retry} />
          : !article ? <EmptyState title="Không tìm thấy bài viết" message="Bài viết chưa được xuất bản hoặc đường dẫn không còn hiệu lực." />
            : <article className="mt-6">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted"><span>{ARTICLE_TYPES[article.type]}</span>{article.publishedAt && <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>}</div>
              <h1 className="mt-4 break-words text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">{article.title}</h1>
              {article.summary && <p className="mt-6 break-words text-lg leading-8 text-muted">{article.summary}</p>}
              {article.imageUrl && isArticleMediaUrl(article.imageUrl) && !imageFailed && <img src={article.imageUrl} alt={article.title} width="1200" height="800" onError={() => setImageFailed(true)} className="mt-8 aspect-3/2 w-full rounded-xl object-cover" />}
              <div className="mt-10 whitespace-pre-wrap break-words text-base leading-8 text-ink sm:text-lg sm:leading-9">{article.content}</div>
              {article.videoUrl && isArticleMediaUrl(article.videoUrl) && <a href={article.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-11 items-center rounded-lg border border-control-border px-5 text-sm font-semibold text-brand">Xem video liên quan <span className="ml-2 text-muted">(mở trang mới)</span></a>}
              {(article.productId || article.artisanId || article.craftVillageId) && <section aria-labelledby="article-links-heading" className="mt-10 border-t border-border pt-6">
                <h2 id="article-links-heading" className="text-lg font-semibold text-ink">Khám phá nội dung liên quan</h2>
                <ul className="mt-3 space-y-2 text-sm font-medium text-brand">
                  {article.productId && <li><RouterLink href={CUSTOMER_ROUTES.productDetail(article.productId)} className="inline-flex min-h-11 items-center break-words">Nhạc cụ: {article.productName}</RouterLink></li>}
                  {article.artisanId && <li><RouterLink href={CUSTOMER_ROUTES.artisanDetail(article.artisanId)} className="inline-flex min-h-11 items-center break-words">Nghệ nhân: {article.artisanName}</RouterLink></li>}
                  {article.craftVillageId && <li><RouterLink href={CUSTOMER_ROUTES.craftVillageDetail(article.craftVillageId)} className="inline-flex min-h-11 items-center break-words">Làng nghề: {article.craftVillageName}</RouterLink></li>}
                </ul>
              </section>}
            </article>}
    </div>
  )
}
