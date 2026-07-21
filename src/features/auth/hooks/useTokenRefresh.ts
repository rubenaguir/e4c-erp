import { useMutation } from '@tanstack/react-query'
import { setSisnetSession } from '@/shared/lib/sisnet-client'
import { tokenRefresh } from '@/features/auth/api/tokenRefresh'

export function useTokenRefresh() {
  return useMutation({
    mutationFn: tokenRefresh,
    onSuccess: (data) => setSisnetSession(data.session),
  })
}
