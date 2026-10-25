import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

function ArtisanCard({ artisan }) {
  if (!artisan) return null

  return (
    <RouterLink
      aria-label={`Xem câu chuyện của ${artisan.name}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-[border-color,box-shadow] duration-300 hover:border-brand/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 no-underline select-none cursor-pointer"
      href={CUSTOMER_ROUTES.artisanDetail(artisan.id)}
    >
      {/* 1. Portrait Visual Frame (4:5 Aspect Ratio) */}
      <div className="aspect-4/5 w-full overflow-hidden bg-surface-secondary relative">
        <img
          alt={artisan.name}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
          decoding="async"
          height="450"
          loading="lazy"
          src={artisan.avatar || '/assets/images/vietnamese-instrument-shop.jpg'}
          width="360"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity pointer-events-none" />

        {/* Bottom Metadata on Image */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          {artisan.province && (
            <p className="text-xs text-white/80 font-medium truncate">{artisan.province}</p>
          )}
          <h3 className="text-lg sm:text-xl font-bold font-sans text-white group-hover:text-brand-soft transition-colors mt-0.5 leading-snug">
            {artisan.name}
          </h3>
        </div>
      </div>

      {/* 2. Content Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3 justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3">
            {artisan.description || 'Thông tin câu chuyện của nghệ nhân đang được cập nhật.'}
          </p>
        </div>

        {/* Tags and Experience */}
        <div className="pt-2 border-t border-border/60 flex flex-col gap-2.5">
          {artisan.specialties && artisan.specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {artisan.specialties.slice(0, 2).map((sp) => (
                <span
                  key={sp}
                  className="px-2 py-0.5 rounded bg-surface-secondary text-xs font-medium text-ink/80 border border-border/60 truncate max-w-[180px]"
                >
                  #{sp}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 text-xs pt-0.5">
            <span className="font-bold text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Xem câu chuyện <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </div>
    </RouterLink>
  )
}

export default ArtisanCard
