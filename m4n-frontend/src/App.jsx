import { AuthProvider } from './features/auth/AuthContext.jsx'
import { CartProvider } from './features/cart/CartContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import AppRouter from './routes/AppRouter.jsx'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
