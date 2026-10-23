import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, HelpCircle, RotateCcw, Sparkles, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type QKey = 'origen' | 'tam' | 'forma' | 'orden' | 'aren' | 'lodo' | 'bio' | 'planta' | 'eferv' | 'concha' | 'quim'
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

// Cuadro del Anexo D-3 de la Guía 3 (composición × textura)
const CANDIDATES: Candidate[] = [
  { id: 'conglomerado', nombre: 'Conglomerado', familia: 'Detrítica (grava)', comp: 'Clastos ≥ 2 mm', desc: 'Grava con granos redondeados cementados: el transporte fluvial o marino pulió los bordes.', confirm: 'Principalmente grava con granos redondeados (Anexo D-3).', accepts: { origen: ['detritica'], tam: ['grava'], forma: ['redondeados'] } },
  { id: 'brecha', nombre: 'Brecha', familia: 'Detrítica (grava)', comp: 'Clastos ≥ 2 mm angulares', desc: 'Grava con granos angulares apenas transportados: taludes, diques y corrimientos cercanos a la fuente.', confirm: 'Principalmente grava con granos angulares (Anexo D-3).', accepts: { origen: ['detritica'], tam: ['grava'], forma: ['angulares'] } },
  { id: 'cuarzoarenita', nombre: 'Cuarzo arenisca', familia: 'Detrítica (arena)', comp: 'Mayormente cuarzo', desc: 'Arena consolidada con mayormente granos de cuarzo; suele estar bien clasificada y madurada.', confirm: 'Principalmente arena, mayormente cuarzo (Anexo D-3).', accepts: { origen: ['detritica'], tam: ['arena'], aren: ['cuarzo'] } },
  { id: 'arcosa', nombre: 'Arcosa', familia: 'Detrítica (arena)', comp: 'Feldespato y cuarzo', desc: 'Arena con mayormente feldespato y cuarzo; poco madurada, cerca de la fuente granítica.', confirm: 'Principalmente arena, mayormente feldespato y cuarzo (Anexo D-3).', accepts: { origen: ['detritica'], tam: ['arena'], aren: ['feldp'] } },
  { id: 'grauvaca', nombre: 'Grauvaca', familia: 'Detrítica (arena)', comp: 'Arena + limo/arcilla', desc: 'Arena mezclada con limo y/o arcilla (lodo) en la matriz; gris verdosa, pobremente clasificada.', confirm: 'Arena mezclada con limo/arcilla (Anexo D-3).', accepts: { origen: ['detritica'], tam: ['arena'], aren: ['lodo'] } },
  { id: 'limolita', nombre: 'Limolita', familia: 'Detrítica (lodo)', comp: 'Mayormente limo', desc: 'Grano fino de limo (1/256 a 1/16 mm) que se parte en bloques o láminas; tacto harinoso.', confirm: 'Mayormente limo, se parte en bloques o láminas (Anexo D-3).', accepts: { origen: ['detritica'], tam: ['lodo'], lodo: ['limo'] } },
  { id: 'roca-arcilla', nombre: 'Roca de arcilla', familia: 'Detrítica (lodo)', comp: 'Mayormente arcilla', desc: 'Arcilla (<1/256 mm) que se desmorona o se parte en bloques irregulares; no fisil.', confirm: 'Mayormente arcilla, se desmorona o parte en bloques (Anexo D-3).', accepts: { origen: ['detritica'], tam: ['lodo'], lodo: ['arcilla-bloques'] } },
  { id: 'lutita', nombre: 'Lutita', familia: 'Detrítica (lodo)', comp: 'Arcilla laminar', desc: 'Arcilla consolidada que se divide fácilmente en láminas finas y planas (fisil).', confirm: 'Mayormente arcilla, se divide fácilmente (Anexo D-3).', accepts: { origen: ['detritica'], tam: ['lodo'], lodo: ['arcilla-laminas'] } },
  { id: 'turba', nombre: 'Turba', familia: 'Biogénica (plantas)', comp: 'Restos vegetales', desc: 'Marrón opaco, poroso, con fragmentos visibles de plantas; aún se separan los restos.', confirm: 'Fragmentos de plantas, marrón opaco y poroso (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['plantas'], planta: ['turba'] } },
  { id: 'carbon-bituminoso', nombre: 'Carbón bituminoso', familia: 'Biogénica (plantas)', comp: 'C fijo intermedio', desc: 'Negro, denso y quebradizo o poroso y hollinoso; el carbón industrial más usado.', confirm: 'Negro, denso y quebradizo o poroso y hollinoso (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['plantas'], planta: ['bituminoso'] } },
  { id: 'dolostona', nombre: 'Dolostona (dolomía)', familia: 'Biogénica / química (dolomita)', comp: 'CaMg(CO₃)₂', desc: 'Microcristalina; la efervescencia con HCl es mucho menos vigorosa que la de la caliza.', confirm: 'Efervescencia débil o en polvo: dolomita (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['conchas'], eferv: ['debil'] } },
  { id: 'calcidurita', nombre: 'Calcidurita', familia: 'Biogénica (carbonatada)', comp: 'Conchas > 2 mm', desc: 'Conchas visibles y fragmentos grandes cementados en una masa densa; efervescente con HCl.', confirm: 'Conchas visibles cementadas en masa densa (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['conchas'], eferv: ['fuerte'], concha: ['densa'] } },
  { id: 'calcarenita', nombre: 'Calcarenita', familia: 'Biogénica (carbonatada)', comp: 'Arena de calcita', desc: 'Grano de arena carbonatada con algunos fragmentos grandes de conchas; efervescente.', confirm: 'Grano de arena con fragmentos de conchas (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['conchas'], eferv: ['fuerte'], concha: ['arena'] } },
  { id: 'micrita', nombre: 'Micrita', familia: 'Biogénica (carbonatada)', comp: 'Calcita microcristalina', desc: 'Masa de granos muy finos a microcristalinos de calcita con microfósiles; efervescente.', confirm: 'Masa finísima de calcita y microfósiles (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['conchas'], eferv: ['fuerte'], concha: ['fina'] } },
  { id: 'coquina', nombre: 'Coquina', familia: 'Biogénica (carbonatada)', comp: 'Conchas sueltas', desc: 'Porosa, con conchas pobremente cementadas y fragmentos de mar; efervescente.', confirm: 'Porosa, conchas pobremente cementadas (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['conchas'], eferv: ['fuerte'], concha: ['porosa'] } },
  { id: 'tiza', nombre: 'Tiza', familia: 'Biogénica (carbonatada)', comp: 'Calcita + microfósiles', desc: 'Grano fino, terroso, gredoso, de colores claros, a veces con microfósiles; efervescente.', confirm: 'Fina, terrosa, gredosa y de colores claros (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['conchas'], eferv: ['fuerte'], concha: ['gredosa'] } },
  { id: 'tufo', nombre: 'Tufo o travertino', familia: 'Biogénica / química (carbonatada)', comp: 'Bandas de calcita', desc: 'Bandas cristalinas a microcristalinas de calcita precipitada en manantiales y cuevas.', confirm: 'Bandas cristalinas a microcristalinas de calcita (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['conchas'], eferv: ['fuerte'], concha: ['bandas'] } },
  { id: 'caliza-olitica', nombre: 'Caliza olítica', familia: 'Biogénica (carbonatada)', comp: 'Ooides', desc: 'Granos esféricos como pequeñas cuentas (<2 mm) con laminación concéntrica; efervescente.', confirm: 'Granos esféricos como cuentas <2 mm (Anexo D-3).', accepts: { origen: ['biogenica'], bio: ['conchas'], eferv: ['fuerte'], concha: ['oolitica'] } },
  { id: 'chert', nombre: 'Chert', familia: 'Bioquímica / química (sílice)', comp: 'Cuarzo SiO₂', desc: 'Fractura concoidal microcristalina: calcedonia, pedernal, jaspe; raya al vidrio.', confirm: 'Variedad de cuarzos SiO₂, fractura concoidal, raya al vidrio (Anexo D-3).', accepts: { origen: ['quimica'], quim: ['silice'] } },
  { id: 'sal', nombre: 'Roca de sal (halita)', familia: 'Química (evaporita)', comp: 'NaCl', desc: 'Cristales de precipitación química inorgánica; sabor salado, cúbicos.', confirm: 'Principalmente halita, sabor salado (Anexo D-3).', accepts: { origen: ['quimica'], quim: ['halita'] } },
  { id: 'yeso', nombre: 'Roca de yeso', familia: 'Química (evaporita)', comp: 'CaSO₄·2H₂O', desc: 'Cristales químicos que pueden rayarse con las uñas; blanco a rosado.', confirm: 'Principalmente yeso, rayable con las uñas (Anexo D-3).', accepts: { origen: ['quimica'], quim: ['yeso'] } },
  { id: 'hierro', nombre: 'Roca de hierro', familia: 'Química', comp: 'Óxidos/hidróxidos de Fe', desc: 'Amorfa o microcristalina, de colores oscuros: café o rojo grisáceo.', confirm: 'Amorfa o microcristalina, colores café o rojo grisáceo (Anexo D-3).', accepts: { origen: ['quimica'], quim: ['hierro'] } },
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

// Guía 3: paso B.1 origen → análisis textural (Tabla 1-3: tamaño Anexo A-3 → forma Anexo B-3 →
// ordenamiento Anexo C-3 → coloración/composición) → nombre con Anexo D-3
function questionFlow(a: Answers): Question[] {
  const qs: Question[] = [
    {
      key: 'origen',
      titulo: 'Paso B.1 · ¿Cuál es el origen del depósito que forma la roca?',
      ayuda: 'Las sedimentarias se clasifican según la génesis de los depósitos: detríticas (clastos litificados o cementados), bioquímicas u organogénicas (restos de organismos) o químicas (precipitación inorgánica).',
      opciones: [
        { value: 'detritica', label: 'Detrítica o clástica', hint: 'clastos de rocas o minerales cementados' },
        { value: 'biogenica', label: 'Bioquímica u organogénica', hint: 'restos de organismos vivos o material orgánico' },
        { value: 'quimica', label: 'Química o inorgánica', hint: 'precipitación de sustancias disueltas en agua' },
      ],
    },
  ]
  const origen = a.origen

  if (origen === 'detritica') {
    qs.push({
      key: 'tam',
      titulo: 'Análisis textural · ¿Qué tamaño tienen los granos? (Anexo A-3)',
      ayuda: 'Mide con regla: grava 2-64 mm, arena 0,0625-2 mm, limo 0,0039-0,0625 mm y arcilla <0,0039 mm. También: bloque >256 mm y canto 64-256 mm.',
      opciones: [
        { value: 'grava', label: 'Grava (2 a 64 mm)', hint: 'se ven los clastos individuales' },
        { value: 'arena', label: 'Arena (0,0625 a 2 mm)', hint: 'se siente arenosa entre los dedos' },
        { value: 'lodo', label: 'Limo o arcilla (< 0,0625 mm)', hint: 'solo tacto, sin granos visibles' },
      ],
    })
    const tam = a.tam
    if (tam === 'grava') {
      qs.push({
        key: 'forma',
        titulo: 'Análisis textural · ¿Qué forma tienen los clastos? (Anexo B-3)',
        ayuda: 'Del muy angular al bien redondeado, según el grado de curvatura de las aristas. El transporte redondea; la cercanía a la fuente deja aristas.',
        opciones: [
          { value: 'redondeados', label: 'Redondeados o bien redondeados', hint: 'bordes pulidos por el transporte' },
          { value: 'angulares', label: 'Angulares o sub angulares', hint: 'aristas y picos visibles' },
        ],
      })
    } else if (tam === 'arena') {
      qs.push(
        {
          key: 'forma',
          titulo: 'Análisis textural · ¿Qué forma tienen los granos? (Anexo B-3)',
          ayuda: 'Indica la forma más frecuente de los granos: angular, sub angular, sub redondeado, redondeado o muy redondeado.',
          opciones: [
            { value: 'angular', label: 'Angular a sub angular', hint: 'aristas visibles, poco transporte' },
            { value: 'redondeado', label: 'Sub redondeado a muy redondeado', hint: 'bordes pulidos' },
          ],
        },
        {
          key: 'orden',
          titulo: 'Análisis textural · ¿Qué tan bien clasificados están los granos? (Anexo C-3)',
          ayuda: 'Bien clasificados: el tamaño de los clastos es más o menos igual. Moderados: varios tamaños sin rango extremo. Pobre: los tamaños difieren significativamente.',
          opciones: [
            { value: 'bien', label: 'Bien clasificados', hint: 'tamaño más o menos igual' },
            { value: 'moderada', label: 'Moderadamente clasificados', hint: 'varios tamaños sin extremo' },
            { value: 'pobre', label: 'Pobremente clasificados', hint: 'tamaños muy diferentes' },
          ],
        },
        {
          key: 'aren',
          titulo: 'Análisis textural · ¿De qué color son los granos? (composición, paso 4)',
          ayuda: 'La coloración de los granos infiere su composición: translúcidos = cuarzo; rosas o blancos = feldespato; mezcla con matriz gris = lodo.',
          opciones: [
            { value: 'cuarzo', label: 'Claros translúcidos: mayormente cuarzo', hint: 'gris, blanco o amarillentos' },
            { value: 'feldp', label: 'Rosas o blancos: feldespato y cuarzo', hint: 'salpicaduras rosadas frecuentes' },
            { value: 'lodo', label: 'Con matriz oscura: arena + limo/arcilla', hint: 'gris verdosa, con lodo' },
          ],
        }
      )
    } else if (tam === 'lodo') {
      qs.push({
        key: 'lodo',
        titulo: 'Análisis textural · ¿Qué tipo de lodo es y cómo se parte? (Anexo D-3)',
        ayuda: 'Humedécelo: la arcilla es plástica (se moldea), el limo solo se empapa (harinoso). La manera de partirse define el nombre.',
        opciones: [
          { value: 'limo', label: 'Mayormente limo: se parte en bloques o láminas', hint: '1/256 a 1/16 mm, tacto harinoso' },
          { value: 'arcilla-bloques', label: 'Mayormente arcilla: se desmorona o parte en bloques', hint: '<1/256 mm, no fisil' },
          { value: 'arcilla-laminas', label: 'Mayormente arcilla: se divide fácilmente en láminas', hint: '<1/256 mm, fisil' },
        ],
      })
    }
  } else if (origen === 'biogenica') {
    qs.push({
      key: 'bio',
      titulo: 'Paso B.1 · ¿Qué resto orgánico la forma? (Anexo D-3)',
      ayuda: 'Bioquímicas: acumulación de restos de organismos en ambientes acuosos (carbonatos de calcio o sílice) o material vegetal.',
      opciones: [
        { value: 'plantas', label: 'Fragmentos de plantas o carbón', hint: 'material vegetal visible' },
        { value: 'conchas', label: 'Conchas de mar fosilizadas o microfósiles', hint: 'efervescen con HCl diluido' },
      ],
    })
    const bio = a.bio
    if (bio === 'plantas') {
      qs.push({
        key: 'planta',
        titulo: 'Anexo D-3 · ¿Cómo se ve y se siente el material vegetal?',
        ayuda: 'Grado de carbonificación visible a simple vista.',
        opciones: [
          { value: 'turba', label: 'Marrón opaco, poroso, con plantas visibles', hint: 'se separan los fragmentos' },
          { value: 'bituminoso', label: 'Negro, denso y quebradizo o hollinoso', hint: 'brilla poco, mancha' },
        ],
      })
    } else if (bio === 'conchas') {
      qs.push({
        key: 'eferv',
        titulo: 'Propiedad distintiva · ¿Efervescente con HCl diluido?',
        ayuda: 'Todas las carbonatadas del Anexo D-3 hacen efervescencia; la dolomita lo hace mucho menos vigorosamente.',
        opciones: [
          { value: 'fuerte', label: 'Sí, efervescente', hint: 'calcita: calizas' },
          { value: 'debil', label: 'Débil o casi nula', hint: 'dolomita: dolostona' },
        ],
      })
      if (a.eferv === 'fuerte') {
        qs.push({
          key: 'concha',
          titulo: 'Anexo D-3 · ¿Qué textura y propiedades distintivas tiene?',
          ayuda: 'El cuadro distingue 7 texturas carbonatadas calcíticas.',
          opciones: [
            { value: 'densa', label: 'Conchas visibles cementadas en masa densa', hint: 'calcidurita' },
            { value: 'arena', label: 'Grano de arena con fragmentos de concha', hint: 'calcarenita' },
            { value: 'fina', label: 'Masa muy fina o microcristalina con microfósiles', hint: 'micrita' },
            { value: 'porosa', label: 'Porosa, conchas pobremente cementadas', hint: 'coquina' },
            { value: 'gredosa', label: 'Fina, terrosa, gredosa y de colores claros', hint: 'tiza' },
            { value: 'bandas', label: 'Bandas cristalinas a microcristalinas', hint: 'tufo o travertino' },
            { value: 'oolitica', label: 'Granos esféricos como cuentas <2 mm', hint: 'caliza olítica' },
          ],
        })
      }
    }
  } else if (origen === 'quimica') {
    qs.push({
      key: 'quim',
      titulo: 'Anexo D-3 · ¿Qué mineral químico la compone?',
      ayuda: 'Rocas típicamente monominerales formadas por precipitación inorgánica (con evaporación = evaporitas).',
      opciones: [
        { value: 'silice', label: 'Variedad de cuarzos SiO₂: fractura concoidal', hint: 'raya al vidrio: chert' },
        { value: 'halita', label: 'Halita NaCl: cristales cúbicos', hint: 'sabor salado: roca de sal' },
        { value: 'yeso', label: 'Yeso CaSO₄·2H₂O', hint: 'rayable con las uñas' },
        { value: 'hierro', label: 'Amorfa o microcristalina, café o rojo grisáceo', hint: 'roca de hierro' },
      ],
    })
  }
  return qs
}

export default function ArbolSedimentarias() {
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

  const TEXTO_ORIGEN: Record<string, string> = {
    detritica: 'detrítica (clastos)',
    biogenica: 'bioquímica (restos de organismos)',
    quimica: 'química (precipitación)',
  }
  const TEXTO_TAM: Record<string, string> = { grava: 'de grava (2-64 mm)', arena: 'de arena (0,0625-2 mm)', lodo: 'de limo/arcilla (<0,0625 mm)' }
  const resumen = (Object.keys(answers) as QKey[])
    .map((k) => {
      if (k === 'origen') return TEXTO_ORIGEN[answers[k] || '']
      if (k === 'tam') return TEXTO_TAM[answers[k] || '']
      if (k === 'forma') return answers[k] === 'redondeados' ? 'clastos redondeados' : answers[k] === 'angulares' ? 'clastos angulares' : answers[k] === 'angular' ? 'granos angulares' : 'granos redondeados'
      if (k === 'orden') return answers[k] === 'bien' ? 'bien clasificados' : answers[k] === 'moderada' ? 'moderadamente clasificados' : 'pobremente clasificados'
      if (k === 'aren') return answers[k] === 'cuarzo' ? 'arena de cuarzo' : answers[k] === 'feldp' ? 'arena feldespática' : 'arena con lodo'
      if (k === 'lodo') return answers[k] === 'limo' ? 'limosa' : answers[k] === 'arcilla-bloques' ? 'arcillosa en bloques' : 'arcillosa en láminas'
      if (k === 'bio') return answers[k] === 'plantas' ? 'de plantas' : 'de conchas/microfósiles'
      if (k === 'planta') return answers[k] === 'turba' ? 'tipo turba' : 'tipo carbón bituminoso'
      if (k === 'eferv') return answers[k] === 'fuerte' ? 'efervescente' : 'poco efervescente'
      if (k === 'concha') return 'textura ' + answers[k]
      if (k === 'quim') return answers[k] === 'silice' ? 'de sílice' : answers[k] === 'halita' ? 'de sal' : answers[k] === 'yeso' ? 'de yeso' : 'de hierro'
      return answers[k]
    })
    .filter(Boolean)
    .join(' · ')

  const best = done
    ? [...alive].sort((x, y) => matchScore(y, answers) - matchScore(x, answers))[0]
    : undefined

  return (
    <Card className="card-accent border-amber-200/60 dark:border-amber-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="h-5 w-5 text-amber-600" />
          ¿Qué roca sedimentaria tengo en la mano?
        </CardTitle>
        <CardDescription>
          Paso a paso según la Guía 3: origen del depósito (B.1) → análisis textural (Tabla 1-3 y
          Anexos A-3, B-3, C-3) → nombre con el cuadro del Anexo D-3.
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
              <p className="rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
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
                    className="rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-amber-400 hover:bg-amber-50 dark:border-amber-900 dark:bg-transparent dark:hover:bg-amber-950/50"
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
                <Sparkles className="h-3.5 w-3.5" /> Con el Anexo D-3, tu muestra es muy probablemente
              </p>
              {best ? (
                <>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{best.nombre}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    <Badge className="bg-emerald-200 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200">{best.familia}</Badge>
                    <Badge variant="outline">{best.comp}</Badge>
                  </div>
                  <p className="mx-auto mt-3 max-w-md text-sm text-emerald-900/80 dark:text-emerald-100/80">{best.desc}</p>
                  <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{best.confirm}</p>
                  {alive.length > 1 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      También encaja con: {alive.slice(1).map((c) => c.nombre).join(', ')}. Compara con el Anexo D-3.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-emerald-900 dark:text-emerald-100">
                  Las respuestas se contradicen. Toca «Empezar de nuevo» y revisa la muestra con calma.
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
