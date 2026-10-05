import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

function FeaturedArtisanStory({ story }) {
  if (!story) return null

  const artisanProductsUrl = `${CUSTOMER_ROUTES.products}?artisan=${encodeURIComponent(
    story.artisanName,
  )}`

  return (
    <div className="my-10 sm:my-14 rounded-3xl bg-surface-secondary/60 border border-border overflow-hidden p-6 sm:p-8 lg:p-10 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column (5 cols): Photo */}
        <div className="lg:col-span-5 rounded-2xl overflow-hidden bg-surface border border-border/80 aspect-4/3 sm:aspect-16/11 lg:aspect-4/5 shadow-sm">
          <img
            alt={story.alt}
            className="w-full h-full object-cover"
            decoding="async"
            height="500"
            loading="lazy"
            src={story.image}
            width="400"
          />
        </div>

        {/* Right Column (7 cols): Story Details */}
        <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
          <EditorialEyebrow label={story.badge || 'CÂU CHUYỆN NGHỆ NHÂN'} />

          <h3 className="text-2xl sm:text-3xl font-bold font-sans text-ink tracking-tight leading-snug">
            {story.heading}
          </h3>

          {story.quote && (
            <blockquote className="font-serif italic text-sm sm:text-base text-ink-secondary border-l-2 border-brand/70 pl-4 py-1.5 my-1 bg-brand-soft/40 rounded-r-xl leading-relaxed">
              "{story.quote}"
            </blockquote>
          )}

          <p className="text-sm sm:text-base text-muted leading-relaxed">
            {story.storyContent}
          </p>

          {/* Quick specs pill row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-surface border border-border/60">
              <span className="text-muted block text-2xs uppercase tracking-wider font-semibold">Nghệ nhân</span>
              <span className="font-bold text-ink truncate block mt-0.5">{story.artisanName}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border/60">
              <span className="text-muted block text-2xs uppercase tracking-wider font-semibold">Làng nghề</span>
              <span className="font-bold text-ink truncate block mt-0.5">{story.village}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border/60">
              <span className="text-muted block text-2xs uppercase tracking-wider font-semibold">Kinh nghiệm</span>
              <span className="font-bold text-brand block mt-0.5">{story.experienceYears} năm làm nghề</span>
            </div>
          </div>

          <div className="pt-3">
            <RouterLink
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white hover:bg-brand-hover text-sm font-bold transition-all shadow-xs"
              href={artisanProductsUrl}
            >
              <span>Khám phá tác phẩm của nghệ nhân</span>
              <span aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturedArtisanStory
