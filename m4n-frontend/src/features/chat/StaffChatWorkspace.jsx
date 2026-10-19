import { useState, useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'
import chatService from '../../services/chatService.js'
import useToast from '../../components/ui/useToast.js'

export function StaffChatWorkspace() {
  const { addToast } = useToast()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState('')
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const [refreshListKey, setRefreshListKey] = useState(0)

  useEffect(() => {
    let active = true
    chatService
      .getStaffConversations()
      .then((data) => {
        if (!active) return
        const list = data?.content || (Array.isArray(data) ? data : [])
        setConversations(list)
        setActiveConversation((curr) => curr || (list.length > 0 ? list[0] : null))
        setIsLoadingList(false)
      })
      .catch(() => {
        if (active) setIsLoadingList(false)
      })

    return () => {
      active = false
    }
  }, [refreshListKey])

  useEffect(() => {
    let active = true
    if (activeConversation?.id) {
      chatService
        .getMessages(activeConversation.id)
        .then((msgs) => {
          if (!active) return
          setMessages(Array.isArray(msgs) ? msgs : [])
          setIsLoadingMessages(false)
          setTimeout(scrollToBottom, 50)
        })
        .catch(() => {
          if (active) {
            setMessages([])
            setIsLoadingMessages(false)
          }
        })
    }
    return () => {
      active = false
    }
  }, [activeConversation?.id])

  // Polling messages every 4s for active conversation
  useEffect(() => {
    if (!activeConversation?.id) return
    const interval = setInterval(async () => {
      try {
        const msgs = await chatService.getMessages(activeConversation.id)
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
  }, [activeConversation?.id])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const content = replyText.trim()
    if (!content || !activeConversation?.id || isSending) return

    setIsSending(true)
    try {
      const sent = await chatService.sendMessage(activeConversation.id, content)
      setMessages((prev) => [...prev, sent])
      setReplyText('')
      setTimeout(scrollToBottom, 50)
    } catch (err) {
      addToast({
        message: err.message || 'Không thể gửi tin nhắn phản hồi.',
        type: 'error',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleAssignToMe = async () => {
    if (!activeConversation?.id) return
    try {
      const updated = await chatService.assignStaff(activeConversation.id)
      setActiveConversation(updated)
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      )
      addToast({
        message: 'Đã tiếp nhận phiên tư vấn thành công.',
        type: 'success',
      })
    } catch (err) {
      addToast({
        message: err.message || 'Không thể tiếp nhận phiên tư vấn.',
        type: 'error',
      })
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col md:flex-row h-[600px]">
      {/* Left Pane: Conversation Queue */}
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-[#F9FAFB]">
        <div className="p-4 border-b border-border bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-ink">Hàng đợi tư vấn</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              {conversations.length}
            </span>
          </div>
          <button
            type="button"
            className="text-xs text-[#1F6B5A] hover:underline font-semibold cursor-pointer"
            onClick={() => setRefreshListKey((k) => k + 1)}
          >
            Làm mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {isLoadingList ? (
            <div className="p-6 text-center text-xs text-muted">
              Đang tải danh sách tư vấn...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted flex flex-col items-center gap-2">
              <MessageSquare size={28} className="text-muted/60" />
              <span>Chưa có cuộc trò chuyện cần hỗ trợ.</span>
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = activeConversation?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConversation(c)}
                  className={`p-3.5 transition-colors cursor-pointer flex flex-col gap-1 ${
                    isSelected ? 'bg-emerald-50/80 border-l-4 border-l-[#1F6B5A]' : 'hover:bg-slate-100/70 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink truncate max-w-[140px]">
                      {c.customerName || 'Khách hàng'}
                    </span>
                    <span className="text-xs text-muted">
                      {c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 truncate font-mono">
                    {c.customerEmail}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1.5 ${
                      c.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'OPEN' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      {c.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                    {c.assignedStaffName && (
                      <span className="text-xs text-zinc-400 truncate">
                        Phụ trách: {c.assignedStaffName}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right Pane: Message Thread & Composer */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-white shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#1F6B5A] font-bold text-sm flex items-center justify-center border border-emerald-200">
                  {activeConversation.customerName ? activeConversation.customerName.charAt(0).toUpperCase() : 'K'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-ink leading-tight">
                    {activeConversation.customerName}
                  </span>
                  <span className="text-xs text-muted font-mono">
                    {activeConversation.customerEmail}
                  </span>
                </div>
              </div>

              {!activeConversation.assignedStaffName && (
                <button
                  type="button"
                  onClick={handleAssignToMe}
                  className="px-3 py-1.5 rounded-xl bg-[#1F6B5A] text-white text-xs font-semibold hover:bg-[#165245] transition-colors cursor-pointer shadow-2xs"
                >
                  Tiếp nhận cuộc trò chuyện
                </button>
              )}
            </div>

            {/* Thread Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#F6F7F8] flex flex-col gap-3">
              {isLoadingMessages ? (
                <div className="my-auto text-center text-xs text-muted">
                  Đang tải nội dung tin nhắn...
                </div>
              ) : messages.length === 0 ? (
                <div className="my-auto text-center text-xs text-muted">
                  Chưa có tin nhắn trong phiên tư vấn này.
                </div>
              ) : (
                messages.map((m) => {
                  const isStaff = m.senderRole === 'ONLINE_STAFF' || m.senderRole === 'ADMIN' || m.senderRole === 'SUPER_ADMIN'
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[75%] ${
                        isStaff ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <span className="text-xs font-semibold text-zinc-500 mb-0.5 mx-1">
                        {m.senderName} ({m.senderRole})
                      </span>
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                          isStaff
                            ? 'bg-[#1F6B5A] text-white rounded-br-xs'
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

            {/* Thread Composer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-white flex items-center gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2.5 bg-[#F6F7F8] border border-border rounded-xl text-xs text-ink placeholder-zinc-400 focus:outline-none focus:border-[#1F6B5A] focus:bg-white"
                placeholder="Nhập nội dung tư vấn khách hàng..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSending}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="px-4 py-2.5 bg-[#1F6B5A] text-white text-xs font-semibold rounded-xl hover:bg-[#165245] disabled:opacity-40 transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                {isSending ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </form>
          </>
        ) : (
          <div className="my-auto text-center p-8 text-xs text-muted flex flex-col items-center gap-2">
            <MessageSquare size={32} className="text-muted/50" />
            <span>Chọn một khách hàng từ hàng đợi bên trái để bắt đầu tư vấn.</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffChatWorkspace
