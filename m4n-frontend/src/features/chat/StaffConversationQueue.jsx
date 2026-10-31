import { CheckCircle2, Clock, Headphones, Inbox, MessageSquare, RefreshCcw, UserRoundCheck } from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import Pagination from '../catalog/Pagination.jsx'
import { formatActivity } from './chatMessages.js'

const QUEUE_TABS = [
  { id: 'WAITING', label: 'Chờ tiếp nhận', icon: Inbox },
  { id: 'MINE', label: 'Của tôi', icon: UserRoundCheck },
  { id: 'CLOSED', label: 'Đã đóng', icon: CheckCircle2 },
]

export default function StaffConversationQueue({
  activeConversation, conversationCount, conversations, scope, isLoadingList, listError,
  isRefreshingManual, listPage, listTotalPages, handleManualRefresh, handleScopeChange,
  handleSelectConversation, onPageChange,
}) {
  return (
        <aside
          className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface-secondary flex flex-col h-full ${
            activeConversation ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header & Tabs */}
          <div className="p-4 border-b border-border bg-white shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-secondary text-jade flex items-center justify-center font-bold">
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
                disabled={isRefreshingManual}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade transition-colors cursor-pointer"
                aria-label="Làm mới hàng đợi"
                title="Làm mới danh sách"
              >
                <RefreshCcw size={13} className={isRefreshingManual ? 'animate-spin text-jade' : ''} aria-hidden="true" />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Scope Filter Tabs */}
            <div className="mt-3.5 grid grid-cols-3 gap-1 rounded-xl bg-surface-secondary p-1 border border-border/50" aria-label="Bộ lọc hàng đợi hỗ trợ">
              {QUEUE_TABS.map((tab) => {
                const Icon = tab.icon
                const selected = scope === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleScopeChange(tab.id)}
                    className={`min-h-11 rounded-lg px-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-white text-jade shadow-xs border border-emerald-100 font-bold'
                        : 'text-zinc-600 hover:text-ink hover:bg-white/60'
                    }`}
                  >
                    <Icon size={14} className={selected ? 'text-jade' : 'text-zinc-400'} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Queue Items List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {isLoadingList ? (
              <div className="h-48 flex items-center justify-center">
                <LoadingState message="Đang tải danh sách hỗ trợ..." />
              </div>
            ) : listError && conversations.length === 0 ? (
              <ErrorState message={listError} onRetry={handleManualRefresh} />
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
                        ? 'border-emerald-500 bg-surface-secondary shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-border/60 bg-white hover:border-border hover:shadow-2xs'
                    }`}
                  >
                    {/* Customer Initial Avatar */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${
                        selected
                          ? 'bg-jade text-white border-jade'
                          : 'bg-surface-secondary text-jade border-emerald-200 group-hover:border-emerald-300'
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
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-secondary px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                            Đang chờ nhận
                          </span>
                        )}
                        {isMine && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-secondary px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-jade" />
                            Đang hỗ trợ
                          </span>
                        )}
                        {isClosed && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-secondary px-2 py-0.5 text-[11px] font-semibold text-zinc-600 border border-zinc-200">
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
            {listError && conversations.length > 0 && <p role="alert" className="px-3 text-sm text-danger">{listError}</p>}
          </div>
          {listTotalPages > 1 && <div className="border-t border-border bg-white p-3"><Pagination currentPage={listPage} totalPages={listTotalPages} onPageChange={onPageChange} /></div>}
        </aside>
  )
}
