import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, HelpCircle, RotateCcw, Sparkles, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type QKey = 'crist' | 'vesic' | 'tama' | 'grano' | 'dist' | 'comp' | 'otras'
type Answers = Partial<Record<QKey, string>>

type Candidate = {
  id: string
  nombre: string
  familia: string
  comp: string
  desc: string
  confirm: string
  accepts: Partial<Record<QKey, string[]>>
}

// Tabla de clasificación del Anexo C-2 de la Guía 2 (textura × composición)
const CANDIDATES: Candidate[] = [
  { id: 'toba', nombre: 'Toba', familia: 'Piroclástica', comp: 'Fragmentos < 2 mm', desc: 'Ceniza volcánica, lapilli fino y cristales emitidos en erupciones; trazas de vidrio muy comunes.', confirm: 'Textura piroclástica con fragmentos < 2 mm (Anexo C-2).', accepts: { otras: ['piro-fina'] } },
  { id: 'brecha-volcanica', nombre: 'Brecha volcánica', familia: 'Piroclástica', comp: 'Fragmentos > 2 mm', desc: 'Bloques angulares, lapilli grueso y ceniza: fragmentos mayores de 2 mm de origen volcánico.', confirm: 'Textura piroclástica con fragmentos > 2 mm (Anexo C-2).', accepts: { otras: ['piro-gruesa'] } },
  { id: 'obsidiana', nombre: 'Obsidiana', familia: 'Vítrea (holohialina)', comp: 'Vidrio compacto', desc: 'Vidrio volcánico negro brillante con fractura conchoidal; misma composición que la riolita.', confirm: 'Vidrio compacto, sin vesículas (Anexo C-2).', accepts: { crist: ['holohialina'], vesic: ['no'] } },
  { id: 'pumita', nombre: 'Pumita', familia: 'Vítrea (holohialina, vacuolar)', comp: 'Vidrio con vesículas', desc: 'Vidrio volcánico claro, ligero, lleno de huecos de gas; flota en el agua.', confirm: 'Vidrio vacuolar: con vesículas (Anexo C-2).', accepts: { crist: ['holohialina'], vesic: ['si'] } },
  { id: 'granito', nombre: 'Granito', familia: 'Plutónica (fanerítica)', comp: 'Félsica (granítica)', desc: 'Cuarzo, feldespato potásico y plagioclasa rica en sodio con moscovita/biotita; menos del 25 % de oscuros.', confirm: 'Composición granítica + textura fanerítica (Anexo C-2).', accepts: { crist: ['holocristalina', 'hipocristalina'], tama: ['faneritica'], comp: ['felsica'] } },
  { id: 'riolita', nombre: 'Riolita', familia: 'Volcánica (afanítica)', comp: 'Félsica (granítica)', desc: 'Misma mineralogía que el granito pero de grano fino o vítrea; clara, gris o rosada.', confirm: 'Composición granítica + textura afanítica (Anexo C-2).', accepts: { crist: ['holocristalina', 'hipocristalina'], tama: ['afanitica'], comp: ['felsica'] } },
  { id: 'diorita', nombre: 'Diorita', familia: 'Plutónica (fanerítica)', comp: 'Intermedia (andesítica)', desc: 'Plagioclasa rica en sodio-calcio con anfíbol, biotita y piroxeno; 25-45 % de oscuros.', confirm: 'Composición andesítica + textura fanerítica (Anexo C-2).', accepts: { crist: ['holocristalina', 'hipocristalina'], tama: ['faneritica'], comp: ['intermedia'] } },
  { id: 'andesita', nombre: 'Andesita', familia: 'Volcánica (afanítica)', comp: 'Intermedia (andesítica)', desc: 'Gris media, la lava típica de los estratovolcanes; a menudo porfídica con plagioclasa.', confirm: 'Composición andesítica + textura afanítica (Anexo C-2).', accepts: { crist: ['holocristalina', 'hipocristalina'], tama: ['afanitica'], comp: ['intermedia'] } },
  { id: 'gabro', nombre: 'Gabro', familia: 'Plutónica (fanerítica)', comp: 'Máfica (basáltica)', desc: 'Plagioclasa rica en calcio con piroxeno y olivino; 45-85 % de oscuros, sin cuarzo.', confirm: 'Composición basáltica + textura fanerítica (Anexo C-2).', accepts: { crist: ['holocristalina', 'hipocristalina'], tama: ['faneritica'], comp: ['mafica'] } },
  { id: 'basalto', nombre: 'Basalto', familia: 'Volcánica (afanítica)', comp: 'Máfica (basáltica)', desc: 'Negra o gris oscura, compacta; la lava más común del planeta; a veces vesicular.', confirm: 'Composición basáltica + textura afanítica (Anexo C-2).', accepts: { crist: ['holocristalina', 'hipocristalina'], tama: ['afanitica'], comp: ['mafica'] } },
  { id: 'peridotita', nombre: 'Peridotita', familia: 'Plutónica ultramáfica (fanerítica)', comp: 'Ultramáfica', desc: 'Olivino y piroxenos casi puros (85-100 % de oscuros); verde oliva, densa y pesada.', confirm: 'Composición ultramáfica + textura fanerítica (Anexo C-2).', accepts: { crist: ['holocristalina', 'hipocristalina'], tama: ['faneritica'], comp: ['ultramafica'] } },
  { id: 'komatiita', nombre: 'Komatiita', familia: 'Volcánica ultramáfica (afanítica)', comp: 'Ultramáfica (poco común)', desc: 'Lava ultramáfica de grano fino, verde oscuro; típica del Arcaico.', confirm: 'Composición ultramáfica + textura afanítica (Anexo C-2).', accepts: { crist: ['holocristalina', 'hipocristalina'], tama: ['afanitica'], comp: ['ultramafica'] } },
]

