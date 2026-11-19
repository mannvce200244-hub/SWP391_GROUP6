import { useEffect, useState } from 'react'
import { OPEN_CUSTOMER_CHAT_EVENT } from '../features/notifications/notificationNavigation.js'
import SiteFooter from '../components/common/SiteFooter.jsx'
import SiteHeader from '../components/common/SiteHeader.jsx'
import CustomerChatWidget from '../features/chat/CustomerChatWidget.jsx'
import WorkbenchFloatingButton from '../components/common/WorkbenchFloatingButton.jsx'
import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'

function CustomerLayout({ children, pathname }) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatConversationId, setChatConversationId] = useState(null)
  useEffect(() => {
    const open = (event) => { setChatConversationId(event.detail?.conversationId ?? null); setIsCartOpen(false); setIsChatOpen(true) }
    window.addEventListener(OPEN_CUSTOMER_CHAT_EVENT, open)
    return () => window.removeEventListener(OPEN_CUSTOMER_CHAT_EVENT, open)
  }, [])
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
      <SiteHeader pathname={pathname} cartDrawerOpen={isCartOpen} onCartOpenChange={(open) => { if (open) setIsChatOpen(false); setIsCartOpen(open) }} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter
        onOpenChat={canOpenCustomerChat ? () => { setChatConversationId(null); setIsChatOpen(true) } : undefined}
        supportHref={user?.role === 'ONLINE_STAFF' ? CUSTOMER_ROUTES.staffChat : undefined}
      />
      {!isCartOpen && <WorkbenchFloatingButton />}
      {!isCartOpen && <CustomerChatWidget conversationId={chatConversationId} isOpen={isChatOpen}
        onOpenChange={(open) => { setIsChatOpen(open); if (!open) setChatConversationId(null) }} />}
    </div>
  )
}

export default CustomerLayout
