import { useMutation } from '@tanstack/react-query'
import { setSisnetSession } from '@/shared/lib/sisnet-client'
import { login } from '@/features/auth/api/login'

export function useLogin() {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => setSisnetSession(data.session),
  })
}
