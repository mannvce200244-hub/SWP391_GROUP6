import { useSyncExternalStore } from 'react'
import { CUSTOMER_ROUTES, ROUTE_CHANGE_EVENT, normalizePathname } from '../../routes/customerRoutes.js'

function subscribe(listener) {
  window.addEventListener(ROUTE_CHANGE_EVENT, listener)
  window.addEventListener('popstate', listener)
  return () => {
    window.removeEventListener(ROUTE_CHANGE_EVENT, listener)
    window.removeEventListener('popstate', listener)
  }
}

const getSearch = () => normalizePathname(window.location.pathname) === CUSTOMER_ROUTES.checkout ? window.location.search : ''

export default function useCheckoutSearch() {
  return useSyncExternalStore(subscribe, getSearch)
}
