import { AuthProvider } from './features/auth/AuthContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import AppRouter from './routes/AppRouter.jsx'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
