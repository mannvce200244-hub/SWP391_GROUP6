import { useCallback, useEffect, useRef, useState } from 'react'
import cartService from '../../services/cartService.js'
import useAuth from '../auth/useAuth.js'
import { CartContext } from './cartContext.js'

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const canUseCart = isAuthenticated && user?.role === 'CUSTOMER'
  const owner = canUseCart ? user.id : null
  const [state, setState] = useState({ owner: null, cart: null, loading: false, error: null })
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

  const removeCartItem = useCallback((itemId) => mutateCart(() => cartService.removeCartItem(itemId)), [mutateCart])
  const clearCart = useCallback(() => mutateCart(() => cartService.clearCart()), [mutateCart])
  const effectiveCart = owner && state.owner === owner ? state.cart : null

  return (
    <CartContext.Provider value={{
      cart: effectiveCart,
      cartItemCount: effectiveCart?.totalItems || 0,
      loading: Boolean(owner && (state.owner !== owner || state.loading)),
      error: owner && state.owner === owner ? state.error : null,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider
