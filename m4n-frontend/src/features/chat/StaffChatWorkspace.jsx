import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Inbox,
  MessageCircle,
  Send,
  ShieldCheck,
  User,
  UserRoundCheck,
} from 'lucide-react'
import chatService from '../../services/chatService.js'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import useToast from '../../components/ui/useToast.js'
import useAuth from '../auth/useAuth.js'
import ErrorState from '../../components/ui/ErrorState.jsx'
import useChatMessages from './useChatMessages.js'
import StaffConversationQueue from './StaffConversationQueue.jsx'
import { extractContent, formatMessageTime } from './chatMessages.js'


export function StaffChatWorkspace() {
  const { addToast } = useToast()
  const { user } = useAuth()
  const [scope, setScope] = useState('WAITING')
  const [conversations, setConversations] = useState([])
  const [conversationCount, setConversationCount] = useState(0)
  const [activeConversation, setActiveConversation] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [refreshListKey, setRefreshListKey] = useState(0)
  const [isRefreshingManual, setIsRefreshingManual] = useState(false)
  const [listError, setListError] = useState('')
  const [listPage, setListPage] = useState(1)
  const [listTotalPages, setListTotalPages] = useState(0)
  const messagesEndRef = useRef(null)
  const listSequence = useRef(0)
  const selectedId = useRef(null)
  const mutationPending = useRef(false)
  const canReadThread = activeConversation?.assignedStaffId === user?.id
  const thread = useChatMessages({
    conversationId: activeConversation?.id, ownerId: user?.id, enabled: canReadThread,
    isLive: activeConversation?.status === 'OPEN',
    onConversationChange: (updated) => setActiveConversation((current) => current?.id === updated.id ? updated : current),
  })
  const { messages, isLoading: isLoadingMessages } = thread
  const latestMessageId = messages.at(-1)?.id

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [latestMessageId])

  const loadConversationList = useCallback(async () => {
    const sequence = ++listSequence.current
    const data = await chatService.getStaffConversations({ scope, page: listPage - 1 })
    if (sequence !== listSequence.current) return
    const list = extractContent(data)
    if (data?.totalPages > 0 && listPage > data.totalPages) {
      setListPage(data.totalPages)
      return
    }
    setConversations(list)
    setConversationCount(data?.totalElements ?? list.length)
    setListTotalPages(data?.totalPages ?? 1)
    setListError('')
    setActiveConversation((current) => {
      if (!current) return null
      const refreshed = list.find((item) => item.id === current.id)
      return refreshed || current
    })
    setIsLoadingList(false)
  }, [scope, listPage])

  useEffect(() => {
    let active = true
    let pending = false
    const load = async () => {
      if (pending) return
      pending = true
      try { await loadConversationList() }
      catch (error) { if (active) setListError(error.message || 'Không thể tải hàng đợi hỗ trợ.') }
      finally { if (active) setIsLoadingList(false); pending = false }
    }
    load()

    const interval = setInterval(() => {
      load()
    }, 10000)

    return () => {
      active = false
      listSequence.current += 1
      clearInterval(interval)
    }
  }, [loadConversationList, refreshListKey])

  const handleManualRefresh = async () => {
    if (isRefreshingManual) return
    setIsRefreshingManual(true)
    try {
      await loadConversationList()
    } catch (error) {
      setListError(error.message || 'Không thể làm mới hàng đợi.')
    } finally {
      setIsRefreshingManual(false)
      setIsLoadingList(false)
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    const content = replyText.trim()
    if (!content || !canReadThread || activeConversation.status !== 'OPEN' || mutationPending.current) return
    mutationPending.current = true
    const conversationId = activeConversation.id
    setIsSending(true)
    try {
      const sent = await chatService.sendMessage(conversationId, content)
      if (selectedId.current !== conversationId) return
      thread.appendMessage(sent)
      setReplyText('')
      setRefreshListKey((value) => value + 1)
    } catch (error) {
      addToast({ message: error.message || 'Không thể gửi tin nhắn phản hồi.', type: 'error' })
    } finally {
      setIsSending(false)
      mutationPending.current = false
    }
  }

  const handleKeyDownTextarea = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleScopeChange = (nextScope) => {
    if (nextScope === scope) return
    setScope(nextScope)
    listSequence.current += 1
    selectedId.current = null
    setActiveConversation(null)
    setReplyText('')
    setListPage(1)
    setConversations([])
    setConversationCount(0)
    setListError('')
    setIsLoadingList(true)
  }

  const handleSelectConversation = (nextConversation) => {
    selectedId.current = nextConversation?.id ?? null
    setActiveConversation(nextConversation)
    setReplyText('')
    setShowCloseDialog(false)
  }

  const handleAssignToMe = async () => {
    if (!activeConversation?.id || mutationPending.current) return
    mutationPending.current = true
    const conversationId = activeConversation.id
    setIsClaiming(true)
    try {
      const updated = await chatService.assignStaff(conversationId)
      if (selectedId.current === conversationId) {
        setScope('MINE')
        setListPage(1)
        setActiveConversation(updated)
        setIsLoadingList(true)
      }
      addToast({ message: 'Đã nhận yêu cầu hỗ trợ.', type: 'success' })
    } catch (error) {
      addToast({
        message: error.status === 409
          ? 'Cuộc trò chuyện vừa được nhân viên khác tiếp nhận.'
          : error.message || 'Không thể tiếp nhận cuộc trò chuyện.',
        type: 'error',
      })
      setRefreshListKey((value) => value + 1)
    } finally {
      setIsClaiming(false)
      mutationPending.current = false
    }
  }

  const handleCloseConversation = async () => {
    if (!activeConversation?.id || mutationPending.current) return
    mutationPending.current = true
    const conversationId = activeConversation.id
    setIsClosing(true)
    try {
      await chatService.closeConversation(conversationId)
      if (selectedId.current !== conversationId) return
      setShowCloseDialog(false)
      setScope('CLOSED')
      setListPage(1)
      setIsLoadingList(true)
      selectedId.current = null
      setActiveConversation(null)
      addToast({ message: 'Đã kết thúc hỗ trợ.', type: 'success' })
    } catch (error) {
      addToast({ message: error.message || 'Không thể đóng cuộc trò chuyện.', type: 'error' })
    } finally {
      setIsClosing(false)
      mutationPending.current = false
    }
  }

  return (
    <>
      <div className="h-full w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm flex flex-col lg:flex-row">
        {/* Left Aside: Support Queue List */}
        <StaffConversationQueue
          activeConversation={activeConversation} conversationCount={conversationCount}
          conversations={conversations} scope={scope} isLoadingList={isLoadingList}
          listError={listError} isRefreshingManual={isRefreshingManual} listPage={listPage}
          listTotalPages={listTotalPages} handleManualRefresh={handleManualRefresh}
          handleScopeChange={handleScopeChange} handleSelectConversation={handleSelectConversation}
          onPageChange={(page) => {
            listSequence.current += 1
            setListPage(page)
            setIsLoadingList(true)
            setConversations([])
            handleSelectConversation(null)
          }}
        />

        {/* Right Section: Active Chat Thread or Welcome State */}
        <section className={`flex-1 flex flex-col bg-white h-full min-w-0 ${activeConversation ? 'flex' : 'hidden lg:flex'}`}>
          {!activeConversation ? (
            /* Desktop Welcome Empty State */
            <div className="m-auto max-w-md p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-surface-secondary border border-emerald-200/80 text-jade flex items-center justify-center mb-4 shadow-sm">
                <MessageCircle size={32} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-ink">Bàn làm việc Tư vấn & Hỗ trợ</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Chọn một cuộc trò chuyện từ hàng đợi bên trái để bắt đầu trao đổi, tư vấn hoặc giải đáp thắc mắc cho khách hàng.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs text-muted font-medium">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Bảo mật 1-1 chuyên biệt</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs text-muted font-medium">
                  <Clock size={14} className="text-emerald-600" />
                  <span>Phản hồi tức thì</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Active Conversation Top Bar */}
              <header className="p-3.5 sm:p-4 border-b border-border bg-white flex items-center justify-between gap-3 shrink-0">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectConversation(null)
                    }}
                    className="lg:hidden min-h-9 min-w-9 rounded-lg border border-border bg-white text-ink flex items-center justify-center hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade cursor-pointer"
                    aria-label="Quay lại danh sách cuộc trò chuyện"
                  >
                    <ArrowLeft size={18} aria-hidden="true" />
                  </button>

                  <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-secondary text-jade font-bold flex items-center justify-center border border-emerald-200 shadow-2xs">
                    {(activeConversation.customerName || 'K').charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-ink">{activeConversation.customerName}</h3>
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-secondary text-emerald-800 border border-emerald-200">
                        Khách hàng
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted">{activeConversation.customerEmail}</p>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                  {!activeConversation.assignedStaffId && activeConversation.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={handleAssignToMe}
                      disabled={isClaiming}
                      className="min-h-10 rounded-xl bg-jade px-5 text-xs sm:text-sm font-bold text-white hover:bg-jade-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade transition-colors cursor-pointer shadow-xs"
                    >
                      {isClaiming ? 'Đang nhận…' : 'Tiếp nhận hỗ trợ'}
                    </button>
                  )}
                  {canReadThread && activeConversation.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => setShowCloseDialog(true)}
                      className="min-h-9 sm:min-h-10 rounded-xl border border-rose-200 bg-white px-3 sm:px-4 text-xs font-semibold text-rose-700 hover:bg-surface-secondary hover:border-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 transition-colors cursor-pointer"
                    >
                      Kết thúc hỗ trợ
                    </button>
                  )}
                </div>
              </header>

              {/* Body: Either Unassigned Claim Invite OR Transcript Messages */}
              {!canReadThread ? (
                <div className="m-auto max-w-md p-8 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-surface-secondary text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
                    <Inbox size={28} aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-ink">Yêu cầu chưa có người phụ trách</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Khách hàng <strong className="text-ink">{activeConversation.customerName}</strong> đang đợi nhân viên tư vấn. Hãy bấm nút dưới đây để tiếp nhận và xem toàn bộ nội dung trao đổi.
                  </p>
                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    disabled={isClaiming}
                    className="mt-6 min-h-11 rounded-xl bg-jade px-6 text-sm font-bold text-white hover:bg-jade-hover disabled:opacity-50 transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <UserRoundCheck size={16} />
                    <span>{isClaiming ? 'Đang tiếp nhận…' : 'Tiếp nhận cuộc trò chuyện này'}</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Messages Scroll Area */}
                  <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-surface-secondary flex flex-col gap-3.5" aria-live="polite">
                    {isLoadingMessages ? (
                      <div className="h-48 flex items-center justify-center">
                        <LoadingState message="Đang tải nội dung trò chuyện…" />
                      </div>
                    ) : thread.error && messages.length === 0 ? (
                      <ErrorState message={thread.error} onRetry={thread.retry} />
                    ) : messages.length === 0 ? (
                      <div className="m-auto text-sm text-muted bg-white px-4 py-3 rounded-xl border border-border">
                        Chưa có tin nhắn trong cuộc trò chuyện này.
                      </div>
                    ) : (
                      messages.map((message) => {
                        const fromStaff = message.senderRole === 'ONLINE_STAFF'
                        return (
                          <article
                            key={message.id}
                            className={`flex max-w-[85%] sm:max-w-[75%] flex-col ${
                              fromStaff ? 'self-end items-end' : 'self-start items-start'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              {fromStaff ? (
                                <span className="text-[11px] font-semibold text-jade">
                                  {message.senderName || 'Nhân viên'}{message.senderId === user?.id ? ' (Bạn)' : ''}
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-zinc-600 flex items-center gap-1">
                                  <User size={12} className="text-zinc-400" />
                                  {message.senderName || 'Khách hàng'}
                                </span>
                              )}
                            </div>

                            <div
                              className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                fromStaff
                                  ? 'rounded-br-xs bg-jade text-white shadow-xs'
                                  : 'rounded-bl-xs border border-border bg-white text-ink shadow-2xs'
                              }`}
                            >
                              {message.content}
                            </div>

                            <time className="mt-1 px-1 text-[11px] text-muted flex items-center gap-1" dateTime={message.createdAt}>
                              <Clock size={10} aria-hidden="true" />
                              {formatMessageTime(message.createdAt)}
                            </time>
                          </article>
                        )
                      })
                    )}
                    {(thread.hasOlder || thread.olderError) && <button type="button" disabled={thread.isLoadingOlder} onClick={thread.loadOlder} className="order-first min-h-11 shrink-0 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-brand">{thread.isLoadingOlder ? 'Đang tải…' : 'Tải tin nhắn trước'}</button>}
                    {thread.olderError && <p role="alert" className="order-first text-xs text-danger">{thread.olderError}</p>}
                    {thread.error && messages.length > 0 && <p role="alert" className="text-xs text-danger">{thread.error} <button type="button" onClick={thread.retry} className="min-h-11 underline">Thử lại</button></p>}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Composer or Closed Banner */}
                  {activeConversation.status === 'OPEN' ? (
                    <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border bg-white flex items-end gap-2.5 shrink-0">
                      <label className="sr-only" htmlFor="staff-chat-reply">Nội dung phản hồi</label>
                      <textarea
                        id="staff-chat-reply"
                        rows="2"
                        className="min-h-11 max-h-32 flex-1 resize-y rounded-xl border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:bg-white focus:outline-2 focus:outline-offset-1 focus:outline-jade transition-colors"
                        placeholder="Nhập nội dung phản hồi khách hàng... (Nhấn Enter để gửi, Shift+Enter xuống dòng)"
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        onKeyDown={handleKeyDownTextarea}
                        disabled={isSending || isLoadingMessages || isClosing}
                        maxLength={2000}
                      />
                      <button
                        type="submit"
                        disabled={isSending || isLoadingMessages || isClosing || !replyText.trim()}
                        aria-label={isSending ? 'Đang gửi phản hồi' : 'Gửi phản hồi'}
                        className="min-h-11 rounded-xl bg-jade px-5 text-sm font-semibold text-white hover:bg-jade-hover disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade transition-colors cursor-pointer shadow-xs flex items-center gap-2 shrink-0"
                      >
                        <Send size={15} />
                        <span className="hidden sm:inline">{isSending ? 'Đang gửi…' : 'Gửi'}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="border-t border-border bg-surface-secondary p-4 text-center text-sm font-medium text-muted flex items-center justify-center gap-2 shrink-0">
                      <CheckCircle2 size={16} className="text-zinc-500" />
                      <span>Cuộc trò chuyện đã kết thúc. Toàn bộ nội dung trao đổi được lưu trữ an toàn trong lịch sử.</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={showCloseDialog}
        title="Kết thúc hỗ trợ?"
        description="Cuộc trò chuyện sẽ được lưu vào lịch sử. Khách hàng có thể tạo yêu cầu hỗ trợ mới nếu cần."
        confirmLabel="Kết thúc hỗ trợ"
        cancelLabel="Hủy"
        onConfirm={handleCloseConversation}
        onCancel={() => setShowCloseDialog(false)}
        isLoading={isClosing}
      />
    </>
  )
}

export default StaffChatWorkspace
