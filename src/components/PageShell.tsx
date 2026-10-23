import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { GraduationCap, Mountain } from 'lucide-react'
import { cn } from '@/lib/utils'

// Solo Geología está visible en la web; las demás herramientas
// (conversor, detector, plagio) quedan ocultas temporalmente.
const NAV = [{ to: '/geologia', icon: Mountain, label: 'Geología' }]

/** Barra de navegación + contenedor común de las páginas de herramientas */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <GraduationCap className="h-5 w-5 text-primary" />
            Geología interactiva
          </Link>
          <nav className="flex flex-wrap items-center gap-1 md:ml-auto">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
