import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Copy, RotateCcw, Shuffle, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import GeoShell from '@/components/GeoShell'
import { clasificar, MINERALES, redactar, type Minerales, type Respuestas, type Tipo } from '@/lib/descripcionRoca'
import { cn } from '@/lib/utils'

type Pregunta = {
  id: string
  pregunta: string
  ejemplo: string
  /** Respuestas rápidas: rellenan el campo (se pueden editar después) */
  chips?: string[]
  /** Si es true, los chips se van sumando en lugar de reemplazar */
  multiple?: boolean
  largo?: boolean
}

/* Preguntas por tipo de roca. Los «id» coinciden con los que interpreta el motor de descripción.
   «MINERALES» marca dónde se insertan los porcentajes. */
const MINERALES_ID = '__minerales__'

const PREGUNTAS: Record<Tipo, Pregunta[]> = {
  ignea: [
    { id: 'muestra', pregunta: '¿Cómo se identifica la muestra?', ejemplo: 'M-01, recolectada en el río Combeima' },
    { id: 'color', pregunta: '¿De qué color es en fresco?', ejemplo: 'gris claro con tonos rosados' },
    { id: 'alteracion', pregunta: '¿Qué color o alteración tiene la superficie meteorizada?', ejemplo: 'pátinas pardo amarillentas de óxidos de hierro' },
    { id: 'cristalinidad', pregunta: '¿Qué grado de cristalinidad tiene?', ejemplo: 'holocristalina', chips: ['holocristalina', 'hipocristalina', 'holohialina (vítrea)'] },
    { id: 'tamano', pregunta: '¿Qué tamaño tienen los cristales? (mídelos con regla)', ejemplo: 'entre 2 y 5 mm · o «no se ven a simple vista»' },
    { id: 'distribucion', pregunta: '¿Cómo se distribuye el tamaño de los cristales?', ejemplo: 'porfídica, con fenocristales de feldespato de 1 cm', chips: ['equigranular', 'inequigranular', 'porfídica, con fenocristales en matriz fina'] },
    { id: 'forma', pregunta: '¿Qué forma tienen los cristales?', ejemplo: 'subhedrales', chips: ['euhedrales', 'subhedrales', 'anhedrales'] },
    { id: 'estructuras', pregunta: '¿Tiene estructuras o texturas especiales?', ejemplo: 'vesículas alargadas', chips: ['vesículas', 'amígdalas', 'estructura fluidal', 'xenolitos', 'superficie cordada', 'fragmentos piroclásticos', 'ninguna'], multiple: true },
    { id: MINERALES_ID, pregunta: '', ejemplo: '' },
    { id: 'otros', pregunta: '¿Qué minerales accesorios reconoces?', ejemplo: 'magnetita, circón' },
    { id: 'indice', pregunta: 'Si no estimaste los minerales: ¿qué índice de color tiene?', ejemplo: 'leucocrática', chips: ['leucocrática (clara)', 'mesocrática (intermedia)', 'melanocrática (oscura)'] },
    { id: 'nombre', pregunta: '¿Qué nombre le darías tú? (opcional, para comparar)', ejemplo: 'granito' },
    { id: 'obs', pregunta: 'Observaciones adicionales', ejemplo: 'la muestra es compacta, no reacciona con HCl y es magnética en algunos puntos', largo: true },
  ],
  sedimentaria: [
    { id: 'muestra', pregunta: '¿Cómo se identifica la muestra?', ejemplo: 'S-03, quebrada La Plata' },
    { id: 'color', pregunta: '¿De qué color es en fresco?', ejemplo: 'gris verdoso' },
    { id: 'alteracion', pregunta: '¿Qué color tiene la superficie meteorizada?', ejemplo: 'pardo rojizo' },
    { id: 'origen', pregunta: '¿Cuál es su origen?', ejemplo: 'detrítica', chips: ['detrítica', 'química', 'bioquímica', 'orgánica'] },
    { id: 'tamano', pregunta: '¿Qué tamaño tienen los granos o clastos? (mídelos)', ejemplo: '0,25 a 0,5 mm · o «grava de 1 a 3 cm»' },
    { id: 'redondez', pregunta: '¿Qué forma tienen los granos?', ejemplo: 'subredondeados', chips: ['angulosos', 'subangulosos', 'subredondeados', 'redondeados', 'bien redondeados'] },
    { id: 'seleccion', pregunta: '¿Qué selección tiene?', ejemplo: 'bien seleccionada', chips: ['bien seleccionada', 'moderadamente seleccionada', 'mal seleccionada'] },
    { id: 'matriz', pregunta: '¿Qué cemento o matriz une los granos?', ejemplo: 'cemento calcáreo', chips: ['cemento silíceo', 'cemento calcáreo', 'cemento ferruginoso', 'matriz arcillosa', 'micrita (lodo calcáreo)', 'esparita (cemento cristalino)'] },
    { id: 'hcl', pregunta: '¿Cómo reacciona con HCl diluido?', ejemplo: 'efervescencia fuerte', chips: ['efervescencia fuerte', 'efervescencia débil, solo en polvo', 'no reacciona'] },
    { id: 'estructuras', pregunta: '¿Qué estructuras sedimentarias tiene?', ejemplo: 'laminación paralela', chips: ['laminación paralela', 'estratificación cruzada', 'ondulitas (ripples)', 'fisilidad (se parte en láminas)', 'estructura masiva'], multiple: true },
    { id: 'fosiles', pregunta: '¿Tiene fósiles?', ejemplo: 'fragmentos de bivalvos', chips: ['no se observan', 'bivalvos', 'gasterópodos', 'foraminíferos', 'restos vegetales'], multiple: true },
    { id: MINERALES_ID, pregunta: '', ejemplo: '' },
    { id: 'otros', pregunta: '¿Qué otros componentes reconoces?', ejemplo: 'micas detríticas, glauconita' },
    { id: 'nombre', pregunta: '¿Qué nombre le darías tú? (opcional, para comparar)', ejemplo: 'arenisca' },
    { id: 'obs', pregunta: 'Observaciones adicionales', ejemplo: 'porosidad visible alta', largo: true },
  ],
  metamorfica: [
    { id: 'muestra', pregunta: '¿Cómo se identifica la muestra?', ejemplo: 'MT-02, Cordillera Central' },
    { id: 'color', pregunta: '¿De qué color es en fresco?', ejemplo: 'gris plateado' },
    { id: 'alteracion', pregunta: '¿Qué color tiene la superficie meteorizada?', ejemplo: 'pardo con pátinas de óxido' },
    { id: 'foliacion', pregunta: '¿Tiene foliación? ¿De qué tipo?', ejemplo: 'esquistosidad marcada', chips: ['clivaje pizarroso (láminas planas)', 'esquistosidad (micas orientadas)', 'bandeado gnéisico', 'no foliada (masiva)'] },
    { id: 'tamano', pregunta: '¿Qué tamaño tienen los cristales? (mídelos)', ejemplo: '1 a 3 mm · o «no se ven a simple vista»' },
    { id: 'textura', pregunta: '¿Qué textura y brillo presenta?', ejemplo: 'lepidoblástica, brillo satinado', chips: ['lepidoblástica', 'granoblástica', 'nematoblástica', 'porfidoblástica', 'brillo mate', 'brillo satinado'], multiple: true },
    { id: 'porfiroblastos', pregunta: '¿Tiene porfiroblastos? Descríbelos', ejemplo: 'granates rojos de 3 a 5 mm', chips: ['no se observan', 'granate', 'andalucita', 'cordierita', 'estaurolita'], multiple: true },
    { id: MINERALES_ID, pregunta: '', ejemplo: '' },
    { id: 'otros', pregunta: '¿Qué otros minerales reconoces?', ejemplo: 'grafito, pirita' },
    { id: 'protolito', pregunta: '¿Cuál sería su protolito probable?', ejemplo: 'una lutita (pelita)' },
    { id: 'grado', pregunta: '¿Qué grado o facies sugiere?', ejemplo: 'grado medio', chips: ['bajo grado (facies de esquistos verdes)', 'grado medio (facies de anfibolita)', 'alto grado (facies de granulita)', 'metamorfismo de contacto'] },
    { id: 'nombre', pregunta: '¿Qué nombre le darías tú? (opcional, para comparar)', ejemplo: 'esquisto' },
    { id: 'obs', pregunta: 'Observaciones adicionales', ejemplo: 'la foliación está crenulada', largo: true },
  ],
}

