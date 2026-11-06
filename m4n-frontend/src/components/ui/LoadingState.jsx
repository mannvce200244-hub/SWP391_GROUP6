import Skeleton from './Skeleton.jsx'

function LoadingState({ message = 'Đang tải dữ liệu…' }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="loading-reveal w-full min-h-[160px] px-4 py-6 sm:px-6"
      role="status"
    >
      <span className="sr-only">{message}</span>
      <div aria-hidden="true" className="flex w-full flex-col gap-5">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton height="0.875rem" width={row === 1 ? '55%' : '75%'} />
              <Skeleton height="0.625rem" width="40%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoadingState
