import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { useSearchSucursalesUsuario } from '@/features/auth/hooks/useSearchSucursalesUsuario'
import type { SucursalUsuario } from '@/features/auth/types'

const credentialsSchema = z.object({
  usuario: z.string().min(1, 'El usuario es requerido'),
  contrasena: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean(),
})

type CredentialsFormValues = z.infer<typeof credentialsSchema>

type PendingCredentials = {
  usuario: string
  contrasena: string
  rememberMe: boolean
}

/**
 * Pantalla de login — flujo de dos pasos (specs/features/auth/login.md):
 * SearchSucursalesUsuario primero; si hay una sola combinación empresa/
 * sucursal/instancia se omite el selector y se llama Login directo, si hay
 * más de una se muestra un selector antes de llamar Login.
 */
export function LoginScreen() {
  const [pending, setPending] = useState<PendingCredentials | null>(null)
  const [sucursales, setSucursales] = useState<SucursalUsuario[] | null>(null)

  const searchSucursales = useSearchSucursalesUsuario()
  const login = useLogin()

  const form = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { usuario: '', contrasena: '', rememberMe: false },
  })

  async function onSubmitCredentials(values: CredentialsFormValues) {
    const { record } = await searchSucursales.mutateAsync({ usuario_id: values.usuario })

    if (record.length === 1) {
      await login.mutateAsync({
        usuario: values.usuario,
        contrasena: values.contrasena,
        sucursal: record[0].empresa_sucursal_id,
        rememberMe: values.rememberMe,
      })
      return
    }

    setPending({
      usuario: values.usuario,
      contrasena: values.contrasena,
      rememberMe: values.rememberMe,
    })
    setSucursales(record)
  }

  async function onSelectSucursal(empresaSucursalId: string) {
    if (!pending) return
    await login.mutateAsync({
      usuario: pending.usuario,
      contrasena: pending.contrasena,
      sucursal: empresaSucursalId,
      rememberMe: pending.rememberMe,
    })
  }

  const error = searchSucursales.error ?? login.error
  const isLoading = searchSucursales.isPending || login.isPending
  const rememberMe = useWatch({ control: form.control, name: 'rememberMe' })

  if (sucursales) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Selecciona una sucursal</h1>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <div className="flex flex-col gap-2">
            {sucursales.map((sucursal) => (
              <Button
                key={sucursal.empresa_sucursal_id}
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => onSelectSucursal(sucursal.empresa_sucursal_id)}
              >
                {sucursal.descripcion}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSucursales(null)
              setPending(null)
            }}
          >
            Volver
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={form.handleSubmit(onSubmitCredentials)}
      >
        <h1 className="text-xl font-semibold text-foreground">e4c-erp</h1>

        <div className="space-y-1.5">
          <Label htmlFor="usuario">Usuario</Label>
          <Input id="usuario" autoComplete="username" {...form.register('usuario')} />
          {form.formState.errors.usuario && (
            <p className="text-sm text-destructive">{form.formState.errors.usuario.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contrasena">Contraseña</Label>
          <Input
            id="contrasena"
            type="password"
            autoComplete="current-password"
            {...form.register('contrasena')}
          />
          {form.formState.errors.contrasena && (
            <p className="text-sm text-destructive">{form.formState.errors.contrasena.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => form.setValue('rememberMe', checked === true)}
          />
          <Label htmlFor="rememberMe">Recordarme</Label>
        </div>

        {error && <p className="text-sm text-destructive">{error.message}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </main>
  )
}