type Question = {
  key: QKey
  titulo: string
  ayuda: string
  opciones: { value: string; label: string; hint?: string }[]
}

function aliveList(a: Answers): Candidate[] {
  const base = CANDIDATES.filter((c) =>
    (Object.keys(a) as QKey[]).every((k) => {
      const v = a[k]
      if (v === undefined) return true
      const acc = c.accepts[k]
      return !acc || acc.includes(v)
    })
  )
  // La textura piroclástica redefine la roca (paso C de la guía)
  if (a.otras === 'piro-fina' || a.otras === 'piro-gruesa') {
    return base.filter((c) => c.accepts.otras?.includes(a.otras as string))
  }
  // Las piroclásticas solo se consideran si el usuario eligió textura
  // piroclástica; si no, ensucian el listado (p. ej. en el camino vítreo).
  if (a.otras === undefined) {
    return base.filter((c) => !c.accepts.otras)
  }
  return base
}

function matchScore(c: Candidate, a: Answers): number {
  return (Object.keys(a) as QKey[]).reduce((n, k) => {
    const v = a[k]
    if (v === undefined) return n
    return c.accepts[k]?.includes(v) ? n + 1 : n
  }, 0)
}

// Pasos del IV. Procedimiento experimental de la Guía 2:
// A.1 cristalinidad → A.2 tamaño → A.3 distribución → B índice de color → C otras texturas → D tabla C-2
function questionFlow(a: Answers): Question[] {
  const qs: Question[] = [
    {
      key: 'crist',
      titulo: 'Paso A.1 · ¿Cuál es el grado de cristalinidad?',
      ayuda: 'Cuando el magma se solidifica lento se forman cristales grandes; cuanto más rápido, más pequeños. Enfriamiento muy rápido = vidrio. Evalúa el % de vidrio frente a cristales.',
      opciones: [
        { value: 'holohialina', label: 'Holohialina: más del 90 % del volumen es vidrio', hint: 'brillo vítreo, fractura curva tipo concha' },
        { value: 'hipocristalina', label: 'Hipocristalina o hipohialina: parte vidrio, parte cristales', hint: 'ninguno de los dos excede el 90 %' },
        { value: 'holocristalina', label: 'Holocristalina: más del 90 % son cristales', hint: 'casi sin vidrio visible' },
      ],
    },
  ]
  if (a.crist === 'holohialina') {
    // Textura vesicular = paso C, aplicada a holohialinas (obsidiana vs pumita del Anexo C-2)
    qs.push({
      key: 'vesic',
      titulo: 'Paso C · ¿Tiene vesículas (huecos dejados por el gas)?',
      ayuda: 'En rocas afaníticas pueden observarse pequeños huecos dejados por las burbujas de gas al solidificar el magma: son vesículas.',
      opciones: [
        { value: 'no', label: 'No: vidrio compacto', hint: 'obsidiana según el Anexo C-2' },
        { value: 'si', label: 'Sí: llena de huecos', hint: 'pumita según el Anexo C-2' },
      ],
    })
    return qs
  }
  qs.push({
    key: 'tama',
    titulo: 'Paso A.2 · ¿De qué tamaño son los cristales?',
    ayuda: 'Fanerítica: cristales reconocibles a simple vista (muy grueso >30 mm, grueso 30-5 mm, medio 5-2 mm, fino <2 mm). Afanítica: no se reconocen a simple vista, se necesita lupa o microscopio.',
    opciones: [
      { value: 'faneritica', label: 'Fanerítica: cristales visibles a simple vista', hint: 'elige el grano en la siguiente pregunta' },
      { value: 'afanitica', label: 'Afanítica: no se ven a simple vista', hint: 'requieren lupa o microscopio' },
    ],
  })
  if (a.tama === 'faneritica') {
    qs.push({
      key: 'grano',
      titulo: 'Paso A.2 · ¿Qué grano fanerítico tiene? (mide con regla)',
      ayuda: 'Subclasificación por tamaño: grano muy grueso (>30 mm), grueso (30-5 mm), medio (5-2 mm) y fino (<2 mm pero visible).',
      opciones: [
        { value: 'muy-grueso', label: 'Grano muy grueso', hint: 'mayor de 30 mm' },
        { value: 'grueso', label: 'Grano grueso', hint: '30 a 5 mm' },
        { value: 'medio', label: 'Grano medio', hint: '5 a 2 mm' },
        { value: 'fino', label: 'Grano fino', hint: 'menor de 2 mm, visible' },
      ],
    })
  }
  qs.push(
    {
      key: 'dist',
      titulo: 'Paso A.3 · ¿Cómo se distribuye el tamaño de los cristales?',
      ayuda: 'Para las faneríticas: equigranular (tamaño similar), inequigranular (tamaños distintos) o porfídica (cristales grandes englobados en matriz menor). Si hay fenocristales apreciables, «porfídico» precede al nombre (Anexo C-2).',
      opciones: [
        { value: 'equigranular', label: 'Equigranular', hint: 'cristales de tamaño similar' },
        { value: 'inequigranular', label: 'Inequigranular', hint: 'cristales de tamaños distintos' },
        { value: 'porfidica', label: 'Porfídica', hint: 'cristales grandes en matriz de menor tamaño' },
      ],
    },
    {
      key: 'comp',
      titulo: 'Paso B · ¿Cuál es la composición según el índice de color?',
      ayuda: 'El color estima el % de minerales ferromagnesianos (oscuros): félsica <15 %, intermedia 15-40 %, máfica >40 %, ultramáfica casi 100 % (Anexo B-2: clara 0-25 %, media 25-45 %, oscura 45-85 %, verde-negra 85-100 %).',
      opciones: [
        { value: 'felsica', label: 'Félsica (granítica)', hint: 'clara: menos del 25 % de oscuros' },
        { value: 'intermedia', label: 'Intermedia (andesítica)', hint: 'gris media: 25-45 % de oscuros' },
        { value: 'mafica', label: 'Máfica (basáltica)', hint: 'oscura: 45-85 % de oscuros' },
        { value: 'ultramafica', label: 'Ultramáfica', hint: 'verde-negra: 85-100 % de oscuros' },
      ],
    },
    {
      key: 'otras',
      titulo: 'Paso C · ¿Presenta alguna otra textura?',
      ayuda: 'Vesicular: huecos de gas en rocas afaníticas. Piroclástica: fragmentos emitidos en erupciones (toba <2 mm, brecha volcánica >2 mm).',
      opciones: [
        { value: 'ninguna', label: 'Ninguna textura especial', hint: 'textura normal según lo respondido' },
        { value: 'vesicular', label: 'Vesicular', hint: 'huecos de gas por enfriamiento rápido con gas' },
        { value: 'piro-fina', label: 'Piroclástica: fragmentos < 2 mm', hint: 'toba' },
        { value: 'piro-gruesa', label: 'Piroclástica: fragmentos > 2 mm', hint: 'brecha volcánica' },
      ],
    }
  )
  return qs
}

