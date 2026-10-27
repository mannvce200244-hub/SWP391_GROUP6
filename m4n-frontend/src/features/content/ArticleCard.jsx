import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'
import { ARTICLE_TYPES, formatArticleDate, isArticleMediaUrl } from './articleContent.js'

export default function ArticleCard({ article }) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = article.imageUrl && isArticleMediaUrl(article.imageUrl) && !imageFailed
  return (
    <article className="min-w-0 border-b border-border py-6 sm:py-8">
      <RouterLink href={CUSTOMER_ROUTES.articleDetail(article.id)} className="group grid gap-5 sm:grid-cols-[160px_1fr] focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4">
        {hasImage ? <img src={article.imageUrl} alt="" width="320" height="240" loading="lazy" onError={() => setImageFailed(true)} className="aspect-4/3 w-full rounded-lg object-cover sm:w-40" />
          : <div className="flex aspect-4/3 items-center justify-center rounded-lg bg-[#F6F7F8] p-4 text-sm font-medium text-muted sm:w-40" aria-hidden="true">M4N · Văn hóa</div>}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted">
            <span>{ARTICLE_TYPES[article.type]}</span>
            {article.publishedAt && <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>}
          </div>
          <h3 className="mt-2 break-words text-xl font-semibold leading-snug text-ink group-hover:text-brand sm:text-2xl">{article.title}</h3>
          {article.summary && <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-muted">{article.summary}</p>}
          <span className="mt-4 inline-block text-sm font-semibold text-brand">Đọc bài viết <span aria-hidden="true">→</span></span>
        </div>
      </RouterLink>
    </article>
  )
}
