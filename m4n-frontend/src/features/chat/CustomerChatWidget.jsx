import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, UserRound } from 'lucide-react'
import chatService from '../../services/chatService.js'
import useAuth from '../../features/auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import BrandLogo from '../../components/common/BrandLogo.jsx'

export function CustomerChatWidget() {
  const { isAuthenticated, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [unreadIncoming] = useState(0)

  const messagesEndRef = useRef(null)
  const isCustomer = user?.role === 'CUSTOMER'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Initial load when open
  useEffect(() => {
    let active = true
    if (isOpen && isAuthenticated && isCustomer) {
      chatService
        .getMyConversation()
        .then((conv) => {
          if (!active) return null
          if (conv?.id) {
            setConversation(conv)
            return chatService.getMessages(conv.id)
          }
          return []
        })
        .then((msgs) => {
          if (!active) return
          if (msgs) {
            setMessages(Array.isArray(msgs) ? msgs : [])
          }
          setIsLoading(false)
          setTimeout(scrollToBottom, 50)
        })
        .catch(() => {
          if (active) setIsLoading(false)
        })
    }
    return () => {
      active = false
    }
  }, [isOpen, isAuthenticated, isCustomer])

  // Polling every 4 seconds when drawer is open
  useEffect(() => {
    if (!isOpen || !conversation?.id || !isAuthenticated || !isCustomer) return
    const interval = setInterval(async () => {
      try {
        const msgs = await chatService.getMessages(conversation.id)
        if (Array.isArray(msgs)) {
          setMessages((prev) => {
            if (msgs.length !== prev.length) {
              setTimeout(scrollToBottom, 100)
            }
            return msgs
          })
        }
      } catch {
        // Ignored
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [isOpen, conversation?.id, isAuthenticated, isCustomer])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || !conversation?.id || isSending) return

    setIsSending(true)
    try {
      const sentMsg = await chatService.sendMessage(conversation.id, content)
      setMessages((prev) => [...prev, sentMsg])
      setNewMessage('')
      setTimeout(scrollToBottom, 50)
    } catch {
      // Handled
    } finally {
      setIsSending(false)
    }
  }

  // If user is staff or admin, don't show the customer floating widget (they have the staff workspace)
  if (isAuthenticated && !isCustomer) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-[#0D9488] text-white font-semibold text-xs sm:text-sm shadow-xl hover:bg-[#0F766E] hover:scale-105 transition-all cursor-pointer"
          aria-label="Mở cửa sổ trò chuyện hỗ trợ trực tuyến"
        >
          <MessageSquare size={18} />
          <span className="hidden sm:inline">Tư vấn nhạc cụ</span>
          {unreadIncoming > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
              {unreadIncoming}
            </span>
          )}
        </button>
      )}

      {/* Support Chat Box Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[480px] bg-white rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#111315] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <BrandLogo variant="dark" collapsed={true} />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">M4N Hỗ Trợ</div>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Nhân viên sẵn sàng tư vấn
                </span>
              </div>
            </div>

            <button
              type="button"
              className="text-zinc-400 hover:text-white cursor-pointer p-1 transition-colors"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng cửa sổ trò chuyện"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#F6F7F8] flex flex-col gap-3">
            {!isAuthenticated ? (
              <div className="my-auto text-center p-6 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]">
                  <UserRound size={24} />
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Vui lòng đăng nhập tài khoản khách hàng để kết nối trực tiếp với nhân viên tư vấn nhạc cụ M4N.
                </p>
                <button
                  type="button"
                  onClick={() => navigateTo(CUSTOMER_ROUTES.login)}
                  className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-semibold hover:bg-[#0F766E] transition-colors cursor-pointer shadow-2xs"
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : isLoading ? (
              <div className="my-auto text-center text-xs text-zinc-400">
                Đang kết nối phiên hỗ trợ...
              </div>
            ) : messages.length === 0 ? (
              <div className="my-auto text-center p-4 flex flex-col items-center gap-2 text-zinc-500">
                <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-muted">
                  <MessageSquare size={20} />
                </div>
                <p className="text-xs font-medium">
                  Chào bạn! Bạn cần tư vấn thông số nhạc cụ, âm sắc đàn hay quy trình đặt hàng?
                </p>
                <span className="text-xs text-zinc-400">
                  Gửi tin nhắn để bắt đầu cuộc trò chuyện ngay.
                </span>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderRole === 'CUSTOMER'
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[80%] ${
                      isMe ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    {!isMe && (
                      <span className="text-xs font-semibold text-zinc-500 mb-0.5 ml-1">
                        {m.senderName || 'Nhân viên M4N'}
                      </span>
                    )}
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                        isMe
                          ? 'bg-[#0D9488] text-white rounded-br-xs'
                          : 'bg-white text-zinc-800 border border-border rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-xs text-zinc-400 mt-1 mx-1">
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          {isAuthenticated && (
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 bg-white border-t border-border flex items-center gap-2"
            >
              <input
                type="text"
                className="flex-1 px-3 py-2 text-xs bg-[#F6F7F8] border border-border rounded-xl focus:outline-none focus:border-[#0D9488] focus:bg-white text-ink placeholder-zinc-400"
                placeholder="Nhập câu hỏi của bạn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="px-3.5 py-2 bg-[#0D9488] text-white text-xs font-semibold rounded-xl hover:bg-[#0F766E] disabled:opacity-40 transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                {isSending ? '...' : 'Gửi'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default CustomerChatWidget
