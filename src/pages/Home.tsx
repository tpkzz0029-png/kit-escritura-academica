import { Link } from 'react-router'
import {
  ArrowRight,
  Bot,
  FileText,
  GraduationCap,
  Mountain,
  SearchCheck,
  ShieldAlert,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LANGUAGES } from '@/lib/languages'

const HERRAMIENTAS = [
  {
    to: '/conversor',
    icon: FileText,
    accent: 'sky' as const,
    gradient: 'linear-gradient(90deg,#0ea5e9,#22d3ee)',
    titulo: '1 · Conversor de PDF',
    descripcion: `Sube un PDF, extrae su texto página por página, tradúcelo a ${LANGUAGES.length}+ idiomas y descárgalo como documento Word (.docx) listo para editar.`,
    cta: 'Abrir conversor',
  },
  {
    to: '/detector',
    icon: Bot,
    accent: 'violet' as const,
    gradient: 'linear-gradient(90deg,#8b5cf6,#d946ef)',
    titulo: '2 · Detector de IA y Humanizador',
    descripcion:
      'Analiza el texto oración por oración con criterios estilo Turnitin (perplejidad, burstiness, frases de molde) y, si supera el 15 %, humanízalo con la IA integrada para bajar la puntuación antes de entregar.',
    cta: 'Abrir detector',
  },
  {
    to: '/plagio',
    icon: SearchCheck,
    accent: 'amber' as const,
    gradient: 'linear-gradient(90deg,#f59e0b,#f97316)',
    titulo: '3 · Plagio y Corrector',
    descripcion:
      'Detecta pasajes repetidos, citas sin referencia y textos reciclados de internet, y corrige gramática, concordancia y estilo palabra por palabra o párrafo a párrafo.',
    cta: 'Abrir detector de plagio',
  },
  {
    to: '/geologia',
    icon: Mountain,
    accent: 'emerald' as const,
    gradient: 'linear-gradient(90deg,#10b981,#14b8a6)',
    titulo: '4 · Geología',
    descripcion:
      'Clasifica rocas ígneas, sedimentarias y metamórficas con diagramas interactivos (QAPF, Folk, Dunham, facies) e identifica minerales por grupos con fichas de mano.',
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
              Pensado para tesis, ensayos e informes
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tu kit de escritura académica
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Todo lo que necesitas para entregar un trabajo escrito limpio: extraes y traduces
              tus fuentes, compruebas que el texto suene a persona y no a IA, y verificas que
              sea original y esté bien escrito. Con criterios universitarios integrados:
              menos del 15 % de detección de IA y menos del 20 % de plagio.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Herramienta de apoyo, no de sustitución</AlertTitle>
            <AlertDescription>
              Los detectores son estimaciones orientativas: un porcentaje alto no demuestra uso de
              IA y uno bajo no lo descarta. Usa la app para mejorar tu propia redacción; la versión
              final de un trabajo debe reflejar tu análisis y tus palabras.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
