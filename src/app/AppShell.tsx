import { NavLink, Outlet } from 'react-router-dom'

import logoIcon from '@/assets/logo-icon.png'
import { navItems } from '@/app/navConfig'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { setSisnetSession } from '@/shared/lib/sisnet-client'

function Topbar() {
  return (
    <header
      className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4"
      style={{ height: 'var(--topbar-h)' }}
    >
      <div className="flex items-center gap-2.5">
        <img src={logoIcon} alt="" width={28} height={28} />
        <span className="text-base font-medium text-foreground">e4c-erp</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => setSisnetSession(null)}>
        Cerrar sesión
      </Button>
    </header>
  )
}

function Sidebar() {
  return (
    <nav
      className="shrink-0 border-r border-border bg-muted p-2"
      style={{ width: 'var(--sidebar-w)' }}
    >
      <ul className="flex flex-col gap-1">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Shell mínimo de navegación (ADR-015) — sidebar + topbar, nav data-driven vía navConfig.ts. */
export function AppShell() {
  return (
    <div className="flex h-svh flex-col">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
