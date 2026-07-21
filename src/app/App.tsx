import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppProviders } from '@/app/providers'
import { AppShell } from '@/app/AppShell'
import { LoginScreen } from '@/features/auth/components/LoginScreen'
import { useSessionRefresh } from '@/features/auth/hooks/useSessionRefresh'
import { useSisnetSession } from '@/features/auth/hooks/useSisnetSession'
import { FacturasListScreen } from '@/features/ventas/facturas_venta_33/components/FacturasListScreen'

/**
 * El Master (alta/edición/timbrado/cancelación) de facturas_venta_33 se
 * implementa en la Capa 2 de Fase 3 — la ruta de abajo es un placeholder
 * temporal, no la pantalla real.
 */
function FacturaMasterPlaceholder() {
  return <div>Master — Capa 2 pendiente</div>
}

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
        <Route path="/ventas/facturas" element={<FacturasListScreen />} />
        <Route path="/ventas/facturas/nueva" element={<FacturaMasterPlaceholder />} />
        <Route path="/ventas/facturas/:serie/:folio" element={<FacturaMasterPlaceholder />} />
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
