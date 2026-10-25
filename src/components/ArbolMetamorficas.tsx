import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, HelpCircle, RotateCcw, Sparkles, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import RocaFoto from '@/components/RocaFoto'

type QKey = 'fol' | 'grano' | 'tipo' | 'subtipo' | 'minvis'
type Answers = Partial<Record<QKey, string>>

type Candidate = {
  id: string
  nombre: string
  familia: string
  comp: string
  protolito: string
  desc: string
  confirm: string
  accepts: Partial<Record<QKey, string[]>>
}

// Cuadro del Anexo B-4 de la Guía 4 (las 11 rocas: foliada/no foliada × tamaño de grano)
const CANDIDATES: Candidate[] = [
  { id: 'pizarra', nombre: 'Pizarra', familia: 'Foliada · grano fino', comp: 'Minerales planares microscópicos', protolito: 'Lutita o lodolita', desc: 'Roca plana y lisa; la exfoliación está mejor desarrollada que la foliación. Brillo opaco, se parte en láminas planas y duras a lo largo de los planos de exfoliación.', confirm: 'Grano fino + exfoliación plana mejor desarrollada que la foliación (brillo opaco) = Pizarra, según el Anexo B-4.', accepts: { fol: ['si'], grano: ['fino'], tipo: ['no-plat'], subtipo: ['pizarra'] } },
  { id: 'filita', nombre: 'Filita', familia: 'Foliada · grano fino', comp: 'Micas finas + clorita', protolito: 'Lutita o lodolita', desc: 'Foliación ondulada desarrollada mejor que la exfoliación; se rompe a lo largo de superficies arrugadas u onduladas con brillo metálico.', confirm: 'Grano fino + foliación ondulada con brillo metálico = Filita, según el Anexo B-4.', accepts: { fol: ['si'], grano: ['fino'], tipo: ['no-plat'], subtipo: ['filita'] } },
  { id: 'esquisto', nombre: 'Esquisto', familia: 'Foliada · grano medio a grueso', comp: 'Clorita, biotita, moscovita, kianita, anfíboles, silimanita', protolito: 'Lutita o lodolita', desc: 'Esquistosidad: foliación formada por alineamiento visible de cristales; la roca se rompe a lo largo de superficies escamosas de exfoliación, con textura cristalina. Puede presentar minerales platinados (clorita, biotita, muscovita), cristales laminares (kianita) o prismáticos (anfíboles, turmalina, silimanita).', confirm: 'Esquistosidad con minerales platinados visibles a simple vista = Esquisto, según el Anexo B-4.', accepts: { fol: ['si'], tipo: ['esquisto'] } },
  { id: 'gneis', nombre: 'Gneis', familia: 'Foliada · grano medio a grueso', comp: 'Bandas alternas de minerales claros y oscuros', protolito: 'Granito', desc: 'Bandeado gneísico: los minerales están separados en bandas alternas, dándole a la roca una textura bandeada en vista lateral y textura cristalina; cristales visibles de dos o más minerales alternando en bandas de foliación claras y oscuras.', confirm: 'Grano medio a grueso + bandeado gneísico (bandas claras y oscuras) = Gneis, según el Anexo B-4.', accepts: { fol: ['si'], grano: ['grueso'], tipo: ['gneis'] } },
  { id: 'antracita', nombre: 'Carbón de antracita', familia: 'No foliada · grano fino', comp: 'Carbono fijo muy alto', protolito: 'Turba, lignito y carbón bituminoso', desc: 'Textura vítrea, con la exfoliación apenas visible; roca brillante y oscura que se rompe a lo largo de fracturas desiguales o concoidales.', confirm: 'Grano fino + textura vítrea brillante con fracturas concoidales = Carbón de antracita, según el Anexo B-4.', accepts: { fol: ['no'], grano: ['fino'], tipo: ['antracita'] } },
  { id: 'corneana', nombre: 'Roca corneana (hornfels)', familia: 'No foliada · grano fino', comp: 'Según la roca original', protolito: 'Cualquier roca', desc: 'Textura microcristalina; usualmente de color bien oscuro y con alto grado de dureza.', confirm: 'Grano fino + microcristalina, oscura y muy dura = Roca corneana, según el Anexo B-4.', accepts: { fol: ['no'], grano: ['fino'], tipo: ['corneana'] } },
  { id: 'serpentina', nombre: 'Serpentina', familia: 'No foliada · grano fino', comp: 'Minerales de serpentina', protolito: 'Basalto, gabro o rocas ígneas ultramáficas', desc: 'Textura microcristalina que puede tener una suave superficie de exfoliación o forma de asbesto; oscura o brillante, con colores usualmente verde sombreados.', confirm: 'Grano fino + microcristalina verde sombreada, oscura o brillante = Serpentina, según el Anexo B-4.', accepts: { fol: ['no'], grano: ['fino'], tipo: ['serpentina'] } },
  { id: 'esteatita', nombre: 'Esteatita (talco)', familia: 'No foliada · grano fino', comp: 'Talco', protolito: 'Rocas máficas/ultramáficas alteradas', desc: 'Textura microcristalina que se siente jabonosa; el talco puede ser rayado con los dedos. Colores verde sombreado, gris, café o blanco.', confirm: 'Grano fino + tacto jabonoso y rayable con los dedos = Esteatita, según el Anexo B-4.', accepts: { fol: ['no'], grano: ['fino'], tipo: ['esteatita'] } },
  { id: 'cuarcita', nombre: 'Cuarcita', familia: 'No foliada · grano fino a grueso', comp: 'Cuarzo recristalizado', protolito: 'Arenisca', desc: 'Textura arenosa o cristalina; granos de cuarzo fundido que NO se sienten rugosos al frotar como en la arenisca, usualmente de colores claros.', confirm: 'Granos de cuarzo lisos al frotar (no rugosos) y colores claros = Cuarcita, según el Anexo B-4.', accepts: { fol: ['no'], grano: ['grueso'], tipo: ['cuarcita'] } },
  { id: 'marmol', nombre: 'Mármol', familia: 'No foliada · grano fino a grueso', comp: 'Calcita (o en algunos casos dolomita)', protolito: 'Calizas', desc: 'Cristales de calcita casi de igual tamaño que efervescen al entrar en contacto con solución de HCl; suele presentar vetas.', confirm: 'Efervescencia con HCl + cristales equigranulares = Mármol, según el Anexo B-4.', accepts: { fol: ['no'], grano: ['grueso'], tipo: ['marmol'] } },
  { id: 'metaconglomerado', nombre: 'Meta-conglomerado', familia: 'No foliada · grano fino a grueso', comp: 'Clastos deformados', protolito: 'Conglomerados', desc: 'Textura de conglomerado pero se rompe a lo largo de los granos; guijarros estirados o cortados por la exfoliación de la roca.', confirm: 'Guijarros estirados o cortados por la exfoliación = Meta-conglomerado, según el Anexo B-4.', accepts: { fol: ['no'], grano: ['grueso'], tipo: ['metaconglomerado'] } },
]

