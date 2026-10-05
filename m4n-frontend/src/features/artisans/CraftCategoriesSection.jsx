import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'

function CraftCategoriesSection({ categories = [], onSelectCraft }) {
  const handleClick = (craftFilter) => {
    if (onSelectCraft) {
      onSelectCraft(craftFilter)
    }
    const discoveryEl = document.getElementById('heritage-discovery')
    if (discoveryEl) {
      discoveryEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      aria-labelledby="craft-categories-heading"
      className="py-16 sm:py-20 bg-surface border-t border-border/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 sm:gap-10">
        <div className="max-w-2xl flex flex-col gap-2">
          <EditorialEyebrow label="KHÁM PHÁ THEO NGHỀ" />
          <h2
            id="craft-categories-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans"
          >
            Một Việt Nam qua những nghề thủ công
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Mỗi nghề truyền thống là kết tinh của nguồn nguyên liệu tự nhiên bản địa và óc thẩm mỹ được truyền thừa qua nhiều thế hệ người Việt.
          </p>
        </div>

        {/* 3x2 Visual Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="group flex flex-col rounded-2xl overflow-hidden bg-surface border border-border shadow-xs hover:shadow-md hover:border-brand/40 transition-all duration-300 text-left cursor-pointer"
              onClick={() => handleClick(cat.craftFilter)}
              type="button"
            >
              {/* Photo */}
              <div className="aspect-16/10 w-full overflow-hidden bg-surface-secondary relative">
                <img
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  decoding="async"
                  height="260"
                  loading="lazy"
                  src={cat.image}
                  width="420"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />
              </div>

              {/* Text */}
              <div className="p-5 flex flex-col gap-1.5 flex-1 justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink group-hover:text-brand transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed mt-1">
                    {cat.subtitle}
                  </p>
                </div>

                <span className="text-xs font-bold text-brand flex items-center gap-1.5 pt-3 border-t border-border/50 group-hover:translate-x-1 transition-transform">
                  Khám phá nghệ nhân & làng nghề <span aria-hidden="true">→</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CraftCategoriesSection
