import { FlaskConical, ListChecks } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ArbolMetamorficas from '@/components/ArbolMetamorficas'

// Procedimiento de la Guía 4 (pasos 1-4 del IV. Procedimiento)
const PASOS_CAMPO = [
  {
    titulo: 'Determina si es foliada o no foliada',
    detalle:
      'Paso 1 de la guía: mira si los minerales se reorganizaron en planos, folios o bandas. Si rompe en capas, es foliada.',
  },
  {
    titulo: 'Observa el tamaño de los cristales',
    detalle:
      'Paso 2: microscópico = bajo grado; visible a simple vista o con lupa = grado intermedio; tamaño notable = alto grado.',
  },
  {
    titulo: 'Define la composición mineralógica',
    detalle:
      'Paso 3: busca mica, granate, anfíboles, cuarzo o calcita. Minerales característicos: kianita y silimanita en esquistos, granates en gneises.',
  },
  {
    titulo: 'Prueba con HCl y asocia el protolito',
    detalle:
      'Paso 4: si efervescente con HCl y equigranular, es mármol (protolito caliza). Los granos de cuarzo lisos apuntan a cuarcita (protolito arenisca).',
  },
]

export default function IdentificaMetamorficas() {
  return (
    <div className="space-y-4">
      <ArbolMetamorficas />

      <Card className="card-accent border-violet-200/60 dark:border-violet-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-violet-600" />
            Pasos de campo de la Guía 4
          </CardTitle>
          <CardDescription>
            Textura, tamaño de cristal, composición y protolito, en ese orden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {PASOS_CAMPO.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{p.titulo}</p>
                  <p className="text-sm text-muted-foreground">{p.detalle}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            <FlaskConical className="h-4 w-4 shrink-0" />
            El aumento del grado de metamorfismo sigue la serie: pizarra → filita → esquisto →
            gneis (Anexo B-4 de la guía).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
