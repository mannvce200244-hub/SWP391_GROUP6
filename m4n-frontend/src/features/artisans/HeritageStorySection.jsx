import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'

function HeritageStorySection() {
  return (
    <section
      aria-labelledby="heritage-story-heading"
      className="py-16 sm:py-20 lg:py-24 bg-surface border-b border-border/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column (6 cols): Framed Visual Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-md bg-surface-secondary aspect-4/3 sm:aspect-16/11 group">
              <img
                alt="Nghệ nhân Việt Nam chế tác đàn truyền thống tại xưởng mộc di sản"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                decoding="async"
                height="600"
                loading="lazy"
                src="/assets/images/vietnamese-artisan-workshop.jpg"
                width="800"
              />

              {/* Floating Bottom Card / Caption */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-xs p-3.5 sm:p-4 rounded-xl bg-white/95 backdrop-blur-md border border-border/80 shadow-sm">
                <p className="text-xs font-bold text-ink font-serif">
                  Không gian chế tác nhạc cụ truyền thống
                </p>
                <p className="text-2xs text-muted mt-0.5">
                  Làng nghề Đào Xá · Thường Tín, Hà Nội
                </p>
              </div>

              {/* Top Accent Tag */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-semibold uppercase tracking-wider bg-white/95 backdrop-blur-md text-brand border border-brand/20 shadow-2xs">
                  Thủ công di sản
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (6 cols): Editorial Narrative */}
          <div className="lg:col-span-6 flex flex-col gap-5 sm:gap-6">
            <EditorialEyebrow label="GIỮ NGHỀ – GIỮ HỒN NƯỚC VIỆT" />

            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink font-serif leading-snug"
              id="heritage-story-heading"
            >
              Mỗi sản phẩm đều bắt đầu từ một câu chuyện
            </h2>

            <p className="text-sm sm:text-base text-ink/80 leading-relaxed">
              Đằng sau mỗi món đồ thủ công không chỉ là vật liệu và kỹ thuật. Đó còn là kinh nghiệm tích lũy qua nhiều thế hệ, là nét văn hóa đặc trưng của một vùng đất và là dấu ấn riêng của từng nghệ nhân chế tác.
            </p>

            {/* Editorial Pull Quote */}
            <div className="relative pl-5 sm:pl-6 border-l-2 border-brand py-1 my-1">
              <p className="font-serif italic text-base sm:text-lg text-ink leading-relaxed">
                “Chúng tôi không chỉ giới thiệu sản phẩm. Chúng tôi muốn kể trọn vẹn câu chuyện về người đã làm ra chúng.”
              </p>
              <span className="block mt-2 text-2xs uppercase tracking-widest font-semibold text-muted">
                — Tinh thần thủ công M4N
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              M4N kết nối trực tiếp với các xưởng nghề truyền thống, bảo chứng giá trị chân thực và mang âm sắc mộc mạc đến với những người trân quý văn hóa Việt.
            </p>

            {/* Three Heritage Pillars */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-border/70">
              <div className="flex flex-col">
                <span className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">100%</span>
                <span className="text-2xs sm:text-xs text-muted mt-0.5">Chế tác thủ công</span>
              </div>
              <div className="flex flex-col border-x border-border/60 px-3 sm:px-4">
                <span className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">8+</span>
                <span className="text-2xs sm:text-xs text-muted mt-0.5">Làng nghề lâu đời</span>
              </div>
              <div className="flex flex-col pl-1 sm:pl-2">
                <span className="font-serif text-xl sm:text-2xl font-bold text-jade tracking-tight">Độc bản</span>
                <span className="text-2xs sm:text-xs text-muted mt-0.5">Căn chỉnh âm sắc</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeritageStorySection
