import { useState } from 'react'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'
import heroDanTranh from '../../assets/images/hero-dan-tranh.jpg'

/**
 * HomepageVideoSection — "Thanh âm Việt"
 * Features an authentic YouTube performance of Vietnamese traditional instruments
 * (Đàn Tranh, Đàn Bầu, Sáo Trúc, T'rưng) at Vietnam Pavilion Expo 2020.
 *
 * Provides a responsive 16:9 player with full click-to-play support across the entire container,
 * native controls, and privacy-compliant YouTube embedding.
 */
function HomepageVideoSection({
  videoId = 'qCJwlIxfPPI',
  videoTitle = 'Folk Music Vietnam | Vietnam Pavilion Expo 2020',
  sourceCaption = 'Biểu diễn nhạc cụ truyền thống Việt Nam · Vietnam Pavilion',
  youtubeUrl = 'https://www.youtube.com/watch?v=qCJwlIxfPPI',
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [posterUrl, setPosterUrl] = useState(
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  )

  const instruments = ['Đàn Tranh', 'Đàn Bầu', 'Sáo Trúc', "Đàn T'rưng"]

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleClose = () => {
    setIsPlaying(false)
  }

  return (
    <section
      aria-labelledby="video-experience-heading"
      className="py-16 sm:py-20 lg:py-24 bg-white border-y border-border/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT COLUMN (5 cols): Editorial Brand Marker, Heading & Copy */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
            <EditorialEyebrow label="THANH ÂM VIỆT" />

            <h2
              id="video-experience-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink font-sans tracking-tight leading-[1.25]"
            >
              Lắng nghe thanh âm của nhạc cụ Việt.
            </h2>

            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Không chỉ được cảm nhận qua hình dáng và chất liệu, nhạc cụ truyền
              thống còn mang bản sắc riêng trong từng âm thanh.
            </p>

            {/* Featured Traditional Instruments in this Performance */}
            <div className="flex flex-col gap-2.5 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted font-sans">
                Nhạc cụ diễn tấu trong tác phẩm:
              </span>
              <div className="flex flex-wrap gap-2">
                {instruments.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-md bg-surface-secondary text-xs font-semibold text-ink border border-border/70"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Small Source Caption */}
            <div className="flex items-center gap-2 pt-1 text-xs text-muted">
              <span
                className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
                aria-hidden="true"
              />
              <span className="font-medium">{sourceCaption}</span>
            </div>

            {/* Call to Action Navigation */}
            <div className="pt-2">
              <RouterLink
                href={CUSTOMER_ROUTES.products}
                className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-hover transition-colors group cursor-pointer"
              >
                <span>Khám phá bộ sưu tập nhạc cụ M4N</span>
                <span
                  aria-hidden="true"
                  className="group-hover:translate-x-1 transition-transform"
                >
                  →
                </span>
              </RouterLink>
            </div>
          </div>

          {/* RIGHT COLUMN (7 cols): Large Responsive YouTube Player (16:9) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="aspect-16/9 w-full rounded-lg overflow-hidden bg-neutral-950 border border-border/80 shadow-xs relative">
              {!isPlaying ? (
                /* Entire 16:9 Frame is Clickable to Play */
                <button
                  type="button"
                  onClick={handlePlay}
                  className="w-full h-full relative group cursor-pointer text-left block p-0 border-0 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg overflow-hidden select-none"
                  aria-label={`Phát video: ${videoTitle}`}
                >
                  <img
                    src={posterUrl}
                    alt={videoTitle}
                    className="w-full h-full object-cover filter brightness-90 group-hover:scale-101 transition-transform duration-500 ease-out"
                    loading="lazy"
                    decoding="async"
                    onError={() => setPosterUrl(heroDanTranh)}
                  />

                  {/* Subtle Contrast Gradient Overlay */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Corner Badge: Source attribution */}
                  <div className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded bg-black/65 backdrop-blur-xs text-[11px] font-semibold text-white flex items-center gap-2 border border-white/15 shadow-2xs pointer-events-none">
                    <span
                      className="resonance-motif text-brand"
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                    <span>Vietnam Pavilion · Expo 2020</span>
                  </div>

                  {/* Centered Play Button (Visual Affordance) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-brand group-hover:bg-brand group-hover:text-white border border-border/80 shadow-md transition-all duration-300 flex items-center justify-center group-hover:scale-110 group-active:scale-95"
                      aria-hidden="true"
                    >
                      <svg
                        className="w-6 h-6 sm:w-7 sm:h-7 ml-1 fill-current transition-transform"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom Headline & Play Prompt on Preview */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-4 text-white pointer-events-none">
                    <p className="text-xs sm:text-sm font-semibold text-white/95 line-clamp-1 drop-shadow-xs">
                      {videoTitle}
                    </p>
                    <span className="text-[11px] font-medium text-white/95 bg-brand/90 px-2.5 py-0.5 rounded backdrop-blur-xs shrink-0 flex items-center gap-1 shadow-xs">
                      <span aria-hidden="true">▶</span> Bấm để xem
                    </span>
                  </div>
                </button>
              ) : (
                /* Canonical YouTube Embed Player */
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`}
                  title={videoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full border-0"
                  loading="eager"
                />
              )}
            </div>

            {/* Video Caption & Controls Below Player */}
            <div className="mt-3 flex items-center justify-between text-xs text-muted flex-wrap gap-2 px-0.5">
              <span className="font-medium text-ink">{sourceCaption}</span>

              <div className="flex items-center gap-2.5">
                {!isPlaying ? (
                  <button
                    type="button"
                    onClick={handlePlay}
                    className="inline-flex items-center gap-1.5 font-bold text-white bg-brand hover:bg-brand-hover px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer shadow-xs"
                    aria-label={`Bấm xem video ${videoTitle} ngay trên trang`}
                  >
                    <span aria-hidden="true">▶</span>
                    <span>Bấm xem video</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center gap-1 font-medium text-ink hover:text-brand bg-surface-secondary border border-border px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer"
                    aria-label="Đóng trình phát video"
                  >
                    <span aria-hidden="true">✕</span>
                    <span>Đóng video</span>
                  </button>
                )}

                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-hover transition-colors cursor-pointer ml-1"
                  aria-label={`Mở video ${videoTitle} trên YouTube (mở trong tab mới)`}
                >
                  <span>Xem trên YouTube</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomepageVideoSection
