import BrandLogo from '../components/common/BrandLogo.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import { IconArrowLeft } from '../components/ui/Icons.jsx'
// CC0 photo: đàn bầu at Vietnam Museum of Ethnology, Hanoi
// (source: Wikimedia Commons "Dan bau (monochord) - Vietnam Museum of Ethnology")
import authDanBau from '../assets/images/auth-dan-bau.jpg'

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink relative overflow-hidden">
      {/* Background Layer 1: Ambient Craft Glows */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-brand-soft/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-jade-soft/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Background Layer 2: Subtle Dot-Grid Pattern */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#E3E6E8_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Background Layer 3: Acoustic Resonance String Waves SVG */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.045] -z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="resonance-waves" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M 0 100 Q 50 30, 100 100 T 200 100" fill="none" stroke="#17191B" strokeWidth="1.5" />
            <path d="M 0 130 Q 50 60, 100 130 T 200 130" fill="none" stroke="#A62F25" strokeWidth="1.2" />
            <path d="M 0 70 Q 50 0, 100 70 T 200 70" fill="none" stroke="#2F5A50" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#resonance-waves)" />
      </svg>

      {/* Header */}
      <header className="border-b border-border/80 bg-surface/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigateTo(CUSTOMER_ROUTES.home)
              }
            }}
            aria-label="M4N - Về trang chủ"
            className="cursor-pointer flex items-center"
          >
            <BrandLogo />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand hover:bg-brand-soft/60 transition-colors cursor-pointer py-2 px-3.5 rounded-xl border border-transparent hover:border-brand-border/60 shadow-2xs"
            onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
          >
            <IconArrowLeft size={16} />
            <span>Về trang chủ</span>
          </button>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative z-10">
        <div className="w-full max-w-5xl bg-surface rounded-3xl border border-border/90 shadow-xl shadow-black/[0.04] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] backdrop-blur-xs">
          {/* Left Visual Aside (Dark Craft Atmosphere) */}
          <aside className="hidden lg:relative lg:flex lg:col-span-5 flex-col justify-between p-8 sm:p-10 bg-footer overflow-hidden text-white group">
            <img
              src={authDanBau}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-35 filter saturate-75 group-hover:scale-103 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30 pointer-events-none" />

            {/* Bottom Content */}
            <div className="relative z-10 flex flex-col gap-4 mt-auto pt-12">
              <BrandLogo variant="dark" />
              <blockquote className="font-serif italic text-sm text-white/80 leading-relaxed border-l-2 border-brand/70 pl-3.5">
                "Thanh âm ngàn năm trong dòng chảy hiện đại — gìn giữ bản sắc văn hóa Việt qua từng thanh âm."
              </blockquote>
              <div className="flex items-center gap-2 text-xs text-white/60 pt-1">
                <span>Đàn Tranh</span>
                <span>·</span>
                <span>Đàn Bầu</span>
                <span>·</span>
                <span>Đàn Nguyệt</span>
                <span>·</span>
                <span>Sáo Trúc</span>
              </div>
            </div>
          </aside>

          {/* Right Form Container */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-surface">
            {children}
          </div>
        </div>
      </main>

      {/* Subtle Footer Watermark */}
      <footer className="py-3 text-center text-xs text-muted/70">
        <p>© M4N · Nhạc cụ truyền thống Việt Nam</p>
      </footer>
    </div>
  )
}

export default AuthLayout

