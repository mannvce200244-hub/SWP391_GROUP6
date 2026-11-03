import { Wrench } from 'lucide-react'
import useAuth from '../../features/auth/useAuth.js'
import { getWorkbenchInfo } from '../../routes/roleUtils.js'
import RouterLink from '../../routes/RouterLink.jsx'

function WorkbenchFloatingButton() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) return null

  const workbenchInfo = getWorkbenchInfo(user.role)
  if (!workbenchInfo) return null

  return (
    <aside
      aria-label="Phím tắt trở lại bàn làm việc"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 pointer-events-auto"
    >
      <RouterLink
        href={workbenchInfo.path}
        className="group flex min-h-11 items-center gap-2 sm:gap-2.5 rounded-full bg-brand px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:bg-brand-hover hover:shadow-2xl active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand cursor-pointer"
        aria-label={workbenchInfo.label}
        title={workbenchInfo.label}
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 transition-transform duration-200 group-hover:rotate-45">
          <Wrench size={15} className="text-white" aria-hidden="true" />
        </span>
        <span className="tracking-wide">{workbenchInfo.label}</span>
      </RouterLink>
    </aside>
  )
}

export default WorkbenchFloatingButton

