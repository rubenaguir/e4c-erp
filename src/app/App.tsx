import { AppProviders } from '@/app/providers'
import { Button } from '@/shared/components/ui/button'
import { LoginScreen } from '@/features/auth/components/LoginScreen'
import { useSessionRefresh } from '@/features/auth/hooks/useSessionRefresh'
import { useSisnetSession } from '@/features/auth/hooks/useSisnetSession'
import { setSisnetSession } from '@/shared/lib/sisnet-client'

/**
 * El núcleo de facturas_venta_33 se implementa en la fase siguiente (Fase 3),
 * a partir de specs/features/ventas/facturas_venta_33/*.md. El enrutamiento
 * protegido (react-router-dom) llega junto con esa primera pantalla de
 * negocio — hasta entonces, esta pantalla placeholder es todo lo que hay
 * detrás de una sesión válida.
 */
function AppShell() {
  useSessionRefresh()
  const session = useSisnetSession()

  if (!session) {
    return <LoginScreen />
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground">e4c-erp</h1>
      <p className="text-muted-foreground">
        Sesión activa. Las pantallas de negocio se implementan a partir de
        las specs en <code>specs/features/</code>.
      </p>
      <Button variant="outline" onClick={() => setSisnetSession(null)}>
        Cerrar sesión
      </Button>
    </main>
  )
}

export function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  )
}
