import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { ArrowLeft, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import PageShell from '@/components/PageShell'

export const GEO_NAV = [
  { to: '/geologia/rocas', label: 'Rocas' },
  { to: '/geologia/minerales', label: 'Minerales' },
  { to: '/geologia/descripcion', label: 'Descripción de rocas' },
]

/** Contenedor común de las páginas de geología: título de la sección + aviso de referencia */
export default function GeoShell({
  children,
  showAlert = true,
  showNav = true,
  header,
}: {
  children: ReactNode
  showAlert?: boolean
  /** Título de la sección actual (p. ej. «Rocas ígneas»). Se oculta en la portada de Geología. */
  showNav?: boolean
  /** Encabezado propio que reemplaza al título por defecto (p. ej. con imagen de fondo) */
  header?: ReactNode
}) {
  const { pathname } = useLocation()
  const actual = GEO_NAV.find((n) => pathname.startsWith(n.to))
  return (
    <PageShell>
      {header}
      {!header && showNav && actual && (
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/?pestana=estudio"
            aria-label="Volver al inicio"
            title="Volver al inicio"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{actual.label}</h1>
        </div>
      )}

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
