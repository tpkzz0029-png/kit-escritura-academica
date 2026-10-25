import { Link, useSearchParams } from 'react-router'
import {
  ArrowRight,
  BookOpen,
  ClipboardPen,
  FileText,
  Gem,
  GraduationCap,
  Info,
  Mountain,
  ScanLine,
  SearchCheck,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ACCENTS = {
  sky: { border: 'border-sky-200/70 dark:border-sky-900/50', chip: 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400', btn: 'bg-sky-600 hover:bg-sky-700' },
  violet: { border: 'border-violet-200/70 dark:border-violet-900/50', chip: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400', btn: 'bg-violet-600 hover:bg-violet-700' },
  amber: { border: 'border-amber-200/70 dark:border-amber-900/50', chip: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400', btn: 'bg-amber-600 hover:bg-amber-700' },
  emerald: { border: 'border-emerald-200/70 dark:border-emerald-900/50', chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  red: { border: 'border-red-200/70 dark:border-red-900/50', chip: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400', btn: 'bg-red-600 hover:bg-red-700' },
} as const

type Item = {
  to: string
  icon: LucideIcon
  accent: keyof typeof ACCENTS
  gradient: string
  titulo: string
  descripcion: string
  cta: string
}

const HERRAMIENTAS: Item[] = [
  {
    to: '/conversor',
    icon: FileText,
    accent: 'sky',
    gradient: 'linear-gradient(90deg,#0ea5e9,#22d3ee)',
    titulo: 'Conversor y traductor de PDF',
    descripcion: 'Sube un PDF, extrae su texto, tradúcelo a otro idioma y descárgalo como documento de Word.',
    cta: 'Abrir conversor',
  },
  {
    to: '/detector',
    icon: ScanLine,
    accent: 'violet',
    gradient: 'linear-gradient(90deg,#8b5cf6,#c084fc)',
    titulo: 'Detector de IA y corrector',
    descripcion:
      'Estima si un texto parece generado por IA, revisa ortografía y gramática y propone una versión más natural.',
    cta: 'Abrir detector',
  },
  {
    to: '/plagio',
    icon: SearchCheck,
    accent: 'amber',
    gradient: 'linear-gradient(90deg,#f59e0b,#eab308)',
    titulo: 'Revisión de plagio',
    descripcion:
      'Detecta pasajes repetidos, citas por verificar y frases que ya aparecen en la web, con sugerencias para reescribirlas.',
    cta: 'Abrir plagio',
  },
]

// Estudio: Geología dividida en Rocas (con pestañas) y Minerales
const ESTUDIO: Item[] = [
  {
    to: '/geologia/rocas',
    icon: Mountain,
    accent: 'red',
    gradient: 'linear-gradient(90deg,#ef4444,#f59e0b,#8b5cf6)',
    titulo: 'Rocas',
    descripcion:
      'Ígneas, sedimentarias y metamórficas: diagramas interactivos (QAPF, TAS, Folk, Dunham, facies) y cuestionarios de identificación en mano.',
    cta: 'Abrir rocas',
  },
  {
    to: '/geologia/minerales',
    icon: Gem,
    accent: 'sky',
    gradient: 'linear-gradient(90deg,#0ea5e9,#22d3ee)',
    titulo: 'Minerales',
    descripcion: 'Fichas de identificación por clases químicas, con fotos de cada mineral.',
    cta: 'Abrir minerales',
  },
  {
    to: '/geologia/descripcion',
    icon: ClipboardPen,
    accent: 'emerald',
    gradient: 'linear-gradient(90deg,#10b981,#14b8a6)',
    titulo: 'Descripción de rocas',
    descripcion:
      'Responde preguntas sobre tu muestra de mano con tus propias observaciones y obtén la descripción en prosa lista para copiar.',
    cta: 'Describir una roca',
  },
]

function ItemCard({ to, icon: Icon, accent, gradient, titulo, descripcion, cta }: Item) {
  const a = ACCENTS[accent]
  return (
    <Card
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
}

export default function Home() {
  // La pestaña elegida queda en la URL (?pestana=estudio) para que «atrás» vuelva a la misma
  const [params, setParams] = useSearchParams()
  const pestana = params.get('pestana') === 'estudio' ? 'estudio' : 'herramientas'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="space-y-8 pt-6">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <GraduationCap className="h-4 w-4" />
              Herramientas para la universidad
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Kit académico</h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Herramientas para tus trabajos escritos y material interactivo para estudiar.
            </p>
          </div>

          <Tabs
            value={pestana}
            onValueChange={(v) => setParams(v === 'estudio' ? { pestana: 'estudio' } : {}, { replace: true })}
            className="gap-6"
          >
            <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="herramientas" className="py-2">
                <Wrench className="h-4 w-4" /> Herramientas
              </TabsTrigger>
              <TabsTrigger value="estudio" className="py-2">
                <BookOpen className="h-4 w-4" /> Estudio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="herramientas">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {HERRAMIENTAS.map((h) => (
                  <ItemCard key={h.to} {...h} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="estudio">
              <p className="mb-4 text-sm font-semibold text-muted-foreground">Geología</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ESTUDIO.map((e) => (
                  <ItemCard key={e.to} {...e} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Material de apoyo</AlertTitle>
            <AlertDescription>
              Las herramientas procesan tus documentos en el navegador. Los resultados del detector,
              el plagio y la geología son orientativos: revísalos antes de entregar un trabajo.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
