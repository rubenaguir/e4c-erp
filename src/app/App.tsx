import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppProviders } from '@/app/providers'
import { AppShell } from '@/app/AppShell'
import { LoginScreen } from '@/features/auth/components/LoginScreen'
import { useSessionRefresh } from '@/features/auth/hooks/useSessionRefresh'
import { useSisnetSession } from '@/features/auth/hooks/useSisnetSession'

/**
 * El núcleo de facturas_venta_33 se implementa en la fase siguiente (Fase 3),
 * a partir de specs/features/ventas/facturas_venta_33/*.md — la ruta de abajo
 * es un placeholder temporal, no la pantalla real.
 */
function AppRoutes() {
  useSessionRefresh()
  const session = useSisnetSession()

  if (!session) {
    return <LoginScreen />
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/ventas/facturas" replace />} />
        <Route path="/ventas/facturas" element={<div>Facturas — Fase 3 pendiente</div>} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}
