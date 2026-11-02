import { useEffect, useState } from 'react'
import deliveryAddressService from '../../services/deliveryAddressService.js'
import useAuth from '../auth/useAuth.js'

export default function useSavedAddresses() {
  const { user } = useAuth()
  const owner = user?.id
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState({ loading: true, error: '', items: [], totalPages: 0 })
  useEffect(() => {
    let active = true
    deliveryAddressService.list(page).then((result) => {
      if (!active) return
      if (page > 0 && page >= result.totalPages) {
        setPage(Math.max(0, result.totalPages - 1))
        return
      }
      setState({ ...result, owner, loading: false, error: '' })
    }).catch((failure) => {
      if (active) setState({ owner, loading: false, error: failure.message || 'Không thể tải địa chỉ.', items: [], totalPages: 0 })
    })
    return () => { active = false }
  }, [page, revision, owner])
  function reload(nextPage = page) {
    setState((current) => ({ ...current, loading: true, error: '' }))
    setPage(nextPage)
    setRevision((value) => value + 1)
  }
  const visible = state.owner === owner ? state : { loading: true, error: '', items: [], totalPages: 0 }
  return { ...visible, page, reload }
}
