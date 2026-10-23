import { Link } from 'react-router'
import {
  ArrowRight,
  Gem,
  GraduationCap,
  Mountain,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Solo Geología está visible en la web; las demás herramientas
// (conversor, detector, plagio) quedan ocultas temporalmente.
const HERRAMIENTAS = [
  {
    to: '/geologia',
    icon: Mountain,
    accent: 'emerald' as const,
    gradient: 'linear-gradient(90deg,#10b981,#14b8a6)',
    titulo: 'Geología',
    descripcion:
      'Clasifica rocas ígneas, sedimentarias y metamórficas con diagramas interactivos (QAPF, Folk, Dunham, facies) e identifica minerales por grupos con fichas de mano y fotos.',
    cta: 'Abrir geología',
  },
]

const ACCENTS = {
  sky: { border: 'border-sky-200/70 dark:border-sky-900/50', chip: 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400', btn: 'bg-sky-600 hover:bg-sky-700' },
  violet: { border: 'border-violet-200/70 dark:border-violet-900/50', chip: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400', btn: 'bg-violet-600 hover:bg-violet-700' },
  amber: { border: 'border-amber-200/70 dark:border-amber-900/50', chip: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400', btn: 'bg-amber-600 hover:bg-amber-700' },
  emerald: { border: 'border-emerald-200/70 dark:border-emerald-900/50', chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700' },
} as const

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="space-y-8 pt-6">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <GraduationCap className="h-4 w-4" />
              Petrología y mineralogía para la universidad
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Geología interactiva
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Aprende petrología y mineralogía con diagramas clásicos interactivos (QAPF, Folk,
              Dunham, facies metamórficas), guías de identificación de muestras de mano y fichas
              completas de minerales con fotos de referencia.
            </p>
          </div>

          <div className="mx-auto grid max-w-md gap-4">
            {HERRAMIENTAS.map(({ to, icon: Icon, accent, gradient, titulo, descripcion, cta }) => {
              const a = ACCENTS[accent]
              return (
                <Card
                  key={to}
                  className={`card-accent flex flex-col ${a.border}`}
                  style={{ ['--card-accent-gradient' as string]: gradient }}
                >
                  <CardHeader>
                    <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${a.chip}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <CardTitle className="text-lg">{titulo}</CardTitle>
                    <CardDescription>{descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Link to={to}>
                      <Button className={`h-auto w-full whitespace-normal py-2 text-white ${a.btn}`}>
                        {cta} <ArrowRight className="ml-1.5 h-4 w-4 shrink-0" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Alert>
            <Gem className="h-4 w-4" />
            <AlertTitle>Material de estudio de apoyo</AlertTitle>
            <AlertDescription>
              Los diagramas y guías siguen los esquemas clásicos de las guías de campo y los
              manuales de mineralogía y petrología. Úsalos para practicar la identificación de
              rocas y minerales; la determinación definitiva de una muestra requiere análisis
              de laboratorio (lámina delgada, difracción de rayos X).
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
