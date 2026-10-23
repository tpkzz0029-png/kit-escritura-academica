import { Link } from 'react-router'
import { ArrowRight, Gem, Mountain } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import GeoShell from '@/components/GeoShell'

const SECCIONES = [
  {
    to: '/geologia/igneas',
    gradient: 'linear-gradient(90deg,#ef4444,#f97316)',
    border: 'border-red-200/70 dark:border-red-900/50',
    chip: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
    btn: 'bg-red-600 hover:bg-red-700',
    icon: Mountain,
    titulo: 'Rocas ígneas',
    descripcion:
      'Diagrama QAPF de Streckeisen (plutónicas y volcánicas), triángulo de ultramáficas, diagrama TAS químico y cuestionario de identificación en mano paso a paso.',
    cta: 'Abrir ígneas',
  },
  {
    to: '/geologia/sedimentarias',
    gradient: 'linear-gradient(90deg,#f59e0b,#eab308)',
    border: 'border-amber-200/70 dark:border-amber-900/50',
    chip: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    btn: 'bg-amber-600 hover:bg-amber-700',
    icon: Mountain,
    titulo: 'Rocas sedimentarias',
    descripcion:
      'Escala de Wentworth, triángulos QFL y de Picard para detríticas, clasificaciones de Folk y Dunham para carbonatadas, evaporitas, sílices, carbones e identificación en mano.',
    cta: 'Abrir sedimentarias',
  },
  {
    to: '/geologia/metamorficas',
    gradient: 'linear-gradient(90deg,#8b5cf6,#c084fc)',
    border: 'border-violet-200/70 dark:border-violet-900/50',
    chip: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    btn: 'bg-violet-600 hover:bg-violet-700',
    icon: Mountain,
    titulo: 'Rocas metamórficas',
    descripcion:
      'Diagrama de facies (presión–temperatura), triángulos de composición ACF/AKF, matriz textural IUGS y cuestionario de identificación en mano con protolitos.',
    cta: 'Abrir metamórficas',
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
      'Fichas de identificación en muestra de mano agrupadas por clases químicas (Strunz–Dana): nativos, sulfuros, óxidos, haluros, carbonatos, sulfatos, fosfatos y silicatos.',
    cta: 'Abrir minerales',
  },
]

export default function GeologiaPage() {
  return (
    <GeoShell showAlert={false}>
      <div className="grid gap-4 sm:grid-cols-2">
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
