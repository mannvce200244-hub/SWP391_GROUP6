import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

function ArtisansCTA({ onScrollToArtisans }) {
  const handleScroll = () => {
    if (onScrollToArtisans) {
      onScrollToArtisans()
    } else {
      const discoveryEl = document.getElementById('heritage-discovery')
      if (discoveryEl) {
        discoveryEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <section aria-labelledby="artisans-cta-heading" className="bg-footer relative overflow-hidden">
      {/* Background Layer: Subtle geometric acoustic dot pattern */}
      <div
        className="absolute inset-0 opacity-15 bg-[radial-gradient(#E3E6E8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 flex flex-col items-center text-center gap-6 relative z-10">
        <span className="resonance-motif text-white/80" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>

        <h2
          id="artisans-cta-heading"
          className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white max-w-2xl font-sans leading-snug"
        >
          Giữ nghề bắt đầu từ việc <br className="hidden sm:inline" />
          biết câu chuyện phía sau sản phẩm.
        </h2>

        <p className="text-sm sm:text-base text-neutral-300 max-w-xl leading-relaxed">
          Khám phá những sản phẩm thủ công được tạo nên bởi người Việt, tại những làng nghề mang trong mình nhiều thế hệ ký ức.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <RouterLink
            className="inline-flex items-center justify-center font-bold transition-all bg-brand text-white hover:bg-brand-hover hover:-translate-y-0.5 shadow-md h-12 px-7 text-sm sm:text-base rounded-xl cursor-pointer"
            href={CUSTOMER_ROUTES.products}
          >
            Khám phá sản phẩm
          </RouterLink>

          <button
            className="inline-flex items-center gap-2 font-semibold transition-all bg-surface/10 hover:bg-surface/20 text-white border border-white/20 h-12 px-6 text-sm sm:text-base rounded-xl backdrop-blur-xs cursor-pointer"
            onClick={handleScroll}
            type="button"
          >
            <span>Gặp gỡ nghệ nhân</span>
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ArtisansCTA
