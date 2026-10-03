import BrandLogo from '../components/common/BrandLogo.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import { IconArrowLeft } from '../components/ui/Icons.jsx'
import heroDanTranh from '../assets/images/hero-dan-tranh.jpg'

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <header className="border-b border-border bg-surface sticky top-0 z-30">
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
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-surface-secondary"
            onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
          >
            <IconArrowLeft size={16} />
            <span>Về trang chủ</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl bg-surface rounded-2xl border border-border shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          <aside className="hidden lg:relative lg:flex lg:col-span-5 flex-col justify-end p-8 bg-ink overflow-hidden text-white">
            <img
              src={heroDanTranh}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-35 filter saturate-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-3">
              <BrandLogo variant="dark" />
              <p className="text-sm text-white/80 font-medium">
                Nhạc cụ truyền thống Việt Nam
              </p>
            </div>
          </aside>
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
