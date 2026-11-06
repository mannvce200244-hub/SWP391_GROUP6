import { Suspense } from 'react'
import LoadingState from '../components/ui/LoadingState.jsx'
import Skeleton, {
  ArticleListSkeleton,
  ProductDetailSkeleton,
  ProductGridSkeleton,
} from '../components/ui/Skeleton.jsx'
import { CUSTOMER_ROUTES, matchProductDetailPath } from './customerRoutes.js'

const authPaths = [
  CUSTOMER_ROUTES.login,
  CUSTOMER_ROUTES.register,
  CUSTOMER_ROUTES.forgotPassword,
  CUSTOMER_ROUTES.resetPassword,
]

function RouteSkeleton({ pathname }) {
  if (authPaths.includes(pathname)) {
    return (
      <div role="status" aria-busy="true" className="loading-reveal flex flex-col gap-6 p-6 sm:p-10">
        <span className="sr-only">Đang tải trang…</span>
        <Skeleton height="2rem" width="65%" />
        <Skeleton height="1rem" width="90%" />
        <div aria-hidden="true" className="mt-4 flex flex-col gap-6">
          {[0, 1, 2].map((field) => (
            <div key={field} className="flex flex-col gap-2">
              <Skeleton height="0.875rem" width="30%" />
              <Skeleton height="3rem" width="100%" />
            </div>
          ))}
          <Skeleton height="3rem" width="100%" />
        </div>
      </div>
    )
  }

  if (pathname === CUSTOMER_ROUTES.products) {
    return (
      <div className="loading-reveal" aria-busy="true">
        <div role="status" className="border-b border-border px-4 py-8 sm:py-10 lg:py-12">
          <span className="sr-only">Đang tải danh mục sản phẩm…</span>
          <div aria-hidden="true" className="mx-auto flex max-w-2xl flex-col items-center gap-4">
            <Skeleton height="0.75rem" width="12rem" />
            <Skeleton className="max-w-full" height="2.5rem" width="32rem" />
            <Skeleton height="1rem" width="90%" />
            <Skeleton className="mt-2 max-w-full" height="3rem" width="36rem" />
            <Skeleton className="max-w-full" height="2.5rem" width="24rem" />
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:gap-10">
          <div aria-hidden="true" className="hidden w-60 shrink-0 flex-col gap-6 lg:flex xl:w-64">
            <Skeleton height="1rem" width="60%" />
            {[0, 1, 2].map((filter) => <Skeleton key={filter} height="5rem" width="100%" />)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex h-13 items-start justify-between gap-4 border-b border-border">
              <Skeleton height="1rem" width="8rem" />
              <Skeleton height="2rem" width="8rem" />
            </div>
            <ProductGridSkeleton />
          </div>
        </div>
      </div>
    )
  }

  let content = <LoadingState message="Đang tải trang…" />
  if (pathname === CUSTOMER_ROUTES.artisans) {
    content = <ProductGridSkeleton />
  } else if (matchProductDetailPath(pathname) || pathname === CUSTOMER_ROUTES.home) {
    content = <ProductDetailSkeleton />
  } else if (pathname === CUSTOMER_ROUTES.articles) {
    content = <ArticleListSkeleton />
  }

  return (
    <div className={`loading-reveal mx-auto w-full px-4 py-10 sm:px-6 sm:py-12 lg:px-8 ${pathname === CUSTOMER_ROUTES.articles ? 'max-w-5xl' : 'max-w-7xl'}`} aria-busy="true">
      <div role="status" className="mb-8 flex flex-col gap-4">
        <span className="sr-only">Đang tải trang…</span>
        <Skeleton height="0.75rem" width="8rem" />
        <Skeleton className="max-w-full" height="2.5rem" width="24rem" />
        <Skeleton className="max-w-full" height="1rem" width="32rem" />
      </div>
      {content}
    </div>
  )
}

export default function RouteContent({ children, pathname }) {
  return (
    <Suspense key={pathname} fallback={<RouteSkeleton pathname={pathname} />}>
      {children}
    </Suspense>
  )
}
