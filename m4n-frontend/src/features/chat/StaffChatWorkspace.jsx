import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Headphones,
  Inbox,
  MessageCircle,
  MessageSquare,
  RefreshCcw,
  Send,
  ShieldCheck,
  User,
  UserRoundCheck,
} from 'lucide-react'
import chatService from '../../services/chatService.js'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import useToast from '../../components/ui/useToast.js'

const QUEUE_TABS = [
  { id: 'WAITING', label: 'Chờ tiếp nhận', icon: Inbox },
  { id: 'MINE', label: 'Của tôi', icon: UserRoundCheck },
  { id: 'CLOSED', label: 'Đã đóng', icon: CheckCircle2 },
]

function extractContent(page) {
  return page?.content || (Array.isArray(page) ? page : [])
}

function formatActivity(value) {
  if (!value) return 'Chưa có tin nhắn'
  const date = new Date(value)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatMessageTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function StaffChatWorkspace() {
  const { addToast } = useToast()
  const [scope, setScope] = useState('WAITING')
  const [conversations, setConversations] = useState([])
  const [conversationCount, setConversationCount] = useState(0)
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState('')
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [refreshListKey, setRefreshListKey] = useState(0)
  const [isRefreshingManual, setIsRefreshingManual] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadConversationList = useCallback(async () => {
    const data = await chatService.getStaffConversations({ scope })
    const list = extractContent(data)
    setConversations(list)
    setConversationCount(data?.totalElements ?? list.length)
    setActiveConversation((current) => {
      if (!current) return null
      const refreshed = list.find((item) => item.id === current.id)
      return refreshed || list[0] || null
    })
    setIsLoadingList(false)
  }, [scope])

  useEffect(() => {
    let active = true
    const timeout = setTimeout(() => {
      loadConversationList().catch(() => {
        if (active) setIsLoadingList(false)
      })
    }, 0)

    const interval = setInterval(() => {
      loadConversationList().catch(() => {})
    }, 10000)

    return () => {
      active = false
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [loadConversationList, refreshListKey])

  const canReadThread = Boolean(activeConversation?.assignedStaffId)

  useEffect(() => {
    let active = true
    if (!activeConversation?.id || !canReadThread) {
      return () => {
        active = false
      }
    }

    chatService.getMessages(activeConversation.id).then((page) => {
      if (!active) return
      setMessages(extractContent(page))
      setIsLoadingMessages(false)
      setTimeout(scrollToBottom, 50)
    }).catch(() => {
      if (!active) return
      setMessages([])
      setIsLoadingMessages(false)
    })

    return () => {
      active = false
    }
  }, [activeConversation?.id, canReadThread, scrollToBottom])

  useEffect(() => {
    if (!activeConversation?.id || !canReadThread || activeConversation.status !== 'OPEN') return undefined

    const interval = setInterval(async () => {
      try {
        const [conversation, page] = await Promise.all([
          chatService.getConversation(activeConversation.id),
          chatService.getMessages(activeConversation.id),
        ])
        const nextMessages = extractContent(page)
        setActiveConversation(conversation)
        setMessages((current) => {
          if (nextMessages.length !== current.length) setTimeout(scrollToBottom, 50)
          return nextMessages
        })
      } catch {
        setRefreshListKey((value) => value + 1)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [activeConversation?.id, activeConversation?.status, canReadThread, scrollToBottom])

  const handleManualRefresh = async () => {
    setIsRefreshingManual(true)
    setRefreshListKey((v) => v + 1)
    try {
      await loadConversationList()
    } finally {
      setTimeout(() => setIsRefreshingManual(false), 400)
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    const content = replyText.trim()
    if (!content || !activeConversation?.id || isSending) return

    setIsSending(true)
    try {
      const sent = await chatService.sendMessage(activeConversation.id, content)
      setMessages((current) => [...current, sent])
      setReplyText('')
      setTimeout(scrollToBottom, 50)
      setRefreshListKey((value) => value + 1)
    } catch (error) {
      addToast({ message: error.message || 'Không thể gửi tin nhắn phản hồi.', type: 'error' })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDownTextarea = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleScopeChange = (nextScope) => {
    if (nextScope === scope) return
    setScope(nextScope)
    setActiveConversation(null)
    setMessages([])
    setIsLoadingList(true)
  }

  const handleSelectConversation = (nextConversation) => {
    setActiveConversation(nextConversation)
    setMessages([])
    setIsLoadingMessages(Boolean(nextConversation.assignedStaffId))
  }

  const handleAssignToMe = async () => {
    if (!activeConversation?.id || isClaiming) return
    setIsClaiming(true)
    try {
      const updated = await chatService.assignStaff(activeConversation.id)
      setScope('MINE')
      setActiveConversation(updated)
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
    }
  }

  const handleCloseConversation = async () => {
    if (!activeConversation?.id || isClosing) return
    setIsClosing(true)
    try {
      await chatService.closeConversation(activeConversation.id)
      setShowCloseDialog(false)
      setScope('CLOSED')
      setActiveConversation(null)
      addToast({ message: 'Đã kết thúc hỗ trợ.', type: 'success' })
    } catch (error) {
      addToast({ message: error.message || 'Không thể đóng cuộc trò chuyện.', type: 'error' })
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <>
      <div className="h-full w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm flex flex-col lg:flex-row">
        {/* Left Aside: Support Queue List */}
        <aside
          className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-[#F6F7F8] flex flex-col h-full ${
            activeConversation ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header & Tabs */}
          <div className="p-4 border-b border-border bg-white shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1F6B5A] flex items-center justify-center font-bold">
                  <Headphones size={18} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink leading-tight">Hàng đợi hỗ trợ</h2>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    {conversationCount} yêu cầu ({scope === 'WAITING' ? 'đang chờ' : scope === 'MINE' ? 'của bạn' : 'lịch sử'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-[#F6F7F8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F6B5A] transition-colors cursor-pointer"
                aria-label="Làm mới hàng đợi"
                title="Làm mới danh sách"
              >
                <RefreshCcw size={13} className={isRefreshingManual ? 'animate-spin text-[#1F6B5A]' : ''} aria-hidden="true" />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Scope Filter Tabs */}
            <div className="mt-3.5 grid grid-cols-3 gap-1 rounded-xl bg-[#F0F2F5] p-1 border border-border/50" role="tablist" aria-label="Bộ lọc hàng đợi hỗ trợ">
              {QUEUE_TABS.map((tab) => {
                const Icon = tab.icon
                const selected = scope === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => handleScopeChange(tab.id)}
                    className={`min-h-9 rounded-lg px-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-white text-[#1F6B5A] shadow-xs border border-emerald-100 font-bold'
                        : 'text-zinc-600 hover:text-ink hover:bg-white/60'
                    }`}
                  >
                    <Icon size={14} className={selected ? 'text-[#1F6B5A]' : 'text-zinc-400'} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Queue Items List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5" role="tabpanel">
            {isLoadingList ? (
              <div className="h-48 flex items-center justify-center">
                <LoadingState message="Đang tải danh sách hỗ trợ..." />
              </div>
            ) : conversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted">
                <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center mb-3 shadow-2xs">
                  <MessageSquare size={24} className="text-muted/60" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-ink">
                  {scope === 'WAITING'
                    ? 'Không có yêu cầu đang chờ'
                    : scope === 'MINE'
                    ? 'Bạn chưa tiếp nhận hội thoại nào'
                    : 'Chưa có hội thoại nào đã đóng'}
                </p>
                <span className="text-xs text-muted mt-1 max-w-[240px] leading-relaxed">
                  {scope === 'WAITING'
                    ? 'Hiện không có yêu cầu hỗ trợ đang chờ.'
                    : scope === 'MINE'
                    ? 'Bạn chưa có cuộc trò chuyện đang phụ trách.'
                    : 'Chưa có cuộc trò chuyện đã kết thúc.'}
                </span>
              </div>
            ) : (
              conversations.map((conversation) => {
                const selected = activeConversation?.id === conversation.id
                const initial = (conversation.customerName || 'K').charAt(0).toUpperCase()
                const isWaiting = !conversation.assignedStaffId && conversation.status === 'OPEN'
                const isMine = conversation.assignedStaffId && conversation.status === 'OPEN'
                const isClosed = conversation.status === 'CLOSED'

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full rounded-xl p-3 text-left transition-all border cursor-pointer flex items-start gap-3 group ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-border/60 bg-white hover:border-border hover:shadow-2xs'
                    }`}
                  >
                    {/* Customer Initial Avatar */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${
                        selected
                          ? 'bg-[#1F6B5A] text-white border-[#1F6B5A]'
                          : 'bg-[#F0FDF4] text-[#1F6B5A] border-emerald-200 group-hover:border-emerald-300'
                      }`}
                    >
                      {initial}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="truncate text-sm font-bold text-ink">
                          {conversation.customerName || 'Khách hàng'}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted flex items-center gap-1">
                          <Clock size={11} aria-hidden="true" />
                          {formatActivity(conversation.lastMessageAt || conversation.createdAt)}
                        </span>
                      </div>

                      <p className="truncate text-xs text-muted mt-0.5">
                        {conversation.customerEmail}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        {isWaiting && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Đang chờ nhận
                          </span>
                        )}
                        {isMine && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đang hỗ trợ
                          </span>
                        )}
                        {isClosed && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 border border-zinc-200">
                            Đã đóng
                          </span>
                        )}
                        {conversation.assignedStaffName && isClosed && (
                          <span className="truncate text-[11px] text-muted">
                            bởi {conversation.assignedStaffName}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Right Section: Active Chat Thread or Welcome State */}
        <section className={`flex-1 flex flex-col bg-white h-full min-w-0 ${activeConversation ? 'flex' : 'hidden lg:flex'}`}>
          {!activeConversation ? (
            /* Desktop Welcome Empty State */
            <div className="m-auto max-w-md p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-[#1F6B5A] flex items-center justify-center mb-4 shadow-sm">
                <MessageCircle size={32} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-ink">Bàn làm việc Tư vấn & Hỗ trợ</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Chọn một cuộc trò chuyện từ hàng đợi bên trái để bắt đầu trao đổi, tư vấn hoặc giải đáp thắc mắc cho khách hàng.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F6F7F8] border border-border text-xs text-muted font-medium">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Bảo mật 1-1 chuyên biệt</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F6F7F8] border border-border text-xs text-muted font-medium">
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
                      setActiveConversation(null)
                      setMessages([])
                    }}
                    className="lg:hidden min-h-9 min-w-9 rounded-lg border border-border bg-white text-ink flex items-center justify-center hover:bg-[#F6F7F8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F6B5A] cursor-pointer"
                    aria-label="Quay lại danh sách cuộc trò chuyện"
                  >
                    <ArrowLeft size={18} aria-hidden="true" />
                  </button>

                  <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 text-[#1F6B5A] font-bold flex items-center justify-center border border-emerald-200 shadow-2xs">
                    {(activeConversation.customerName || 'K').charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-ink">{activeConversation.customerName}</h3>
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
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
                      className="min-h-10 rounded-xl bg-[#1F6B5A] px-5 text-xs sm:text-sm font-bold text-white hover:bg-[#165245] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F6B5A] transition-colors cursor-pointer shadow-xs"
                    >
                      {isClaiming ? 'Đang nhận…' : 'Tiếp nhận hỗ trợ'}
                    </button>
                  )}
                  {activeConversation.assignedStaffId && activeConversation.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => setShowCloseDialog(true)}
                      className="min-h-9 sm:min-h-10 rounded-xl border border-rose-200 bg-white px-3 sm:px-4 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 transition-colors cursor-pointer"
                    >
                      Kết thúc hỗ trợ
                    </button>
                  )}
                </div>
              </header>

              {/* Body: Either Unassigned Claim Invite OR Transcript Messages */}
              {!canReadThread ? (
                <div className="m-auto max-w-md p-8 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
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
                    className="mt-6 min-h-11 rounded-xl bg-[#1F6B5A] px-6 text-sm font-bold text-white hover:bg-[#165245] disabled:opacity-50 transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <UserRoundCheck size={16} />
                    <span>{isClaiming ? 'Đang tiếp nhận…' : 'Tiếp nhận cuộc trò chuyện này'}</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Messages Scroll Area */}
                  <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-[#F8FAFC] flex flex-col gap-3.5" aria-live="polite">
                    {isLoadingMessages ? (
                      <div className="h-48 flex items-center justify-center">
                        <LoadingState message="Đang tải nội dung trò chuyện…" />
                      </div>
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
                                <span className="text-[11px] font-semibold text-[#1F6B5A]">
                                  {message.senderName || 'Nhân viên'} (Bạn)
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
                                  ? 'rounded-br-xs bg-[#1F6B5A] text-white shadow-xs'
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
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Composer or Closed Banner */}
                  {activeConversation.status === 'OPEN' ? (
                    <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border bg-white flex items-end gap-2.5 shrink-0">
                      <label className="sr-only" htmlFor="staff-chat-reply">Nội dung phản hồi</label>
                      <textarea
                        id="staff-chat-reply"
                        rows="2"
                        className="min-h-11 max-h-32 flex-1 resize-y rounded-xl border border-border bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:bg-white focus:outline-2 focus:outline-offset-1 focus:outline-[#1F6B5A] transition-colors"
                        placeholder="Nhập nội dung phản hồi khách hàng... (Nhấn Enter để gửi, Shift+Enter xuống dòng)"
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        onKeyDown={handleKeyDownTextarea}
                        disabled={isSending}
                        maxLength={2000}
                      />
                      <button
                        type="submit"
                        disabled={isSending || !replyText.trim()}
                        className="min-h-11 rounded-xl bg-[#1F6B5A] px-5 text-sm font-semibold text-white hover:bg-[#165245] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F6B5A] transition-colors cursor-pointer shadow-xs flex items-center gap-2 shrink-0"
                      >
                        <Send size={15} />
                        <span className="hidden sm:inline">{isSending ? 'Đang gửi…' : 'Gửi'}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="border-t border-border bg-zinc-50 p-4 text-center text-sm font-medium text-muted flex items-center justify-center gap-2 shrink-0">
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