const TIPOS: { id: Tipo; label: string; activo: string }[] = [
  { id: 'ignea', label: 'Ígnea', activo: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
  { id: 'sedimentaria', label: 'Sedimentaria', activo: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'metamorfica', label: 'Metamórfica', activo: 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
]

const CONFIANZA = {
  alta: { txt: 'Coincidencia alta', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  media: { txt: 'Coincidencia media', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  baja: { txt: 'Faltan datos', cls: 'bg-muted text-muted-foreground' },
}

const CLAVE = 'descripcion-rocas-v2'
type Estado = { tipo: Tipo; resp: Record<Tipo, Respuestas>; min: Record<Tipo, Minerales> }
const VACIO: Estado = {
  tipo: 'ignea',
  resp: { ignea: {}, sedimentaria: {}, metamorfica: {} },
  min: { ignea: {}, sedimentaria: {}, metamorfica: {} },
}

export default function DescripcionPage() {
  const [estado, setEstado] = useState<Estado>(VACIO)
  const [semilla, setSemilla] = useState(() => Math.floor(Math.random() * 1e9))
  const [copiado, setCopiado] = useState(false)
  const { tipo } = estado
  const r = estado.resp[tipo]
  const m = estado.min[tipo]

  // Borrador guardado en este navegador
  useEffect(() => {
    try {
      const g = localStorage.getItem(CLAVE)
      if (g) {
        const d = JSON.parse(g) as Partial<Estado>
        setEstado({
          tipo: d.tipo ?? 'ignea',
          resp: { ...VACIO.resp, ...(d.resp ?? {}) },
          min: { ...VACIO.min, ...(d.min ?? {}) },
        })
      }
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado))
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [estado])

  const preguntas = PREGUNTAS[tipo]
  const textoPregs = preguntas.filter((p) => p.id !== MINERALES_ID)
  const totalMin = Object.values(m).reduce((a, b) => a + (Number(b) || 0), 0)
  const contestadas = textoPregs.filter((p) => (r[p.id] ?? '').trim()).length + (totalMin > 0 ? 1 : 0)
  const totalPregs = textoPregs.length + 1

  const resultado = useMemo(() => clasificar(tipo, r, m), [tipo, r, m])
  const parrafos = useMemo(() => redactar(tipo, r, m, resultado, semilla), [tipo, r, m, resultado, semilla])
  const texto = parrafos.join('\n\n')
  const hayDatos = parrafos.length > 0

  const setTipo = (t: Tipo) => setEstado((e) => ({ ...e, tipo: t }))
  const setResp = (id: string, v: string) => setEstado((e) => ({ ...e, resp: { ...e.resp, [tipo]: { ...e.resp[tipo], [id]: v } } }))
  const setMin = (id: string, v: string) => {
    const n = v === '' ? NaN : Math.max(0, Math.min(100, Number(v.replace(',', '.'))))
    setEstado((e) => {
      const nuevo = { ...e.min[tipo] }
      if (Number.isNaN(n)) delete nuevo[id]
      else nuevo[id] = n
      return { ...e, min: { ...e.min, [tipo]: nuevo } }
    })
  }
  const chip = (p: Pregunta, c: string) => {
    const actual = (r[p.id] ?? '').trim()
    if (!p.multiple || !actual || /^(no se observan|ninguna)$/i.test(c)) return setResp(p.id, c)
    if (actual.toLowerCase().includes(c.toLowerCase())) return
    setResp(p.id, /^(no se observan|ninguna)$/i.test(actual) ? c : `${actual}, ${c}`)
  }
  const borrar = () => setEstado((e) => ({ ...e, resp: { ...e.resp, [tipo]: {} }, min: { ...e.min, [tipo]: {} } }))

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = texto
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1800)
  }

  return (
    <GeoShell showAlert={false}>
      <p className="-mt-2 mb-6 text-sm text-muted-foreground">
        Observa tu muestra de mano y responde con tus propias palabras (los botones grises son atajos que
        puedes editar). Con tus respuestas y los porcentajes de minerales se calcula el nombre más cercano
        con los mismos diagramas de clasificación de la app, y se redacta una descripción técnica con la
        identificación y el ambiente de formación de la guía de rocas.
      </p>

      <div className="mb-6 grid grid-cols-3 gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTipo(t.id)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
              tipo === t.id ? t.activo : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            Roca {t.label.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Preguntas */}
        <Card className="card-accent">
          <CardHeader>
            <CardTitle className="text-lg">Preguntas</CardTitle>
            <div className="flex items-center gap-3 pt-1">
              <Progress value={(contestadas / totalPregs) * 100} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">
                {contestadas} de {totalPregs}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {preguntas.map((p, i) =>
              p.id === MINERALES_ID ? (
                <div key={`${tipo}-min`} className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label className="text-sm">
                      <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                      ¿Qué minerales identificas y en qué porcentaje aproximado?
                    </Label>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-medium',
                        totalMin === 0 ? 'text-muted-foreground' : Math.abs(totalMin - 100) <= 5 ? 'text-emerald-600' : 'text-amber-600'
                      )}
                    >
                      Total: {Math.round(totalMin)} %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se usan para clasificar con el diagrama {tipo === 'ignea' ? 'QAPF (o el de ultramáficas si hay > 90 % de máficos)' : tipo === 'sedimentaria' ? 'QFL y el contenido de carbonato' : 'de composición y grado'}. Si no suman 100 % se recalculan.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {MINERALES[tipo].map((d) => (
                      <label key={d.id} className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
                        <span className="min-w-0 flex-1 text-xs leading-tight">{d.label}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={100}
                          value={m[d.id] ?? ''}
                          onChange={(e) => setMin(d.id, e.target.value)}
                          placeholder="0"
                          className="w-12 rounded border bg-transparent px-1 py-0.5 text-right text-sm outline-none focus:ring-1 focus:ring-ring"
                          aria-label={`${d.label} en porcentaje`}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div key={`${tipo}-${p.id}`} className="space-y-1.5">
                  <Label htmlFor={`${tipo}-${p.id}`} className="text-sm">
                    <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                    {p.pregunta}
                  </Label>
                  {p.largo ? (
                    <Textarea id={`${tipo}-${p.id}`} value={r[p.id] ?? ''} onChange={(e) => setResp(p.id, e.target.value)} placeholder={`Ej.: ${p.ejemplo}`} rows={2} />
                  ) : (
                    <Input id={`${tipo}-${p.id}`} value={r[p.id] ?? ''} onChange={(e) => setResp(p.id, e.target.value)} placeholder={`Ej.: ${p.ejemplo}`} />
                  )}
                  {p.chips && (
                    <div className="flex flex-wrap gap-1">
                      {p.chips.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => chip(p, c)}
                          className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Resultado */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
          <Card className="card-accent" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#10b981,#14b8a6)' }}>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Nombre más cercano
              </CardDescription>
              <CardTitle className="text-2xl">{hayDatos ? resultado.nombre : '—'}</CardTitle>
              {hayDatos && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge className={cn('hover:bg-inherit', CONFIANZA[resultado.confianza].cls)}>{CONFIANZA[resultado.confianza].txt}</Badge>
                  {resultado.ficha && <Badge variant="outline">{resultado.ficha.clase}</Badge>}
                </div>
              )}
            </CardHeader>
            {hayDatos && (resultado.criterios.length > 0 || resultado.avisos.length > 0) && (
              <CardContent className="space-y-2 pt-0">
                {resultado.criterios.length > 0 && (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {resultado.criterios.map((c) => (
                      <li key={c} className="flex gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" /> {c}
                      </li>
                    ))}
                  </ul>
                )}
                {resultado.avisos.map((a) => (
                  <p key={a} className="flex gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {a}
                  </p>
                ))}
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Descripción de la muestra</CardTitle>
              <CardDescription>Se actualiza mientras respondes. «Otra redacción» cambia la forma de escribirla.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-40 space-y-3 rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                {hayDatos ? (
                  parrafos.map((p, i) => <p key={i}>{p}</p>)
                ) : (
                  <p className="text-muted-foreground">Empieza a responder y aquí aparecerá la descripción técnica de tu muestra.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copiar} disabled={!hayDatos} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  {copiado ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
                  {copiado ? 'Copiado' : 'Copiar texto'}
                </Button>
                <Button variant="outline" onClick={() => setSemilla((s) => s + 1)} disabled={!hayDatos}>
                  <Shuffle className="mr-1.5 h-4 w-4" /> Otra redacción
                </Button>
                <Button variant="ghost" onClick={borrar} disabled={contestadas === 0}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Borrar
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Identificación y ambientes de formación basados en la «Guía de rocas 1: conocimientos
                básicos». La clasificación es orientativa: confírmala con lámina delgada.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </GeoShell>
  )
}
