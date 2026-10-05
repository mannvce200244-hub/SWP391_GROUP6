import { useCallback, useEffect, useState } from 'react'
import cartService from '../../services/cartService.js'
import useAuth from '../auth/useAuth.js'
import { CartContext } from './cartContext.js'

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      setLoading(true)
      const data = await cartService.getMyCart()
      setCart(data)
    } catch {
      // Keep silent on background cart refresh failure
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    let active = true

    async function loadCartOnAuth() {
      if (!isAuthenticated) {
        return
      }

      try {
        const data = await cartService.getMyCart()
        if (active) {
          setCart(data)
        }
      } catch {
        // Keep silent on background cart refresh failure
      }
    }

    loadCartOnAuth()

    return () => {
      active = false
    }
  }, [isAuthenticated])

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) {
        return { success: false, requireAuth: true }
      }

      try {
        setLoading(true)
        const updatedCart = await cartService.addToCart(productId, quantity)
        setCart(updatedCart)
        return { success: true, cart: updatedCart }
      } catch (error) {
        return {
          success: false,
          message: error.message || 'Không thể thêm sản phẩm vào giỏ hàng',
        }
      } finally {
        setLoading(false)
      }
    },
    [isAuthenticated],
  )

  const updateCartItem = useCallback(async (itemId, quantity) => {
    try {
      setLoading(true)
      const updatedCart = await cartService.updateCartItem(itemId, quantity)
      setCart(updatedCart)
      return { success: true, cart: updatedCart }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Không thể cập nhật giỏ hàng',
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const removeCartItem = useCallback(async (itemId) => {
    try {
      setLoading(true)
      const updatedCart = await cartService.removeCartItem(itemId)
      setCart(updatedCart)
      return { success: true, cart: updatedCart }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Không thể xóa mục khỏi giỏ hàng',
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const effectiveCart = isAuthenticated ? cart : null
  const cartItemCount = effectiveCart?.totalItems || 0

  const value = {
    cart: effectiveCart,
    cartItemCount,
    loading,
    addToCart,
    updateCartItem,
    removeCartItem,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
