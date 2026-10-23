import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import PageShell from '@/components/PageShell'
import { cn } from '@/lib/utils'

export const GEO_NAV = [
  { to: '/geologia/igneas', label: 'Rocas ígneas' },
  { to: '/geologia/sedimentarias', label: 'Rocas sedimentarias' },
  { to: '/geologia/metamorficas', label: 'Rocas metamórficas' },
  { to: '/geologia/minerales', label: 'Minerales' },
]

/** Contenedor común de las páginas de geología: subnavegación + aviso de referencia */
export default function GeoShell({ children, showAlert = true }: { children: ReactNode; showAlert?: boolean }) {
  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <NavLink
          to="/geologia"
          end
          className={({ isActive }) =>
            cn('text-sm font-semibold', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')
          }
        >
          Geología
        </NavLink>
        <span className="text-muted-foreground/50">/</span>
        <nav className="flex flex-wrap items-center gap-1">
          {GEO_NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {showAlert && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Clasificaciones de referencia</AlertTitle>
          <AlertDescription>
            Mueve las barras —o haz clic directamente sobre cada diagrama— para fijar los valores y ver
            cómo el punto se desplaza y cambia el nombre de la roca. Los límites de los campos están
            simplificados: para trabajo de campo o laboratorio, contrasta con las tablas y diagramas
            originales de cada clasificación.
          </AlertDescription>
        </Alert>
      )}

      {children}
    </PageShell>
  )
}