type Question = {
  key: QKey
  titulo: string
  ayuda: string
  opciones: { value: string; label: string; hint?: string }[]
}

function aliveList(a: Answers): Candidate[] {
  return CANDIDATES.filter((c) =>
    (Object.keys(a) as QKey[]).every((k) => {
      const v = a[k]
      if (v === undefined) return true
      const acc = c.accepts[k]
      return !acc || acc.includes(v)
    })
  )
}

function matchScore(c: Candidate, a: Answers): number {
  return (Object.keys(a) as QKey[]).reduce((n, k) => {
    const v = a[k]
    if (v === undefined) return n
    return c.accepts[k]?.includes(v) ? n + 1 : n
  }, 0)
}

function questionFlow(a: Answers): Question[] {
  const qs: Question[] = [
    {
      key: 'fol',
      titulo: 'Paso 1 · ¿La roca es foliada o no foliada?',
      ayuda: 'Paso 1 de la ficha del Anexo A-4 (Guía 4): las foliadas tienen los minerales reorganizados en planos o bandas por la presión; las no foliadas son masivas, generalmente de un solo mineral.',
      opciones: [
        { value: 'si', label: 'Foliada: se ve en folios, láminas o bandas', hint: 'se rompe siguiendo planos o bandas' },
        { value: 'no', label: 'No foliada: masa compacta uniforme', hint: 'rompe sin seguir capas ni bandas' },
      ],
    },
    {
      key: 'grano',
      titulo: 'Paso 2 · ¿Qué tamaño de cristal tiene la roca?',
      ayuda: 'Paso 2 de la ficha: observa el tamaño de los cristales y otras características texturales. El grado de metamorfismo aumenta con el tamaño del cristal (grano fino → bajo grado; grano medio a grueso → mayor grado).',
      opciones: [
        { value: 'fino', label: 'Grano fino', hint: 'el grano no se ve o apenas se percibe (bajo grado)' },
        { value: 'grueso', label: 'Grano medio a grano grande', hint: 'cristales visibles a simple vista (mayor grado)' },
      ],
    },
  ]
  if (a.fol === 'si' && a.grano === 'fino') {
    qs.push({
      key: 'tipo',
      titulo: 'Paso 3 · ¿Se ven minerales platinados a simple vista?',
      ayuda: 'Mira bien la superficie foliada: si se distinguen hojuelas brillantes de micas (clorita verde, biotita negra, moscovita plateada) o cristales laminares/prismáticos alineados, la roca ya tiene esquistosidad visible y es un Esquisto aunque el grano sea fino. Si la superficie es uniforme, sin minerales distinguibles, continúa a pizarra o filita.',
      opciones: [
        { value: 'esquisto', label: 'Sí: se ven micas platinadas o cristales alineados', hint: 'clorita, biotita, moscovita, kianita… = esquistosidad visible' },
        { value: 'no-plat', label: 'No: superficie uniforme, sin minerales distinguibles', hint: 'sigue a la pregunta de pizarra vs filita' },
      ],
    })
    if (a.tipo === 'no-plat') {
      qs.push({
        key: 'subtipo',
        titulo: 'Paso 3 · ¿Qué características distintivas tiene la superficie de exfoliación?',
        ayuda: 'Paso 3 de la ficha: con grano fino foliado y sin minerales platinados visibles, la superficie de ruptura distingue pizarra de filita (Anexo B-4).',
        opciones: [
          { value: 'pizarra', label: 'Superficies planas, lisas, duras y opacas', hint: 'la exfoliación está mejor desarrollada que la foliación' },
          { value: 'filita', label: 'Superficies arrugadas u onduladas con brillo metálico', hint: 'la foliación ondulada está mejor desarrollada que la exfoliación' },
        ],
      })
    }
  } else if (a.fol === 'si' && a.grano === 'grueso') {
    qs.push({
      key: 'tipo',
      titulo: 'Paso 3 · ¿Qué características distintivas tiene la foliación gruesa?',
      ayuda: 'Paso 3 de la ficha: con foliación visible en grano medio a grueso, el B-4 distingue esquisto (esquistosidad) de gneis (bandeado gneísico).',
      opciones: [
        { value: 'esquisto', label: 'Foliación escamosa por cristales alineados', hint: 'esquistosidad: minerales platinados, kianita laminar o anfíboles/turmalina/silimanita prismáticos' },
        { value: 'gneis', label: 'Bandas alternas claras y oscuras', hint: 'bandeado gneísico: cristales visibles de dos o más minerales alternando en bandas' },
      ],
    })
  } else if (a.fol === 'no' && a.grano === 'fino') {
    qs.push({
      key: 'tipo',
      titulo: 'Paso 3 · ¿Qué características distintivas tiene la masa de grano fino?',
      ayuda: 'Paso 3 de la ficha: prueba el brillo (antracita), la dureza (corneana), el color (serpentina) y el tacto jabonoso (esteatita), como lista el Anexo B-4.',
      opciones: [
        { value: 'antracita', label: 'Brillante, oscura, fracturas desiguales o concoidales', hint: 'textura vítrea, exfoliación apenas visible' },
        { value: 'corneana', label: 'Color bien oscuro con alto grado de dureza', hint: 'textura microcristalina, sin exfoliación' },
        { value: 'serpentina', label: 'Colores verde sombreados, oscura o brillante', hint: 'microcristalina; puede tener forma de asbesto' },
        { value: 'esteatita', label: 'Tacto jabonoso, rayable con los dedos', hint: 'verde sombreado, gris, café o blanco' },
      ],
    })
  } else if (a.fol === 'no' && a.grano === 'grueso') {
    qs.push({
      key: 'tipo',
      titulo: 'Paso 3 · ¿Qué características distintivas tiene la masa de grano medio a grueso?',
      ayuda: 'Paso 3 de la ficha: frota los granos (cuarcita), aplica HCl (mármol) y busca guijarros (meta-conglomerado), según el Anexo B-4.',
      opciones: [
        { value: 'cuarcita', label: 'Granos de cuarzo que NO se sienten rugosos al frotar', hint: 'textura arenosa o cristalina, colores claros' },
        { value: 'marmol', label: 'Cristales casi iguales que burbujean con HCl', hint: 'calcita o dolomita; suele tener vetas' },
        { value: 'metaconglomerado', label: 'Guijarros estirados o cortados', hint: 'textura de conglomerado que se rompe a lo largo de los granos' },
      ],
    })
  }
  // Paso 3 (continuación): composición mineralógica visible, para confirmar el nombre
  qs.push({
    key: 'minvis',
    titulo: 'Paso 3 · ¿Qué minerales característicos se ven en la roca?',
    ayuda: 'Paso 3 de la ficha: determina la composición mineralógica visible. Minerales como mica, kianita, anfíboles o granate ayudan a confirmar el nombre del Anexo B-4.',
    opciones: [
      { value: 'ninguno', label: 'Ninguno característico', hint: 'masa uniforme, sin minerales distinguibles' },
      { value: 'mica', label: 'Minerales platinados (clorita, biotita, muscovita)', hint: 'hojuelas brillantes, típicos del esquisto' },
      { value: 'kianita', label: 'Kianita o silimanita', hint: 'cristales laminares o fibrados, indican grado medio-alto' },
      { value: 'anfibol', label: 'Anfíboles (hornblenda) o turmalina', hint: 'cristales oscuros prismáticos, comunes en esquisto y gneis' },
      { value: 'granate', label: 'Granates rojos brillantes', hint: 'indicador de alto grado metamórfico' },
    ],
  })
  return qs
}