export default function ArbolIgneas() {
  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState(0)
  const questions = useMemo(() => questionFlow(answers), [answers])
  const done = step >= questions.length
  const alive = useMemo(() => aliveList(answers), [answers])

  const choose = (key: QKey, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setStep((s) => s + 1)
  }
  const back = () => {
    const prevKey = questions[step - 1]?.key
    setAnswers((prev) => {
      const n = { ...prev }
      if (prevKey) delete n[prevKey]
      return n
    })
    setStep((s) => Math.max(0, s - 1))
  }
  const restart = () => {
    setAnswers({})
    setStep(0)
  }

  const TEXTO_CRIST: Record<string, string> = {
    holohialina: 'holohialina (casi todo vidrio)',
    hipocristalina: 'hipocristalina (vidrio + cristales)',
    holocristalina: 'holocristalina (casi todo cristales)',
  }
  const resumen = (Object.keys(answers) as QKey[])
    .map((k) => {
      if (k === 'crist') return TEXTO_CRIST[answers[k] || '']
      if (k === 'vesic') return answers[k] === 'si' ? 'con vesículas' : 'vidrio compacto'
      if (k === 'tama') return answers[k] === 'faneritica' ? 'fanerítica' : 'afanítica'
      if (k === 'grano') return 'grano ' + answers[k]
      if (k === 'dist') return answers[k] === 'porfidica' ? 'porfídica' : answers[k] === 'equigranular' ? 'equigranular' : 'inequigranular'
      if (k === 'comp') return answers[k] === 'ultramafica' ? 'ultramáfica' : (answers[k] || '')
      if (k === 'otras') return answers[k] === 'ninguna' ? 'sin textura especial' : answers[k] === 'vesicular' ? 'vesicular' : answers[k] === 'piro-fina' ? 'piroclástica fina (toba)' : 'piroclástica gruesa (brecha)'
      return answers[k]
    })
    .filter(Boolean)
    .join(' · ')

  const best = done
    ? [...alive].sort((x, y) => matchScore(y, answers) - matchScore(x, answers))[0]
    : undefined
  const esPorfidica = done && answers.dist === 'porfidica' && best !== undefined

  return (
    <Card className="card-accent border-rose-200/60 dark:border-rose-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#f43f5e,#fb923c)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="h-5 w-5 text-rose-600" />
          ¿Qué roca ígnea tengo en la mano?
        </CardTitle>
        <CardDescription>
          Paso a paso según la Guía 2: A.1 cristalinidad → A.2 tamaño → A.3 distribución →
          B índice de color → C otras texturas → D tabla del Anexo C-2.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Candidatas ({alive.length} de {CANDIDATES.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CANDIDATES.map((c) => {
              const isAlive = alive.includes(c)
              return (
                <Badge
                  key={c.id}
                  variant="secondary"
                  className={
                    isAlive
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground/60 line-through opacity-60'
                  }
                >
                  {isAlive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {c.nombre}
                </Badge>
              )
            })}
          </div>
        </div>

        {!done ? (
          <>
            <div className="flex items-center gap-3">
              <Progress value={(step / questions.length) * 100} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">
                Pregunta {step + 1} de {questions.length}
              </span>
            </div>
            {resumen && (
              <p className="rounded-md bg-rose-50 px-3 py-1.5 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                Hasta ahora: {resumen}
              </p>
            )}
            <div>
              <p className="mb-1 text-base font-semibold">{questions[step].titulo}</p>
              <p className="mb-3 text-sm text-muted-foreground">{questions[step].ayuda}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {questions[step].opciones.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => choose(questions[step].key, o.value)}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-rose-400 hover:bg-rose-50 dark:border-rose-900 dark:bg-transparent dark:hover:bg-rose-950/50"
                  >
                    <span className="font-medium">{o.label}</span>
                    {o.hint && <span className="block text-xs text-muted-foreground">{o.hint}</span>}
                  </button>
                ))}
              </div>
            </div>
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={back}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Atrás
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950/50">
              <p className="mb-1 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" /> Paso D · Tu muestra es muy probablemente
              </p>
              {best ? (
                <>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    {esPorfidica ? `${best.nombre} ${best.nombre.endsWith('a') ? 'porfídica' : 'porfídico'}` : best.nombre}
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    <Badge className="bg-emerald-200 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200">{best.familia}</Badge>
                    <Badge variant="outline">{best.comp}</Badge>
                  </div>
                  <p className="mx-auto mt-3 max-w-md text-sm text-emerald-900/80 dark:text-emerald-100/80">{best.desc}</p>
                  <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{best.confirm}</p>
                  {esPorfidica && (
                    <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                      «Porfídico» precede al nombre siempre que haya fenocristales apreciables (Anexo C-2).
                    </p>
                  )}
                  {alive.length > 1 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      También encaja con: {alive.slice(1).map((c) => c.nombre).join(', ')}. Compara con la tabla del Anexo C-2.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-emerald-900 dark:text-emerald-100">
                  Las respuestas se contradicen (p. ej. cristalinidad vítrea con granos visibles).
                  Toca «Empezar de nuevo» y revisa la muestra con calma.
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Empezar de nuevo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
