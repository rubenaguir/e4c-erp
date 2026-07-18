import { AppProviders } from '@/app/providers'

/**
 * Placeholder de Fase A (fundamentos del repo). El login real y el núcleo de
 * facturas_venta_33 se implementan en la fase siguiente, a partir de
 * specs/features/auth/login.md y specs/features/ventas/facturas_venta_33/*.md
 * (Fase B). Ver docs/plan-implementacion.md.
 */
function AppShell() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground">e4c-erp</h1>
      <p className="text-muted-foreground">
        Scaffold de Fase A listo. El login y las pantallas de negocio se
        implementan a partir de las specs en <code>specs/features/</code>.
      </p>
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
