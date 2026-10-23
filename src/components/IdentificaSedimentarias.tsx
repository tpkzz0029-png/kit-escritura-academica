import { Droplets, ListChecks } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ArbolSedimentarias from '@/components/ArbolSedimentarias'

// Procedimiento de la Guía 3 (sección A y Anexos A-3 a D-3)
const PASOS_CAMPO = [
  {
    titulo: 'Mide el tamaño de los granos con regla',
    detalle:
      'Clasifica el sedimento según el Anexo A-3: bloque (>256 mm), canto (64-256), grava (2-64), arena (1/16-2), limo (1/256-1/16) y arcilla (<1/256 mm).',
  },
  {
    titulo: 'Observa la forma de los clastos',
    detalle:
      'Del muy angular al bien redondeado (Anexo B-3): los bordes pulidos indican transporte largo; las aristas, origen cercano.',
  },
  {
    titulo: 'Evalúa el ordenamiento (clasificación)',
    detalle:
      'Bien clasificados: granos de tamaño parejo. Moderados: varios tamaños sin extremos. Pobres: mezcla de gravas, arenas y lodos.',
  },
  {
    titulo: 'Infere la composición por la coloración',
    detalle:
      'Granos claros translúcidos = cuarzo; rosas o blancos = feldespato; oscuros mixtos = fragmentos de rocas.',
  },
  {
    titulo: 'Aplica la prueba del ácido',
    detalle:
      'Una gota de HCl diluido (o vinagre): si efervescen, es biogénica carbonatada. Con eso entras al cuadro del Anexo D-3.',
  },
]

export default function IdentificaSedimentarias() {
  return (
    <div className="space-y-4">
      <ArbolSedimentarias />

      <Card className="card-accent border-amber-200/60 dark:border-amber-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-amber-600" />
            Pasos de campo de la Guía 3
          </CardTitle>
          <CardDescription>
            Análisis textural previo a la clasificación: tamaño, forma, ordenamiento, coloración y
            prueba del ácido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {PASOS_CAMPO.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{p.titulo}</p>
                  <p className="text-sm text-muted-foreground">{p.detalle}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Droplets className="h-4 w-4 shrink-0" />
            La dolomía efervescente menos que la caliza: si dudas, raya la muestra y pon el ácido
            sobre el polvo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
