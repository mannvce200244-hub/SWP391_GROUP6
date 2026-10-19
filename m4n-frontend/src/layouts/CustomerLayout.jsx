import SiteFooter from '../components/common/SiteFooter.jsx'
import SiteHeader from '../components/common/SiteHeader.jsx'
import CustomerChatWidget from '../features/chat/CustomerChatWidget.jsx'

function CustomerLayout({ children, pathname }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
        href="#main-content"
      >
        Bỏ qua đến nội dung chính
      </a>
      <SiteHeader pathname={pathname} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CustomerChatWidget />
    </div>
  )
}

export default CustomerLayout
