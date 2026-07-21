import { sisnetRequest } from '@/shared/lib/sisnet-client'
import type {
  SearchSucursalesUsuarioParams,
  SearchSucursalesUsuarioResponse,
} from '@/features/auth/types'

export function searchSucursalesUsuario(
  params: SearchSucursalesUsuarioParams,
): Promise<SearchSucursalesUsuarioResponse> {
  return sisnetRequest({
    opReq: 'seguri:acceso:acceso_jwt:SearchSucursalesUsuario',
    params,
  })
}
