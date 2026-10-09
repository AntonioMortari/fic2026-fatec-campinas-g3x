import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { useToast } from '../ui'

export function useSignOut() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  return async () => {
    // Leave first, and flush it: clearing the session while a protected page is still mounted redirects to /entrar (measured in the browser; jsdom does not show it).
    await navigate('/', { flushSync: true })
    signOut()
    toast('Você saiu da conta.')
  }
}
