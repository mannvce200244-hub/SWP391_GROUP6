import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, MessageSquare, UserRound, X } from 'lucide-react'
import chatService from '../../services/chatService.js'
import useAuth from '../../features/auth/useAuth.js'
import useToast from '../../components/ui/useToast.js'
import LoadingState from '../../components/ui/LoadingState.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import BrandLogo from '../../components/common/BrandLogo.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import useChatMessages from './useChatMessages.js'
import { formatMessageTime } from './chatMessages.js'

function CustomerChatPanel({ isAuthenticated, user, isOpen, onOpenChange }) {
  const { addToast } = useToast()
  const [conversation, setConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [isStartingNew, setIsStartingNew] = useState(false)
  const messagesEndRef = useRef(null)
  const requestSequence = useRef(0)
  const mutationPending = useRef(false)
  const isCustomer = user?.role === 'CUSTOMER'
  const ownerId = isCustomer && isAuthenticated ? user.id : null
  const currentConversation = conversation?.ownerId === ownerId ? conversation : null
  const dialogRef = useDialogFocus(isOpen, () => onOpenChange(false))
  const thread = useChatMessages({
    conversationId: currentConversation?.id, ownerId, enabled: isOpen && Boolean(ownerId),
    isLive: currentConversation?.status === 'OPEN',
    onConversationChange: (updated) => setConversation((current) =>
      current?.ownerId === ownerId && current.id === updated.id ? { ...updated, ownerId } : current),
  })
  const { messages } = thread
  const latestMessageId = messages.at(-1)?.id
  const isLoading = isAuthenticated && (!currentConversation && !loadError || thread.isLoading)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [latestMessageId])

  useEffect(() => {
    const sequence = ++requestSequence.current
    if (!isOpen || !ownerId) return undefined
    chatService.getMyConversation().then((nextConversation) => {
      if (requestSequence.current === sequence) setConversation({ ...nextConversation, ownerId })
    }).catch((error) => {
      if (requestSequence.current === sequence) setLoadError(error.message || 'Không thể mở hỗ trợ trực tuyến.')
    })
    return () => { if (requestSequence.current === sequence) requestSequence.current += 1 }
  }, [isOpen, ownerId, retryKey])

  const handleSendMessage = async (event) => {
    event.preventDefault()
    const content = newMessage.trim()
    if (!content || !currentConversation?.id || currentConversation.status !== 'OPEN' || mutationPending.current) return
    mutationPending.current = true
    const sequence = requestSequence.current
    const conversationId = currentConversation.id
    setIsSending(true)
    try {
      const sentMessage = await chatService.sendMessage(conversationId, content)
      if (requestSequence.current !== sequence) return
      thread.appendMessage(sentMessage)
      setNewMessage('')
    } catch (error) {
      addToast({ message: error.message || 'Không thể gửi tin nhắn.', type: 'error' })
      if (error.status === 409) {
        chatService.getConversation(conversationId).then((updated) => {
          if (requestSequence.current === sequence) setConversation({ ...updated, ownerId })
        }).catch(() => {})
      }
    } finally {
      setIsSending(false)
      mutationPending.current = false
    }
  }

  const handleStartNewConversation = async () => {
    if (mutationPending.current) return
    mutationPending.current = true
    const sequence = requestSequence.current
    setIsStartingNew(true)
    try {
      const updated = await chatService.startMyConversation()
      if (requestSequence.current !== sequence) return
      setConversation({ ...updated, ownerId })
      setNewMessage('')
    } catch (error) {
      addToast({ message: error.message || 'Không thể bắt đầu phiên hỗ trợ mới.', type: 'error' })
    } finally {
      setIsStartingNew(false)
      mutationPending.current = false
    }
  }

  const isClosed = currentConversation?.status === 'CLOSED'
  const supportState = isClosed
    ? 'Phiên hỗ trợ đã kết thúc'
    : currentConversation?.assignedStaffName
      ? `Đang hỗ trợ bởi ${currentConversation.assignedStaffName}`
      : 'Đang chờ nhân viên tiếp nhận'

  return (
    <div className={`fixed bottom-3 right-3 ${isOpen ? 'z-50' : 'z-40'} sm:bottom-6 sm:right-6`}>
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setLoadError('')
            setNewMessage('')
            onOpenChange(true)
          }}
          className="group relative flex min-h-11 items-center gap-2 rounded-full bg-jade px-4 py-3 text-xs font-semibold text-white shadow-xl transition-colors hover:bg-jade-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade sm:text-sm"
          aria-label="Mở cửa sổ hỗ trợ trực tuyến"
        >
          <MessageSquare size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Hỗ trợ trực tuyến</span>
        </button>
      )}

      {isOpen && (
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className="h-[min(560px,calc(100vh-1.5rem))] w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl flex flex-col sm:h-[540px] sm:w-[390px]"
          aria-label="Cửa sổ hỗ trợ trực tuyến"
        >
          <header className="border-b border-border bg-white px-4 py-3 text-ink flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-surface-secondary border border-border flex items-center justify-center">
                <BrandLogo collapsed={true} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-tight">M4N Hỗ Trợ</h2>
                {isAuthenticated && (
                  <p className={`mt-0.5 truncate text-[11px] ${isClosed ? 'text-muted' : 'text-jade'}`} aria-live="polite">
                    {supportState}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="min-h-11 min-w-11 rounded-lg text-muted hover:bg-surface-secondary hover:text-ink flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              onClick={() => onOpenChange(false)}
              aria-label="Đóng cửa sổ hỗ trợ"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 p-4 overflow-y-auto bg-surface-secondary flex flex-col gap-3" aria-live="polite">
            {!isAuthenticated ? (
              <div className="m-auto p-6 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-secondary text-jade flex items-center justify-center">
                  <UserRound size={24} aria-hidden="true" />
                </div>
                <p className="text-sm leading-relaxed text-zinc-600">Vui lòng đăng nhập bằng tài khoản khách hàng để kết nối với nhân viên hỗ trợ.</p>
                <button
                  type="button"
                  onClick={() => navigateTo(CUSTOMER_ROUTES.login)}
                  className="min-h-10 rounded-xl bg-jade px-4 text-sm font-semibold text-white hover:bg-jade-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade"
                >
                  Đăng nhập
                </button>
              </div>
            ) : loadError ? (
              <ErrorState message={loadError} onRetry={() => { setLoadError(''); setRetryKey((value) => value + 1) }} />
            ) : isLoading ? (
              <LoadingState message="Đang mở phiên hỗ trợ…" />
            ) : thread.error && messages.length === 0 ? (
              <ErrorState message={thread.error} onRetry={thread.retry} />
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
                  <p className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${fromCustomer ? 'rounded-br-sm bg-jade text-white' : 'rounded-bl-sm border border-border bg-white text-ink shadow-xs'}`}>
                    {message.content}
                  </p>
                  <time className="mt-1 px-1 text-[11px] text-muted" dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                </article>
              )
            })}
            {(thread.hasOlder || thread.olderError) && <button type="button" disabled={thread.isLoadingOlder} onClick={thread.loadOlder} className="order-first min-h-11 shrink-0 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-brand">{thread.isLoadingOlder ? 'Đang tải…' : 'Tải tin nhắn trước'}</button>}
            {thread.olderError && <p role="alert" className="order-first text-xs text-danger">{thread.olderError}</p>}
            {thread.error && messages.length > 0 && <p role="alert" className="text-xs text-danger">{thread.error} <button type="button" onClick={thread.retry} className="min-h-11 underline">Thử lại</button></p>}
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
                className="mt-3 min-h-10 rounded-xl bg-jade px-4 text-sm font-semibold text-white hover:bg-jade-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade"
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
                className="min-h-11 max-h-28 flex-1 resize-y rounded-xl border border-border bg-surface-secondary px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:bg-white focus:outline-2 focus:outline-offset-1 focus:outline-jade"
                placeholder="Nhập câu hỏi của bạn…"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                disabled={isSending || isLoading || !currentConversation}
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={isSending || isLoading || !currentConversation || !newMessage.trim()}
                className="min-h-11 rounded-xl bg-jade px-4 text-sm font-semibold text-white hover:bg-jade-hover disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade"
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

export function CustomerChatWidget({ isOpen, onOpenChange }) {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated && user?.role !== 'CUSTOMER') return null
  return <CustomerChatPanel key={user?.id ?? 'guest'} isAuthenticated={isAuthenticated} user={user} isOpen={isOpen} onOpenChange={onOpenChange} />
}

export default CustomerChatWidget
