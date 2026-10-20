import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, MessageSquare, UserRound, X } from 'lucide-react'
import chatService from '../../services/chatService.js'
import useAuth from '../../features/auth/useAuth.js'
import useToast from '../../components/ui/useToast.js'
import LoadingState from '../../components/ui/LoadingState.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import BrandLogo from '../../components/common/BrandLogo.jsx'

function extractContent(page) {
  return page?.content || (Array.isArray(page) ? page : [])
}

function formatTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function CustomerChatWidget() {
  const { isAuthenticated, user } = useAuth()
  const { addToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isStartingNew, setIsStartingNew] = useState(false)
  const messagesEndRef = useRef(null)
  const isCustomer = user?.role === 'CUSTOMER'

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadConversation = useCallback(async (startNew = false) => {
    const nextConversation = startNew
      ? await chatService.startMyConversation()
      : await chatService.getMyConversation()
    const page = await chatService.getMessages(nextConversation.id)
    setConversation(nextConversation)
    setMessages(extractContent(page))
    setTimeout(scrollToBottom, 50)
  }, [scrollToBottom])

  useEffect(() => {
    let active = true
    if (!isOpen || !isAuthenticated || !isCustomer) return () => { active = false }

    const timeout = setTimeout(() => {
      loadConversation().catch((error) => {
        if (active) addToast({ message: error.message || 'Không thể mở hỗ trợ trực tuyến.', type: 'error' })
      }).finally(() => {
        if (active) setIsLoading(false)
      })
    }, 0)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [addToast, isAuthenticated, isCustomer, isOpen, loadConversation])

  useEffect(() => {
    if (!isOpen || !conversation?.id || conversation.status !== 'OPEN' || !isCustomer) return undefined

    const interval = setInterval(async () => {
      try {
        const [nextConversation, page] = await Promise.all([
          chatService.getConversation(conversation.id),
          chatService.getMessages(conversation.id),
        ])
        const nextMessages = extractContent(page)
        setConversation(nextConversation)
        setMessages((current) => {
          if (nextMessages.length !== current.length) setTimeout(scrollToBottom, 50)
          return nextMessages
        })
      } catch {
        // The next manual action will surface a useful error to the customer.
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [conversation?.id, conversation?.status, isCustomer, isOpen, scrollToBottom])

  const handleSendMessage = async (event) => {
    event.preventDefault()
    const content = newMessage.trim()
    if (!content || !conversation?.id || conversation.status !== 'OPEN' || isSending) return

    setIsSending(true)
    try {
      const sentMessage = await chatService.sendMessage(conversation.id, content)
      setMessages((current) => [...current, sentMessage])
      setNewMessage('')
      setTimeout(scrollToBottom, 50)
    } catch (error) {
      addToast({ message: error.message || 'Không thể gửi tin nhắn.', type: 'error' })
      if (error.status === 409) {
        chatService.getConversation(conversation.id).then(setConversation).catch(() => {})
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleStartNewConversation = async () => {
    if (isStartingNew) return
    setIsStartingNew(true)
    try {
      await loadConversation(true)
      setNewMessage('')
    } catch (error) {
      addToast({ message: error.message || 'Không thể bắt đầu phiên hỗ trợ mới.', type: 'error' })
    } finally {
      setIsStartingNew(false)
    }
  }

  if (isAuthenticated && !isCustomer) return null

  const isClosed = conversation?.status === 'CLOSED'
  const supportState = isClosed
    ? 'Phiên hỗ trợ đã kết thúc'
    : conversation?.assignedStaffName
      ? `Đang hỗ trợ bởi ${conversation.assignedStaffName}`
      : 'Đang chờ nhân viên tiếp nhận'

  return (
    <div className="fixed bottom-3 right-3 z-50 sm:bottom-6 sm:right-6">
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsLoading(true)
            setIsOpen(true)
          }}
          className="group relative flex min-h-11 items-center gap-2 rounded-full bg-[#0D9488] px-4 py-3 text-xs font-semibold text-white shadow-xl transition-colors hover:bg-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488] sm:text-sm"
          aria-label="Mở cửa sổ hỗ trợ trực tuyến"
        >
          <MessageSquare size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Hỗ trợ trực tuyến</span>
        </button>
      )}

      {isOpen && (
        <section
          className="h-[min(560px,calc(100vh-1.5rem))] w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl flex flex-col sm:h-[540px] sm:w-[390px]"
          aria-label="Cửa sổ hỗ trợ trực tuyến"
        >
          <header className="bg-[#111315] px-4 py-3 text-white flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                <BrandLogo variant="dark" collapsed={true} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-tight">M4N Hỗ Trợ</h2>
                {isAuthenticated && (
                  <p className={`mt-0.5 truncate text-[11px] ${isClosed ? 'text-zinc-300' : 'text-emerald-300'}`} aria-live="polite">
                    {supportState}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="min-h-10 min-w-10 rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng cửa sổ hỗ trợ"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 p-4 overflow-y-auto bg-[#F6F7F8] flex flex-col gap-3" aria-live="polite">
            {!isAuthenticated ? (
              <div className="m-auto p-6 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center">
                  <UserRound size={24} aria-hidden="true" />
                </div>
                <p className="text-sm leading-relaxed text-zinc-600">Vui lòng đăng nhập bằng tài khoản khách hàng để kết nối với nhân viên hỗ trợ.</p>
                <button
                  type="button"
                  onClick={() => navigateTo(CUSTOMER_ROUTES.login)}
                  className="min-h-10 rounded-xl bg-[#0D9488] px-4 text-sm font-semibold text-white hover:bg-[#0F766E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]"
                >
                  Đăng nhập
                </button>
              </div>
            ) : isLoading ? (
              <LoadingState message="Đang mở phiên hỗ trợ…" />
            ) : messages.length === 0 ? (
              <div className="m-auto p-4 text-center flex flex-col items-center gap-2 text-zinc-500">
                <div className="w-11 h-11 rounded-full bg-white border border-border flex items-center justify-center text-muted">
                  <MessageSquare size={20} aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-ink">Bạn cần M4N hỗ trợ điều gì?</p>
                <span className="text-xs leading-relaxed text-muted">Gửi tin nhắn để nhân viên trực tuyến tiếp nhận cuộc trò chuyện.</span>
              </div>
            ) : messages.map((message) => {
              const fromCustomer = message.senderRole === 'CUSTOMER'
              return (
                <article key={message.id} className={`flex max-w-[85%] flex-col ${fromCustomer ? 'self-end items-end' : 'self-start items-start'}`}>
                  {!fromCustomer && <span className="mb-1 px-1 text-[11px] font-semibold text-muted">{message.senderName || 'Nhân viên M4N'}</span>}
                  <p className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${fromCustomer ? 'rounded-br-sm bg-[#0D9488] text-white' : 'rounded-bl-sm border border-border bg-white text-ink shadow-xs'}`}>
                    {message.content}
                  </p>
                  <time className="mt-1 px-1 text-[11px] text-muted" dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                </article>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {isAuthenticated && isClosed ? (
            <div className="border-t border-border bg-white p-4 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={22} aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-ink">Cuộc trò chuyện đã được đóng</p>
              <p className="mt-1 text-xs text-muted">Bạn có thể bắt đầu phiên mới nếu vẫn cần hỗ trợ.</p>
              <button
                type="button"
                onClick={handleStartNewConversation}
                disabled={isStartingNew}
                className="mt-3 min-h-10 rounded-xl bg-[#0D9488] px-4 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]"
              >
                {isStartingNew ? 'Đang tạo phiên mới…' : 'Bắt đầu hỗ trợ mới'}
              </button>
            </div>
          ) : isAuthenticated ? (
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-border flex items-end gap-2">
              <label className="sr-only" htmlFor="customer-chat-message">Nội dung tin nhắn</label>
              <textarea
                id="customer-chat-message"
                rows="2"
                className="min-h-11 max-h-28 flex-1 resize-y rounded-xl border border-border bg-[#F6F7F8] px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:bg-white focus:outline-2 focus:outline-offset-1 focus:outline-[#0D9488]"
                placeholder="Nhập câu hỏi của bạn…"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                disabled={isSending || isLoading}
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={isSending || isLoading || !newMessage.trim()}
                className="min-h-11 rounded-xl bg-[#0D9488] px-4 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]"
              >
                {isSending ? 'Đang gửi…' : 'Gửi'}
              </button>
            </form>
          ) : null}
        </section>
      )}
    </div>
  )
}

export default CustomerChatWidget
