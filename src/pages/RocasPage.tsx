import type { ComponentType } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import GeoShell from '@/components/GeoShell'
import { IgneasContent, MetamorficasContent, SedimentariasContent } from '@/components/GeologiaPanel'
import { IlustracionEstratos, IlustracionMetamorfica, IlustracionVolcan } from '@/components/RocaIlustraciones'

const TIPOS: {
  id: 'igneas' | 'sedimentarias' | 'metamorficas'
  label: string
  sub: string
  Ilustracion: ComponentType<{ className?: string }>
  Contenido: ComponentType
  activo: string
  texto: string
}[] = [
  {
    id: 'igneas',
    label: 'Ígneas',
    sub: 'Se forman al enfriarse el magma',
    Ilustracion: IlustracionVolcan,
    Contenido: IgneasContent,
    activo: 'border-red-500 ring-2 ring-red-500/30',
    texto: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'sedimentarias',
    label: 'Sedimentarias',
    sub: 'Capas de sedimentos compactados',
    Ilustracion: IlustracionEstratos,
    Contenido: SedimentariasContent,
    activo: 'border-amber-500 ring-2 ring-amber-500/30',
    texto: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'metamorficas',
    label: 'Metamórficas',
    sub: 'Transformadas por presión y calor',
    Ilustracion: IlustracionMetamorfica,
    Contenido: MetamorficasContent,
    activo: 'border-violet-500 ring-2 ring-violet-500/30',
    texto: 'text-violet-600 dark:text-violet-400',
  },
]

/** Página «Rocas»: primero solo los tres tipos con su ilustración; al elegir uno se abre su contenido (?tipo=…) */
export default function RocasPage() {
  const [params, setParams] = useSearchParams()
  const sel = TIPOS.find((x) => x.id === params.get('tipo'))

  const elegir = (id: string) => setParams(sel?.id === id ? {} : { tipo: id }, { replace: true })

  // Con un tipo elegido: encabezado con su ilustración difuminada de fondo y las otras tarjetas ocultas
  const header = sel ? (
    <div className="relative mb-6 overflow-hidden rounded-2xl border">
      <sel.Ilustracion className="absolute inset-0 h-full w-full scale-110 blur-[3px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/5" />
      <div className="relative flex items-center gap-4 px-5 py-8 sm:py-10">
        <button
          type="button"
          onClick={() => setParams({}, { replace: true })}
          aria-label="Volver a los tipos de roca"
          title="Volver a los tipos de roca"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-sm transition-colors hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-white drop-shadow">
          <p className="text-xs font-medium uppercase tracking-wider text-white/80">Rocas</p>
          <h1 className="text-3xl font-bold tracking-tight">{sel.label}</h1>
          <p className="text-sm text-white/90">{sel.sub}</p>
        </div>
      </div>
    </div>
  ) : undefined

  return (
    <GeoShell showAlert={Boolean(sel)} header={header}>
      {!sel && (
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Solo se muestran cuando no hay ningún tipo elegido */}
        {TIPOS.map(({ id, label, sub, Ilustracion }) => (
          <button
            key={id}
            type="button"
            onClick={() => elegir(id)}
            className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Ilustracion className="block h-36 w-full sm:h-40" />
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-lg font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>
        ))}
      </div>
      )}

      {sel ? (
        <div>
          <sel.Contenido />
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-muted-foreground">Elige un tipo de roca para ver sus diagramas y guías.</p>
      )}
    </GeoShell>
  )
}
