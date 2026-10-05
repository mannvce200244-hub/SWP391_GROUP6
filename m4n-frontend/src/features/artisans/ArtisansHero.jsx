import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'

function ArtisansHero({ onSelectTab, stats = { artisans: 8, crafts: 6, villages: 8 } }) {
  const scrollToDiscovery = (tab) => {
    if (onSelectTab) {
      onSelectTab(tab)
    }
    const discoveryEl = document.getElementById('heritage-discovery')
    if (discoveryEl) {
      discoveryEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      aria-labelledby="artisans-hero-title"
      className="relative py-12 sm:py-16 lg:py-20 bg-surface border-b border-border/80 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Editorial Heading & Direct Actions */}
        <div className="lg:col-span-6 flex flex-col gap-5 sm:gap-6">
          <EditorialEyebrow
            className="self-start"
            label="DI SẢN SỐNG CỦA VIỆT NAM"
          />

          <h1
            id="artisans-hero-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink font-sans tracking-tight leading-[1.18]"
          >
            Nơi những đôi tay <br />
            <span className="text-brand">gìn giữ hồn Việt</span>
          </h1>

          <p className="text-base sm:text-lg text-muted leading-relaxed max-w-xl">
            Khám phá câu chuyện của những nghệ nhân, những làng nghề và hành trình tạo nên các sản phẩm thủ công mang bản sắc Việt Nam.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button
              className="inline-flex items-center justify-center font-bold transition-all bg-brand text-white hover:bg-brand-hover hover:-translate-y-0.5 shadow-sm hover:shadow-md h-12 px-6 sm:px-7 text-sm sm:text-base rounded-xl cursor-pointer"
              onClick={() => scrollToDiscovery('artisans')}
              type="button"
            >
              Khám phá nghệ nhân
            </button>
            <button
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-ink hover:text-brand bg-surface border border-border hover:border-brand/40 hover:bg-surface-secondary px-5 sm:px-6 h-12 rounded-xl transition-all shadow-xs cursor-pointer"
              onClick={() => scrollToDiscovery('villages')}
              type="button"
            >
              <span>Khám phá làng nghề</span>
              <span aria-hidden="true">↓</span>
            </button>
          </div>

          {/* Authentic Real Metrics */}
          <div className="pt-4 sm:pt-6 grid grid-cols-3 gap-4 border-t border-border/70 max-w-lg">
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-ink font-sans">
                {String(stats.artisans).padStart(2, '0')}+
              </p>
              <p className="text-xs text-muted font-medium mt-0.5">Nghệ nhân tiêu biểu</p>
            </div>
            <div className="border-l border-border/70 pl-4">
              <p className="text-xl sm:text-2xl font-extrabold text-brand font-sans">
                {String(stats.villages).padStart(2, '0')}+
              </p>
              <p className="text-xs text-muted font-medium mt-0.5">Làng nghề truyền thống</p>
            </div>
            <div className="border-l border-border/70 pl-4">
              <p className="text-xl sm:text-2xl font-extrabold text-jade font-sans">
                {String(stats.crafts).padStart(2, '0')}
              </p>
              <p className="text-xs text-muted font-medium mt-0.5">Ngành nghề thủ công</p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentic Workshop Photo Frame */}
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg bg-surface-secondary aspect-4/3 lg:aspect-16/11 group">
            <img
              alt="Đôi bàn tay nghệ nhân Việt Nam tỉ mẩn chế tác sản phẩm thủ công truyền thống"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
              decoding="async"
              fetchPriority="high"
              height="620"
              src="/assets/images/auth-craft-showcase.jpg"
              width="860"
            />

            {/* Bottom Authentic Metadata Badge */}
            <div
              className="absolute bottom-4 left-4 right-4 sm:right-auto inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-medium border border-white/15 shadow-md"
              aria-hidden="true"
            >
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="font-semibold">Nghệ nhân làng nghề</span>
              <span className="text-white/40">·</span>
              <span className="text-white/80">Kỹ nghệ thủ công truyền thống</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ArtisansHero
