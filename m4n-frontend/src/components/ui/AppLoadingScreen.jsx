import BrandLogo from '../common/BrandLogo.jsx'

function AppLoadingScreen({ message = 'Đang khởi tạo phiên làm việc…' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas p-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center max-w-sm text-center">
        <BrandLogo />
        <div className="my-6">
          <span className="inline-block w-7 h-7 border-2 border-border border-t-brand rounded-full animate-spin" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-muted">{message}</p>
      </div>
    </div>
  )
}

export default AppLoadingScreen
