import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'

import loginBackground from '@/assets/login-bg-h.jpg'
import logoIcon from '@/assets/logo-icon.png'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
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
 * Imagen completa del handoff oficial (login-bg-h.png origen), decisión
 * consciente de mantener el mockup visible pese a mostrar la marca
 * "FacturaGlobal" de un producto hermano — ver docs/design-brief.md.
 * Overlay y tratamiento del Card en LoginBackdrop/Card más abajo.
 */
function LoginBackdrop() {
  return (
    <>
      <img
        src={loginBackground}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--foreground) 55%, transparent) 0%, color-mix(in srgb, var(--foreground) 75%, transparent) 100%)',
        }}
      />
    </>
  )
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
  const [showPassword, setShowPassword] = useState(false)

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
      <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-4">
        <LoginBackdrop />
        <Card className="relative z-10 w-full max-w-100 bg-card/97 py-7">
          <CardContent className="space-y-4 px-8">
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
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-4">
      <LoginBackdrop />
      <Card className="relative z-10 w-full max-w-100 bg-card/97 py-7">
        <CardHeader className="px-8">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="e4c-erp" width={32} height={32} />
            <span className="text-base font-medium text-foreground">e4c-erp</span>
          </div>
          <p className="text-[13px] text-muted-foreground">Ingresa tus credenciales</p>
        </CardHeader>

        <CardContent className="px-8">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmitCredentials)}>
            <div className="space-y-1.5">
              <Label htmlFor="usuario">Usuario</Label>
              <Input id="usuario" autoComplete="username" {...form.register('usuario')} />
              {form.formState.errors.usuario && (
                <p className="text-sm text-destructive">{form.formState.errors.usuario.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contrasena">Contraseña</Label>
              <div className="relative">
                <Input
                  id="contrasena"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-10"
                  {...form.register('contrasena')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.contrasena && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contrasena.message}
                </p>
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
        </CardContent>
      </Card>
    </main>
  )
}
