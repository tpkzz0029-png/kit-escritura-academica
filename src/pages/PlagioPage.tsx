import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  FileUp,
  Loader2,
  RefreshCcw,
  ScanLine,
  SearchCheck,
  ShieldAlert,
  Wand2,
  Wrench,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { analyzeOriginality, type PlagiarismReport } from '@/lib/plagiarism'
import {
  analyzeDetailed,
  analyzeSentences,
  LABEL_BADGE,
  UNI_PLAGIO_MAX,
  uniAIBadge,
} from '@/lib/aiDetect'
import { humanizeText } from '@/lib/humanize'
import { paraphraseText } from '@/lib/paraphrase'
import { buildDocx, downloadBlob } from '@/lib/docx'
import { synonymsFor } from '@/lib/synonyms'
import { matchCase, dividirOracion, K_DETECT_TEXT, K_DOC_NAME, K_PENDING_DETECT, EV_TEXT } from '@/lib/pageShared'
import { cn } from '@/lib/utils'
import PageShell from '@/components/PageShell'

export default function PlagioPage() {
  const navigate = useNavigate()

  // texto del detector: se sincroniza con la página «Detector y Humanizador»
  const [detectText, setDetectText] = useState(() => sessionStorage.getItem(K_DETECT_TEXT) ?? '')
  const [loadedDocName, setLoadedDocName] = useState<string | null>(
    () => sessionStorage.getItem(K_DOC_NAME) || null
  )
  useEffect(() => {
    const sync = () => {
      setDetectText(sessionStorage.getItem(K_DETECT_TEXT) ?? '')
      setLoadedDocName(sessionStorage.getItem(K_DOC_NAME) || null)
    }
    window.addEventListener(EV_TEXT, sync)
    return () => window.removeEventListener(EV_TEXT, sync)
  }, [])

  // Detector de originalidad (plagio)
  const [plagReport, setPlagReport] = useState<PlagiarismReport | null>(null)
  const [plagRunning, setPlagRunning] = useState(false)
  const [plagError, setPlagError] = useState<string | null>(null)
  const [plagProgress, setPlagProgress] = useState<{ done: number; total: number } | null>(null)
  const [plagCheckDup, setPlagCheckDup] = useState(true)
  const [plagIgnoreRefs, setPlagIgnoreRefs] = useState(true)
  const [plagIgnoreQuotes, setPlagIgnoreQuotes] = useState(true)

  // Corrector guiado (por partes / por palabras)
  const [corrText, setCorrText] = useState('')
  const [corrMode, setCorrMode] = useState<'partes' | 'palabras'>('partes')
  const [corrBusyIdx, setCorrBusyIdx] = useState<number | null>(null)
  const [corrError, setCorrError] = useState<string | null>(null)
  const [corrNotice, setCorrNotice] = useState<string | null>(null)
  const [corrScores, setCorrScores] = useState<Record<string, { before: number; after: number }>>({})
  const [corrWord, setCorrWord] = useState<{ word: string; start: number; end: number } | null>(null)
  const [corrBatchRunning, setCorrBatchRunning] = useState(false)
  const [corrBatchProgress, setCorrBatchProgress] = useState<string | null>(null)
  const [corrResult, setCorrResult] = useState<string | null>(null)

  const corrSentences = useMemo(
    () => (corrText.trim() ? analyzeSentences(corrText) : []),
    [corrText]
  )

  const corrTokens = useMemo(() => {
    const out: { text: string; start: number; end: number; isWord: boolean }[] = []
    const re = /\S+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(corrText)) !== null) {
      const clean = m[0].replace(/[^\p{L}\p{N}]/gu, '')
      out.push({
        text: m[0],
        start: m.index,
        end: m.index + m[0].length,
        isWord: clean.length >= 4 && /^\p{L}/u.test(clean),
      })
    }
    return out
  }, [corrText])

  const applyCorrSentence = useCallback(
    async (index: number, action: 'humanizar' | 'paraphrase' | 'dividir') => {
      const sents = analyzeSentences(corrText)
      const s = sents.find((x) => x.index === index)
      if (!s || corrBusyIdx !== null) return
      setCorrBusyIdx(index)
      setCorrError(null)
      setCorrNotice(null)
      try {
        let repl = s.text
        if (action === 'humanizar') {
          repl = humanizeText(s.text, { varyRhythm: true, longSentenceWords: 22 })
        } else if (action === 'dividir') {
          repl = dividirOracion(s.text)
        } else {
          const r = await paraphraseText(s.text)
          repl = r.text
        }
        const afterScore = analyzeSentences(repl)[0]?.score ?? s.score
        if (repl.trim() === s.text.trim()) {
          setCorrNotice(
            action === 'dividir'
              ? `Oración ${index}: no se pudo dividir (necesita al menos 10 palabras y una coma o conector).`
              : action === 'paraphrase'
                ? `Oración ${index}: el parafraseo devolvió el mismo texto. Inténtalo de nuevo.`
                : `Oración ${index}: sin cambios — no había frases de molde que sustituir. Prueba «Parafrasear» para reescribirla.`
          )
        } else {
          setCorrText(sents.map((x) => (x.index === index ? repl : x.text)).join(' '))
          setCorrScores((prev) => ({ ...prev, [s.text]: { before: s.score, after: afterScore } }))
          setCorrNotice(
            `Oración ${index} reescrita (${action === 'paraphrase' ? 'parafraseada' : action === 'dividir' ? 'dividida' : 'humanizada'}): riesgo de IA ${s.score}% → ${afterScore}%.`
          )
        }
      } catch (e) {
        setCorrError(
          e instanceof Error ? e.message : 'No se pudo corregir esa oración. Inténtalo de nuevo.'
        )
      } finally {
        setCorrBusyIdx(null)
      }
    },
    [corrText, corrBusyIdx]
  )

  const replaceCorrWord = useCallback(
    (variant: string) => {
      if (!corrWord) return
      setCorrText(corrText.slice(0, corrWord.start) + variant + corrText.slice(corrWord.end))
      setCorrWord(null)
    },
    [corrWord, corrText]
  )

  /** parafrasea automáticamente todas las oraciones con riesgo de IA > 20% */
  const paraphraseHighRisk = useCallback(async () => {
    if (corrBatchRunning) return
    const src = corrText.trim()
    if (!src) return
    const sents = analyzeSentences(src)
    const targets = sents.filter((s) => s.score > 20)
    if (targets.length === 0) {
      setCorrNotice('Ninguna oración supera el 20% de riesgo de IA: no hizo falta parafrasear.')
      return
    }
    setCorrBatchRunning(true)
    setCorrBatchProgress(null)
    setCorrError(null)
    setCorrNotice(null)
    setCorrResult(null)
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    try {
      const before = analyzeDetailed(src).report.overallScore
      const parts = sents.map((s) => s.text)
      let changed = 0
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i]
        setCorrBatchProgress(
          `Parafraseando oración ${t.index} — ${i + 1} de ${targets.length} (riesgo ${t.score}%)…`
        )
        const original = parts[t.index - 1]
        try {
          const r = await paraphraseText(original)
          // pulido local: el parafraseo de ida y vuelta conserva frases
          // grandilocuentes; se pasan las reglas de humanización por oración
          const polished = humanizeText(r.text, { varyRhythm: false })
          if (polished.trim() && polished.trim() !== original.trim()) {
            parts[t.index - 1] = polished.trim()
            changed++
          }
        } catch {
          // si una oración falla (límite de tasa, sin conexión), se conserva la original
        }
        if (i < targets.length - 1) await sleep(700)
      }
      const result = parts.join(' ')
      const after = analyzeDetailed(result).report.overallScore
      setCorrText(result)
      setCorrResult(result)
      setCorrScores({})
      setCorrNotice(
        `Listo: ${changed} de ${targets.length} oraciones parafraseadas. IA global del texto: ${before}% → ${after}%.`
      )
    } catch (e) {
      setCorrError(
        e instanceof Error ? e.message : 'No se pudo completar el parafraseo automático.'
      )
    } finally {
      setCorrBatchRunning(false)
      setCorrBatchProgress(null)
    }
  }, [corrText, corrBatchRunning])

  const runPlagio = useCallback(async () => {
    const src = detectText.trim()
    if (!src || plagRunning) return
    setPlagRunning(true)
    setPlagError(null)
    setPlagReport(null)
    try {
      const r = await analyzeOriginality(
        src,
        {
          checkDuplicates: plagCheckDup,
          ignoreReferences: plagIgnoreRefs,
          ignoreQuotes: plagIgnoreQuotes,
        },
        (d, t) => setPlagProgress({ done: d, total: t })
      )
      setPlagReport(r)
    } catch (e) {
      console.error(e)
      setPlagError(e instanceof Error ? e.message : 'No se pudo completar el análisis de originalidad.')
    } finally {
      setPlagRunning(false)
      setPlagProgress(null)
    }
  }, [detectText, plagRunning, plagCheckDup, plagIgnoreRefs, plagIgnoreQuotes])

  return (
    <PageShell>
            <Card className="card-accent mb-6 border-amber-200/60 dark:border-amber-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#f59e0b,#f97316)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <SearchCheck className="h-5 w-5 text-amber-600" />
                  Detector de originalidad (plagio)
                </CardTitle>
                <CardDescription>
                  Análisis minucioso en tres capas: pasajes repetidos dentro del documento, citas
                  textuales sin referencia y comprobación web de las frases más distintivas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Alcance realista</AlertTitle>
                  <AlertDescription>
                    Ninguna herramienta 100% web puede replicar el índice académico de Turnitin. Esto
                    detecta autoplagio, plantillas recicladas y textos muy divulgados en internet. Para
                    trabajos finales, complementa con el comprobador de tu universidad o con el de
                    Grammarly (enlace en la página Detector y Humanizador).
                  </AlertDescription>
                </Alert>

                {detectText.trim() ? (
                  <p className="text-sm text-muted-foreground">
                    Documento a revisar: {detectText.trim().split(/\s+/).length.toLocaleString('es')} palabras
                    {loadedDocName ? ` · ${loadedDocName}` : ''}.
                  </p>
                ) : (
                  <p className="text-sm text-amber-600">
                    Primero carga o pega un texto en la página «Detector y Humanizador».
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="plag-dup"
                        checked={plagCheckDup}
                        onCheckedChange={(v) => setPlagCheckDup(v === true)}
                      />
                      <Label htmlFor="plag-dup" className="text-sm">
                        Plantillas recicladas (pasajes repetidos)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="plag-refs"
                        checked={plagIgnoreRefs}
                        onCheckedChange={(v) => setPlagIgnoreRefs(v === true)}
                      />
                      <Label htmlFor="plag-refs" className="text-sm">
                        Ignorar referencias/bibliografía
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="plag-quotes"
                        checked={plagIgnoreQuotes}
                        onCheckedChange={(v) => setPlagIgnoreQuotes(v === true)}
                      />
                      <Label htmlFor="plag-quotes" className="text-sm">
                        Ignorar citas entrecomilladas
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void runPlagio()} disabled={plagRunning || !detectText.trim()}>
                    {plagRunning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SearchCheck className="mr-2 h-4 w-4" />
                    )}
                    {plagRunning ? 'Analizando…' : 'Analizar originalidad'}
                  </Button>
                  {plagRunning && plagProgress && (
                    <span className="text-sm text-muted-foreground">
                      Comprobando frase {plagProgress.done} de {plagProgress.total} en la web…
                    </span>
                  )}
                </div>

                {plagError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{plagError}</AlertDescription>
                  </Alert>
                )}

                {plagReport && (
                  <div className="space-y-5">
                    {/* puntuación */}
                    <div className="rounded-xl border p-5">
                      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                        <div className="text-center">
                          <p
                            className={`text-5xl font-extrabold ${
                              100 - plagReport.originalityScore <= UNI_PLAGIO_MAX
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {100 - plagReport.originalityScore}%
                          </p>
                          <p className="mt-1 text-sm font-medium">plagio estimado</p>
                          <Badge
                            className={`mt-2 ${
                              100 - plagReport.originalityScore <= UNI_PLAGIO_MAX
                                ? LABEL_BADGE.humano
                                : LABEL_BADGE.ia
                            }`}
                          >
                            {100 - plagReport.originalityScore <= UNI_PLAGIO_MAX
                              ? `≤${UNI_PLAGIO_MAX}% · dentro del criterio universitario`
                              : `>${UNI_PLAGIO_MAX}% · supera el criterio universitario`}
                          </Badge>
                        </div>
                        <div className="w-full flex-1 space-y-2">
                          <Progress
                            value={plagReport.originalityScore}
                            className={cn(
                              'h-3',
                              100 - plagReport.originalityScore > UNI_PLAGIO_MAX && '[&>div]:bg-red-500'
                            )}
                          />
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              índice de originalidad:{' '}
                              <span className="font-medium">{plagReport.originalityScore}%</span>
                            </span>
                            <span>{plagReport.wordCount.toLocaleString('es')} palabras analizadas</span>
                          </div>
                          <p
                            className={cn(
                              'flex items-start gap-1.5 text-xs font-medium',
                              100 - plagReport.originalityScore <= UNI_PLAGIO_MAX
                                ? 'text-green-600'
                                : 'text-red-600'
                            )}
                          >
                            {100 - plagReport.originalityScore <= UNI_PLAGIO_MAX ? (
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            )}
                            Criterio universitario configurado: máximo {UNI_PLAGIO_MAX}% de plagio
                            (originalidad mínima {100 - UNI_PLAGIO_MAX}%).
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              palabras en pasajes repetidos:{' '}
                              <span className="font-medium">{plagReport.duplicatedWords}</span>
                            </span>
                            <span>
                              citas textuales detectadas:{' '}
                              <span className="font-medium">{plagReport.quotes.length}</span>
                            </span>
                            <span>
                              coincidencias web:{' '}
                              <span className="font-medium">
                                {plagReport.webChecks.filter((c) => c.found).length} de{' '}
                                {plagReport.webChecks.length}
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {plagReport.excludedReferences && (
                              <Badge variant="secondary">sección de referencias excluida</Badge>
                            )}
                            {plagReport.excludedQuotes && (
                              <Badge variant="secondary">citas entrecomilladas excluidas</Badge>
                            )}
                            {plagReport.duplicatesDisabled && (
                              <Badge variant="secondary">detección de duplicados desactivada</Badge>
                            )}
                          </div>
                          {plagReport.webError && (
                            <p className="flex items-start gap-1.5 text-xs text-amber-600">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {plagReport.webError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* pasajes repetidos */}
                    {plagReport.passages.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Pasajes repetidos dentro del documento
                        </h3>
                        <div className="divide-y rounded-lg border">
                          {plagReport.passages.map((p, i) => (
                            <div key={i} className="space-y-1 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="destructive">×{p.occurrences}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {p.words} palabras · apariciones en los bloques {p.locations.join(' y ')}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed text-muted-foreground">{p.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* citas */}
                    {plagReport.quotes.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Citas textuales (excluidas del análisis — verifica su referencia)
                        </h3>
                        <div className="divide-y rounded-lg border">
                          {plagReport.quotes.map((q, i) => (
                            <p key={i} className="p-3 text-xs italic leading-relaxed text-muted-foreground">
                              «{q.text.length > 220 ? q.text.slice(0, 220) + '…' : q.text}»
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* paráfrasis internas (matching difuso) */}
                    {plagReport.paraphrases.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Paráfrasis internas detectadas (matching difuso)
                        </h3>
                        <div className="divide-y rounded-lg border">
                          {plagReport.paraphrases.map((p, i) => (
                            <div key={i} className="space-y-1 p-3">
                              <Badge
                                variant="destructive"
                                className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              >
                                similitud de vocabulario {Math.round(p.similarity * 100)}%
                              </Badge>
                              <p className="text-xs leading-relaxed text-muted-foreground">{p.first}</p>
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                <span className="font-medium">reescrita como:</span> {p.second}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Estas oraciones dicen lo mismo con palabras distintas (señal de plantillas
                          recicladas o de párrafos expandidos con IA).
                        </p>
                      </div>
                    )}

                    {/* comprobación web */}
                    {plagReport.webChecks.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Comprobación web de frases distintivas
                        </h3>
                        <div className="divide-y rounded-lg border">
                          {plagReport.webChecks.map((c, i) => (
                            <div key={i} className="space-y-1 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {c.found ? (
                                  <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                                    posible coincidencia
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                    sin coincidencias
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                {c.sentence.length > 180 ? c.sentence.slice(0, 180) + '…' : c.sentence}
                              </p>
                              {c.found && c.title && (
                                <p className="text-xs text-muted-foreground">
                                  Referencia encontrada: <span className="font-medium">{c.title}</span>
                                  {c.url && (
                                    <>
                                      {' '}
                                      —{' '}
                                      <a href={c.url} target="_blank" rel="noreferrer" className="underline">
                                        abrir fuente
                                      </a>
                                    </>
                                  )}
                                </p>
                              )}
                              {typeof c.similarity === 'number' && (
                                <p className="text-xs text-muted-foreground">
                                  Similitud difusa con la fuente:{' '}
                                  <span
                                    className={
                                      c.similarity >= 0.5 ? 'font-medium text-amber-600' : 'font-medium'
                                    }
                                  >
                                    {Math.round(c.similarity * 100)}%
                                  </span>{' '}
                                  (Jaccard de vocabulario de contenido)
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          La comprobación web solo identifica frases muy divulgadas (enciclopédicas o de
                          dominio público). No sustituye un índice académico.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          {/* ═══════════════ Corrector guiado (mismo apartado) ═══════════════ */}
            <Card className="card-accent mb-6 border-amber-200/60 dark:border-amber-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#f59e0b,#f97316)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="h-5 w-5 text-amber-600" />
                  Corrección guiada
                </CardTitle>
                <CardDescription>
                  Corrige el texto donde el detector lo señala: oración por oración (humanizar,
                  parafrasear o dividir) o palabra por palabra con sinónimos. El resultado se puede
                  descargar en Word.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCorrText(detectText.trim())
                      setCorrError(null)
                      setCorrNotice(null)
                      setCorrScores({})
                      setCorrWord(null)
                    }}
                    disabled={!detectText.trim()}
                  >
                    <FileUp className="mr-1.5 h-3.5 w-3.5" /> Cargar texto del detector
                  </Button>
                  {detectText.trim() && !corrText && (
                    <p className="text-sm text-amber-600">
                      Tienes texto analizado en la página «Detector y Humanizador»; cárgalo aquí o pega tu texto.
                    </p>
                  )}
                </div>

                <Textarea
                  value={corrText}
                  onChange={(e) => {
                    setCorrText(e.target.value)
                    setCorrWord(null)
                    setCorrNotice(null)
                    setCorrScores({})
                    setCorrResult(null)
                  }}
                  placeholder="Pega aquí el texto que quieres corregir…"
                  className="min-h-36 leading-relaxed"
                />

                {corrText.trim() && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => void paraphraseHighRisk()}
                      disabled={corrBatchRunning || corrBusyIdx !== null}
                    >
                      {corrBatchRunning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                      )}
                      {corrBatchRunning ? 'Parafraseando…' : 'Parafrasear todo lo que sale con más del 20% de IA'}
                    </Button>
                    {corrBatchProgress && (
                      <span className="text-sm text-muted-foreground">{corrBatchProgress}</span>
                    )}
                  </div>
                )}

                {corrResult && !corrBatchRunning && (
                  <div className="space-y-3 rounded-xl border border-green-500/40 bg-green-500/5 p-4">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Texto completo editado — listo para copiar o descargar
                    </p>
                    <div className="max-h-64 overflow-y-auto rounded-md border bg-background p-3">
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{corrResult}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void navigator.clipboard.writeText(corrResult)}
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar texto
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadBlob(
                            new Blob([corrResult], { type: 'text/plain;charset=utf-8' }),
                            'texto_parafraseado.txt'
                          )
                        }
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Descargar .txt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void (async () => {
                            const blob = await buildDocx(
                              [{ page: 1, text: corrResult }],
                              null,
                              'convert',
                              'Texto parafraseado',
                              false,
                              'Oraciones con más del 20% de riesgo de IA parafraseadas automáticamente'
                            )
                            downloadBlob(blob, 'texto_parafraseado.docx')
                          })()
                        }}
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" /> Descargar Word (.docx)
                      </Button>
                    </div>
                  </div>
                )}

                {corrText.trim() && (
                  <>
                    <RadioGroup
                      value={corrMode}
                      onValueChange={(v) => {
                        setCorrMode(v as 'partes' | 'palabras')
                        setCorrWord(null)
                      }}
                    >
                      <div className="flex items-start space-x-3 rounded-lg border p-3">
                        <RadioGroupItem value="partes" id="c-partes" className="mt-1" />
                        <div>
                          <Label htmlFor="c-partes" className="font-medium">Corregir por partes (oraciones)</Label>
                          <p className="text-sm text-muted-foreground">
                            Cada oración va con su riesgo de IA y botones para humanizarla, parafrasearla
                            o dividirla en dos. Ideal para atacar solo lo que el detector marca.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 rounded-lg border p-3">
                        <RadioGroupItem value="palabras" id="c-palabras" className="mt-1" />
                        <div>
                          <Label htmlFor="c-palabras" className="font-medium">Corregir por palabras</Label>
                          <p className="text-sm text-muted-foreground">
                            Toca una palabra del texto y elige un sinónimo para sustituirla al instante.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>

                    {corrError && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{corrError}</AlertDescription>
                      </Alert>
                    )}
                    {corrNotice && !corrError && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{corrNotice}</AlertDescription>
                      </Alert>
                    )}

                    {corrMode === 'partes' ? (
                      <div className="space-y-2">
                        {corrSentences.slice(0, 80).map((s) => (
                          <div
                            key={s.index}
                            className="rounded-lg border p-3 transition-colors hover:bg-muted/40"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className={uniAIBadge(s.score)}>
                                {s.score}% IA
                              </Badge>
                              {corrScores[s.text] && (
                                <Badge
                                  variant="secondary"
                                  className={uniAIBadge(corrScores[s.text].after)}
                                >
                                  <ArrowRight className="mr-1 h-3 w-3" />
                                  antes {corrScores[s.text].before}% → después {corrScores[s.text].after}%
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                oración {s.index} · {s.words} palabras
                              </span>
                              <div className="ml-auto flex flex-wrap gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  disabled={corrBusyIdx !== null}
                                  onClick={() => void applyCorrSentence(s.index, 'humanizar')}
                                >
                                  {corrBusyIdx === s.index ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : (
                                    <Wand2 className="mr-1 h-3 w-3" />
                                  )}
                                  Humanizar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  disabled={corrBusyIdx !== null}
                                  onClick={() => void applyCorrSentence(s.index, 'paraphrase')}
                                >
                                  {corrBusyIdx === s.index ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCcw className="mr-1 h-3 w-3" />
                                  )}
                                  Parafrasear
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  disabled={corrBusyIdx !== null}
                                  onClick={() => void applyCorrSentence(s.index, 'dividir')}
                                >
                                  Dividir
                                </Button>
                              </div>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed">{s.text}</p>
                            {s.flags.length > 0 && (
                              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                                {s.flags.join(' · ')}
                              </p>
                            )}
                          </div>
                        ))}
                        {corrSentences.length > 80 && (
                          <p className="text-xs text-muted-foreground">
                            Se muestran las primeras 80 oraciones para mantener la interfaz fluida.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-loose">
                          {corrTokens.map((tk, i) =>
                            tk.isWord ? (
                              <span key={`${tk.start}-${i}`}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCorrWord(
                                      corrWord?.start === tk.start
                                        ? null
                                        : { word: tk.text, start: tk.start, end: tk.end }
                                    )
                                  }
                                  className={cn(
                                    'rounded px-0.5 transition-colors hover:bg-primary/15',
                                    corrWord?.start === tk.start && 'bg-primary/25 underline'
                                  )}
                                >
                                  {tk.text}
                                </button>{' '}
                              </span>
                            ) : (
                              <span key={`${tk.start}-${i}`}>{tk.text} </span>
                            )
                          )}
                          {corrTokens.length === 0 && (
                            <span className="text-muted-foreground">
                              Escribe o pega un texto para editarlo palabra por palabra.
                            </span>
                          )}
                        </div>

                        {corrWord &&
                          (() => {
                            const clean = corrWord.word.replace(/[^\p{L}\p{N}]/gu, '')
                            const syns = synonymsFor(clean)
                            return (
                              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
                                <span className="text-sm font-medium">«{clean}» →</span>
                                {syns ? (
                                  syns.map((v) => (
                                    <Button
                                      key={v}
                                      variant="secondary"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => replaceCorrWord(
                                        corrWord.word.replace(clean, matchCase(clean, v))
                                      )}
                                    >
                                      {v}
                                    </Button>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    sin sinónimos sugeridos para esta palabra
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-auto h-7 text-xs"
                                  onClick={() => setCorrWord(null)}
                                >
                                  Cerrar
                                </Button>
                              </div>
                            )
                          })()}
                        <p className="text-[11px] text-muted-foreground">
                          Solo las palabras de 4+ letras son editables; toca una para ver sus sinónimos.
                        </p>
                      </div>
                    )}

                    <Separator />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void navigator.clipboard.writeText(corrText)}
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadBlob(
                            new Blob([corrText], { type: 'text/plain;charset=utf-8' }),
                            'texto_corregido.txt'
                          )
                        }
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Descargar .txt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void (async () => {
                            const blob = await buildDocx(
                              [{ page: 1, text: corrText }],
                              null,
                              'convert',
                              'Texto corregido',
                              false,
                              'Procesado con el corrector guiado'
                            )
                            downloadBlob(blob, 'texto_corregido.docx')
                          })()
                        }}
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" /> Descargar Word (.docx)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          sessionStorage.setItem(K_PENDING_DETECT, corrText)
                          navigate('/detector')
                        }}
                      >
                        <ScanLine className="mr-1.5 h-3.5 w-3.5" /> Re-analizar en Detector IA
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
    </PageShell>
  )
}
