import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

function VillageCard({ village }) {
  if (!village) return null

  // Route to Craft Village Detail view
  const villageDetailUrl = CUSTOMER_ROUTES.craftVillageDetail(village.slug || village.id)

  return (
    <RouterLink
      aria-label={`Khám phá ${village.name}`}
      className="group flex flex-col h-full rounded-2xl bg-surface border border-border overflow-hidden shadow-xs hover:shadow-md hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 transition-all duration-300 no-underline select-none cursor-pointer"
      href={villageDetailUrl}
    >
      {/* 1. Landscape Visual Frame (16:10 Aspect Ratio) */}
      <div className="aspect-16/10 w-full overflow-hidden bg-surface-secondary relative">
        <img
          alt={village.name}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
          decoding="async"
          height="320"
          loading="lazy"
          src={village.coverImage}
          width="520"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-75 group-hover:opacity-65 transition-opacity pointer-events-none" />

        {/* Top Tag */}
        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white/95 backdrop-blur-xs text-ink border border-border/80 tracking-wider uppercase shadow-2xs">
          Làng nghề di sản
        </span>

        {/* Bottom Headline on Image */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="text-xs text-white/80 font-medium">
            {village.province} · {village.craft}
          </p>
          <h3 className="text-lg sm:text-xl font-bold font-sans text-white group-hover:text-brand-soft transition-colors mt-0.5 leading-snug">
            {village.name}
          </h3>
        </div>
      </div>

      {/* 2. Content Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3 justify-between">
        <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3">
          {village.description}
        </p>

        {/* Metrics & Action Link */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-subtle font-medium">
            {village.artisanCount ? (
              <span>
                <strong className="text-ink font-semibold">{village.artisanCount}</strong> nghệ nhân
              </span>
            ) : null}
            {village.productCount ? (
              <span>
                <strong className="text-ink font-semibold">{village.productCount}</strong> sản phẩm
              </span>
            ) : null}
          </div>

          <span className="font-bold text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
            Khám phá làng nghề <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </RouterLink>
  )
}

export default VillageCard
