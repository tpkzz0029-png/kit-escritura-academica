import { Link } from 'react-router'
import { ArrowRight, ClipboardPen, Gem, Mountain } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import GeoShell from '@/components/GeoShell'

const SECCIONES = [
  {
    to: '/geologia/rocas',
    gradient: 'linear-gradient(90deg,#ef4444,#f59e0b,#8b5cf6)',
    border: 'border-red-200/70 dark:border-red-900/50',
    chip: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
    btn: 'bg-red-600 hover:bg-red-700',
    icon: Mountain,
    titulo: 'Rocas',
    descripcion:
      'Ígneas, sedimentarias y metamórficas en pestañas: QAPF, TAS, Wentworth, Folk, Dunham, facies, ACF/AKF y cuestionarios de identificación en mano.',
    cta: 'Abrir rocas',
  },
  {
    to: '/geologia/minerales',
    gradient: 'linear-gradient(90deg,#0ea5e9,#22d3ee)',
    border: 'border-sky-200/70 dark:border-sky-900/50',
    chip: 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
    btn: 'bg-sky-600 hover:bg-sky-700',
    icon: Gem,
    titulo: 'Minerales',
    descripcion:
      'Fichas de identificación en muestra de mano agrupadas por clases químicas (Strunz–Dana), con fotos de cada mineral.',
    cta: 'Abrir minerales',
  },
  {
    to: '/geologia/descripcion',
    gradient: 'linear-gradient(90deg,#10b981,#14b8a6)',
    border: 'border-emerald-200/70 dark:border-emerald-900/50',
    chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    icon: ClipboardPen,
    titulo: 'Descripción de rocas',
    descripcion:
      'Responde preguntas sobre tu muestra de mano y obtén la descripción en prosa lista para copiar en tu informe.',
    cta: 'Describir una roca',
  },
]

export default function GeologiaPage() {
  return (
    <GeoShell showAlert={false} showNav={false}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECCIONES.map(({ to, gradient, border, chip, btn, icon: Icon, titulo, descripcion, cta }) => (
          <Card
            key={to}
            className={`card-accent flex flex-col ${border}`}
            style={{ ['--card-accent-gradient' as string]: gradient }}
          >
            <CardHeader>
              <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${chip}`}>
                <Icon className="h-5 w-5" />
              </span>
              <CardTitle className="text-lg">{titulo}</CardTitle>
              <CardDescription>{descripcion}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Link to={to}>
                <Button className={`h-auto w-full whitespace-normal py-2 text-white ${btn}`}>
                  {cta} <ArrowRight className="ml-1.5 h-4 w-4 shrink-0" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </GeoShell>
  )
}
