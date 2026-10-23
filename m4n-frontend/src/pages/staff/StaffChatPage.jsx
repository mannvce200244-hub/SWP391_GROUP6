import StaffChatWorkspace from '../../features/chat/StaffChatWorkspace.jsx'

function StaffChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] sm:h-[calc(100vh-7.5rem)] pb-2">
      <div className="mb-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Hỗ trợ khách hàng</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Tiếp nhận, xử lý và hỗ trợ trực tuyến khách hàng theo thời gian thực.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <StaffChatWorkspace />
      </div>
    </div>
  )
}

export default StaffChatPage
