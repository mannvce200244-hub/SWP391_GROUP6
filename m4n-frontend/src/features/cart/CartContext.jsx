import { useCallback, useEffect, useRef, useState } from 'react'
import cartService from '../../services/cartService.js'
import useAuth from '../auth/useAuth.js'
import { CartContext } from './cartContext.js'
import { reconcileCartSelection } from './cartSelection.js'
import { directCheckoutUrl } from '../checkout/directPurchase.js'

const EMPTY_SELECTION = Object.freeze([])

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const canUseCart = isAuthenticated && user?.role === 'CUSTOMER'
  const owner = canUseCart ? user.id : null
  const [state, setState] = useState({ owner: null, cart: null, loading: false, error: null })
  const [selection, setSelection] = useState({ owner: null, selectedIds: [], knownIds: [] })
  const sequence = useRef(0)
  const pendingMutation = useRef(null)

  const refreshCart = useCallback(async () => {
    if (!owner) {
      setState({ owner: null, cart: null, loading: false, error: null })
      return { success: false }
    }
    if (pendingMutation.current) return { success: false }
    const requestId = ++sequence.current
    setState((current) => ({ owner, cart: current.owner === owner ? current.cart : null, loading: true, error: null }))
    try {
      const cart = await cartService.getMyCart()
      if (requestId === sequence.current) setState({ owner, cart, loading: false, error: null })
      return { success: true, cart }
    } catch (error) {
      if (requestId === sequence.current) {
        setState((current) => ({ ...current, loading: false, error: error.message || 'Không thể tải giỏ hàng.' }))
      }
      return { success: false, message: error.message }
    }
  }, [owner])

  useEffect(() => {
    refreshCart()
    return () => {
      sequence.current += 1
      pendingMutation.current = null
    }
  }, [refreshCart])

  const mutateCart = useCallback(async (operation) => {
    if (!isAuthenticated) return { success: false, requireAuth: true }
    if (!owner) return { success: false, message: 'Chỉ tài khoản khách hàng mới có thể sử dụng giỏ hàng.' }
    if (pendingMutation.current) return { success: false, message: 'Giỏ hàng đang cập nhật. Vui lòng đợi.' }

    const requestId = ++sequence.current
    pendingMutation.current = requestId
    setState((current) => ({ owner, cart: current.owner === owner ? current.cart : null, loading: true, error: null }))
    try {
      const cart = await operation()
      if (requestId !== sequence.current) return { success: false, message: 'Phiên đăng nhập đã thay đổi.' }
      setState({ owner, cart, loading: false, error: null })
      return { success: true, cart }
    } catch (error) {
      if (requestId === sequence.current) setState((current) => ({ ...current, loading: false }))
      return { success: false, message: error.message || 'Không thể cập nhật giỏ hàng.' }
    } finally {
      if (pendingMutation.current === requestId) pendingMutation.current = null
    }
  }, [isAuthenticated, owner])

  const addToCart = useCallback((productId, quantity = 1) => {
    if (!Number.isSafeInteger(Number(quantity)) || Number(quantity) < 1) {
      return Promise.resolve({ success: false, message: 'Số lượng phải là số nguyên lớn hơn 0.' })
    }
    return mutateCart(() => cartService.addToCart(productId, quantity))
  }, [mutateCart])

  const updateCartItem = useCallback((itemId, quantity) => {
    if (!Number.isSafeInteger(Number(quantity)) || Number(quantity) < 1) {
      return Promise.resolve({ success: false, message: 'Số lượng phải là số nguyên lớn hơn 0.' })
    }
    return mutateCart(() => cartService.updateCartItem(itemId, quantity))
  }, [mutateCart])

  const buyNow = useCallback(async (productId, quantity = 1) => {
    if (!isAuthenticated) return { success: false, requireAuth: true }
    if (!owner) return { success: false, message: 'Chỉ tài khoản khách hàng mới có thể mua hàng.' }
    try {
      return { success: true, checkoutUrl: directCheckoutUrl(productId, quantity) }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }, [isAuthenticated, owner])

  const removeCartItem = useCallback((itemId) => mutateCart(() => cartService.removeCartItem(itemId)), [mutateCart])
  const clearCart = useCallback(() => mutateCart(() => cartService.clearCart()), [mutateCart])
  const effectiveCart = owner && state.owner === owner ? state.cart : null

  useEffect(() => {
    setSelection((current) => reconcileCartSelection(current, owner, effectiveCart?.items || []))
  }, [effectiveCart, owner])

  const selectedCartItemIds = selection.owner === owner ? selection.selectedIds : EMPTY_SELECTION
  const selectedIdSet = new Set(selectedCartItemIds)
  const selectedCartItems = (effectiveCart?.items || []).filter((item) => selectedIdSet.has(item.id))
  const allCartItemsSelected = Boolean(effectiveCart?.items?.length)
    && selectedCartItems.length === effectiveCart.items.length

  const toggleCartItemSelection = useCallback((itemId) => {
    setSelection((current) => {
      if (current.owner !== owner || !current.knownIds.includes(itemId)) return current
      const selected = current.selectedIds.includes(itemId)
      return {
        ...current,
        selectedIds: selected
          ? current.selectedIds.filter((id) => id !== itemId)
          : [...current.selectedIds, itemId],
      }
    })
  }, [owner])

  const selectAllCartItems = useCallback((selected) => {
    setSelection((current) => current.owner === owner
      ? { ...current, selectedIds: selected ? [...current.knownIds] : [] }
      : current)
  }, [owner])

  return (
    <CartContext.Provider value={{
      cart: effectiveCart,
      cartItemCount: effectiveCart?.totalItems || 0,
      loading: Boolean(owner && (state.owner !== owner || state.loading)),
      error: owner && state.owner === owner ? state.error : null,
      addToCart,
      buyNow,
      updateCartItem,
      removeCartItem,
      clearCart,
      refreshCart,
      selectedCartItemIds,
      selectedCartItems,
      allCartItemsSelected,
      toggleCartItemSelection,
      selectAllCartItems,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider
