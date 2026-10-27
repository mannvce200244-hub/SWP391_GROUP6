import { useState } from 'react'
import SiteFooter from '../components/common/SiteFooter.jsx'
import SiteHeader from '../components/common/SiteHeader.jsx'
import CustomerChatWidget from '../features/chat/CustomerChatWidget.jsx'
import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'

function CustomerLayout({ children, pathname }) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const canOpenCustomerChat = !isAuthenticated || user?.role === 'CUSTOMER'

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
      <SiteFooter
        onOpenChat={canOpenCustomerChat ? () => setIsChatOpen(true) : undefined}
        supportHref={user?.role === 'ONLINE_STAFF' ? CUSTOMER_ROUTES.staffChat : undefined}
      />
      <CustomerChatWidget isOpen={isChatOpen} onOpenChange={setIsChatOpen} />
    </div>
  )
}

export default CustomerLayout
