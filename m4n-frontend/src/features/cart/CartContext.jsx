import { useCallback, useEffect, useState } from 'react'
import cartService from '../../services/cartService.js'
import useAuth from '../auth/useAuth.js'
import { CartContext } from './cartContext.js'

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const canUseCart = isAuthenticated && user?.role === 'CUSTOMER'
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!canUseCart) {
      setCart(null)
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
  }, [canUseCart])

  useEffect(() => {
    let active = true

    async function loadCartOnAuth() {
      if (!canUseCart) {
        setCart(null)
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
  }, [canUseCart])

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) {
        return { success: false, requireAuth: true }
      }
      if (!canUseCart) {
        return {
          success: false,
          message: 'Chỉ tài khoản khách hàng mới có thể sử dụng giỏ hàng',
        }
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
    [canUseCart, isAuthenticated],
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

  const clearCart = useCallback(async () => {
    try {
      setLoading(true)
      await cartService.clearCart()
      setCart({ items: [], totalItems: 0, totalAmount: 0, totalAmountDisplay: '0 ₫' })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Không thể làm trống giỏ hàng',
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const effectiveCart = canUseCart ? cart : null
  const cartItemCount = effectiveCart?.totalItems || 0

  const value = {
    cart: effectiveCart,
    cartItemCount,
    loading,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
