import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'

function RegionExplorerSection({ onSelectRegion, regions = [] }) {
  const handleClickRegion = (regionId) => {
    if (onSelectRegion) {
      onSelectRegion(regionId)
    }
    const discoveryEl = document.getElementById('heritage-discovery')
    if (discoveryEl) {
      discoveryEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      aria-labelledby="region-explorer-heading"
      className="py-16 sm:py-20 bg-canvas border-t border-border/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 sm:gap-10">
        <div className="max-w-2xl flex flex-col gap-2">
          <EditorialEyebrow label="TỪ BẮC VÀO NAM" />
          <h2
            id="region-explorer-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans"
          >
            Hành trình qua những vùng đất của nghề
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Mỗi vùng miền mang một đặc trưng địa lý và thổ nhưỡng riêng biệt, định hình nên những nguyên liệu quý và phong cách chế tác độc đáo.
          </p>
        </div>

        {/* 3 Columns: Bắc - Trung - Nam */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {regions.map((region) => (
            <div
              key={region.id}
              className="flex flex-col rounded-2xl bg-surface border border-border overflow-hidden shadow-xs hover:shadow-md hover:border-brand/40 transition-all duration-300"
            >
              {/* Region Photo */}
              <div className="aspect-16/10 w-full overflow-hidden bg-surface-secondary relative">
                <img
                  alt={region.name}
                  className="w-full h-full object-cover"
                  decoding="async"
                  height="240"
                  loading="lazy"
                  src={region.image}
                  width="380"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <span className="absolute bottom-3 left-4 text-white text-lg font-bold font-sans">
                  {region.name}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6 flex flex-col flex-1 gap-3 justify-between">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-brand uppercase tracking-wider">
                    {region.tagline}
                  </p>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {region.description}
                  </p>
                </div>

                {/* Representative villages list */}
                <div className="pt-3 border-t border-border/60 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {region.villages.map((v) => (
                      <span
                        key={v}
                        className="px-2.5 py-1 rounded-md bg-surface-secondary text-xs font-medium text-ink/85 border border-border/60"
                      >
                        {v}
                      </span>
                    ))}
                  </div>

                  <button
                    className="inline-flex items-center justify-between text-xs font-bold text-brand hover:text-brand-hover pt-1 cursor-pointer group"
                    onClick={() => handleClickRegion(region.id)}
                    type="button"
                  >
                    <span>Xem nghệ nhân & làng nghề {region.name}</span>
                    <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RegionExplorerSection
