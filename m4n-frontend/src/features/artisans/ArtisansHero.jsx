import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'

function ArtisansHero({ stats = { artisans: 8, crafts: 6, villages: 8 } }) {
  return (
    <section
      aria-labelledby="artisans-hero-title"
      className="relative py-8 sm:py-12 lg:py-14 bg-surface border-b border-border/80 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Heading & Description */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <EditorialEyebrow
            className="self-start"
            label="DI SẢN NGHỆ NHÂN & LÀNG NGHỀ"
          />

          <h1
            id="artisans-hero-title"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink font-sans tracking-tight leading-[1.2]"
          >
            Nơi những đôi tay <span className="text-brand">gìn giữ hồn Việt</span>
          </h1>

          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-2xl">
            Khám phá câu chuyện của những nghệ nhân tài hoa và các làng nghề trăm năm tuổi tạo nên thanh âm mộc mạc của nhạc cụ truyền thống Việt Nam.
          </p>

          {/* Authentic Metrics Strip */}
          <div className="pt-3 flex flex-wrap items-center gap-6 sm:gap-8 border-t border-border/70 max-w-lg">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-ink font-sans">
                {String(stats.artisans).padStart(2, '0')}+
              </span>
              <span className="text-xs text-muted font-medium">Nghệ nhân</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-brand font-sans">
                {String(stats.villages).padStart(2, '0')}+
              </span>
              <span className="text-xs text-muted font-medium">Làng nghề</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-jade font-sans">
                {String(stats.crafts).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted font-medium">Ngành nghề</span>
            </div>
          </div>
        </div>

        {/* Right Column: Workshop Frame */}
        <div className="lg:col-span-5">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-xs bg-surface-secondary aspect-16/10 sm:aspect-2/1 lg:aspect-16/10 group">
            <img
              alt="Nghệ nhân chế tác nhạc cụ truyền thống tại xưởng thủ công"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
              decoding="async"
              fetchPriority="high"
              height="400"
              src="/assets/images/auth-craft-showcase.jpg"
              width="600"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

            <div
              className="absolute bottom-3 left-3 right-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-xs text-white text-xs font-medium border border-white/10"
              aria-hidden="true"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              <span className="font-semibold text-white/95">Kỹ nghệ thủ công truyền thống</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ArtisansHero