export default function ArbolMetamorficas() {
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

  const resumen = (Object.keys(answers) as QKey[])
    .map((k) => {
      if (k === 'fol') return answers[k] === 'si' ? 'foliada' : 'no foliada'
      if (k === 'grano') return answers[k] === 'fino' ? 'grano fino' : 'grano medio a grueso'
      if (k === 'tipo') {
        const nombres: Record<string, string> = {
          esquisto: 'con micas platinadas visibles (esquistosidad)', 'no-plat': 'sin platinados visibles',
          gneis: 'bandeado gneísico',
          antracita: 'textura vítrea brillante', corneana: 'microcristalina oscura y dura',
          serpentina: 'verde sombreada', esteatita: 'tacto jabonoso',
          cuarcita: 'cuarzo liso al frotar', marmol: 'efervescente con HCl',
          metaconglomerado: 'guijarros estirados',
        }
        return nombres[answers[k] ?? ''] ?? answers[k]
      }
      if (k === 'subtipo') {
        return answers[k] === 'pizarra' ? 'exfoliación plana y opaca' : 'foliación ondulada con brillo metálico'
      }
      if (k === 'minvis') {
        const m: Record<string, string> = {
          ninguno: 'sin minerales característicos', mica: 'con minerales platinados (micas)',
          kianita: 'con kianita/silimanita', anfibol: 'con anfíboles/turmalina', granate: 'con granates',
        }
        return m[answers[k] ?? ''] ?? answers[k]
      }
      return answers[k]
    })
    .filter(Boolean)
    .join(' · ')

  const best = done
    ? [...alive].sort((x, y) => matchScore(y, answers) - matchScore(x, answers))[0]
    : undefined

  return (
    <Card className="card-accent border-violet-200/60 dark:border-violet-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#8b5cf6,#c084fc)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="h-5 w-5 text-violet-600" />
          ¿Qué roca metamórfica tengo en la mano?
        </CardTitle>
        <CardDescription>
          Sigue paso a paso la ficha del Anexo A-4 y el cuadro del Anexo B-4 de la Guía 4:
          foliación → tamaño de cristal → características distintivas y composición → nombre y protolito.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Candidatas del Anexo B-4 ({alive.length} de {CANDIDATES.length})
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
              <p className="rounded-md bg-violet-50 px-3 py-1.5 text-xs text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
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
                    className="rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-violet-400 hover:bg-violet-50 dark:border-violet-900 dark:bg-transparent dark:hover:bg-violet-950/50"
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
                <Sparkles className="h-3.5 w-3.5" /> Paso 4 · Tu muestra es muy probablemente
              </p>
              {best ? (
                <>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{best.nombre}</p>
                  <div className="mt-3">
                    <RocaFoto id={best.id} nombre={best.nombre} />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    <Badge className="bg-emerald-200 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200">{best.familia}</Badge>
                    <Badge variant="outline">{best.comp}</Badge>
                    <Badge variant="outline" className="border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300">Protolito: {best.protolito}</Badge>
                  </div>
                  <p className="mx-auto mt-3 max-w-md text-sm text-emerald-900/80 dark:text-emerald-100/80">{best.desc}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    <Badge variant="outline">
                      Grado estimado:{' '}
                      {answers.fol === 'si'
                        ? answers.grano === 'fino'
                          ? 'bajo (pizarra → filita → esquisto → gneis)'
                          : answers.tipo === 'gneis' ? 'alto' : 'medio'
                        : answers.grano === 'fino' ? 'bajo a intermedio' : 'variable según composición'}
                    </Badge>
                    {answers.minvis && answers.minvis !== 'ninguno' && (
                      <Badge variant="outline" className="border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300">
                        {resumen.split(' · ').pop()}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{best.confirm}</p>
                  {alive.length > 1 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      También encaja con: {alive.slice(1).map((c) => c.nombre).join(', ')}. Confirma con el Anexo B-4 de la guía.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-emerald-900 dark:text-emerald-100">
                  Las respuestas se contradicen con el Anexo B-4. Toca «Empezar de nuevo» y revisa la muestra con calma.
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
