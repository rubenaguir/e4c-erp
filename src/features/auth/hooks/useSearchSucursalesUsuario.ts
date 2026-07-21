import { useMutation } from '@tanstack/react-query'
import { searchSucursalesUsuario } from '@/features/auth/api/searchSucursalesUsuario'

export function useSearchSucursalesUsuario() {
  return useMutation({ mutationFn: searchSucursalesUsuario })
}
