import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  Loader2,
  RefreshCcw,
  ScanLine,
  ShieldAlert,
  SpellCheck,
  Wand2,
  Wrench,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { extractTextFromFile } from '@/lib/fileText'
import { checkGrammar, categoryBadgeClass, applyGrammarFixes, isAutoFixable, type GrammarReport } from '@/lib/grammar'
import {
  analyzeDetailed,
  LABEL_BADGE,
  LABEL_BAR,
  LABEL_TEXT,
  uniAIBadge,
  uniAIColor,
  uniAIText,
  UNI_AI_MAX,
  type AIDetectionReport,
  type SentenceResult,
} from '@/lib/aiDetect'
import { humanizeText } from '@/lib/humanize'
import { humanizeWithAI } from '@/lib/aiHumanize'
import { paraphraseText } from '@/lib/paraphrase'
import { buildDocx, downloadBlob } from '@/lib/docx'
import { K_DETECT_TEXT, K_DOC_NAME, K_PENDING_DETECT, K_PDF_TEXT } from '@/lib/pageShared'
import { cn } from '@/lib/utils'
import PageShell from '@/components/PageShell'

/* opciones de acomodo del texto según la señal del detector que esté alta */
const SIGNAL_FIX: Record<
  string,
  { flag: 'metaphors' | 'phrases' | 'connectors' | 'repetition' | 'rhythm'; label: string; desc: string }
> = {
  burstiness: {
    flag: 'rhythm',
    label: 'Variar el ritmo de las oraciones',
    desc: 'une y divide oraciones para romper la monotonía de longitudes',
  },
  predictability: {
    flag: 'connectors',
    label: 'Sustituir conectores y muletillas predecibles',
    desc: 'cambia conectores muy frecuentes por alternativas menos usadas',
  },
  diversity: {
    flag: 'repetition',
    label: 'Diversificar vocabulario repetido',
    desc: 'varía las palabras de contenido que se reciclan en el texto',
  },
  repetition: {
    flag: 'repetition',
    label: 'Diversificar vocabulario y estructuras repetidas',
    desc: 'varía vocabulario reciclado y comienzos de oración iguales',
  },
  phrases: {
    flag: 'phrases',
    label: 'Reescribir frases de molde',
    desc: 'sustituye las transiciones típicas de IA por alternativas naturales',
  },
  metaphors: {
    flag: 'metaphors',
    label: 'Sustituir lenguaje grandilocuente',
    desc: 'cambia metáforas elevadas y superlativos por equivalentes sobrios',
  },
}

export default function DetectorPage() {
  // texto: se inicializa con lo guardado (navegación entre páginas) o con una transferencia pendiente
  const [detectText, setDetectText] = useState(() => {
    const pending = sessionStorage.getItem(K_PENDING_DETECT)
    if (pending) {
      sessionStorage.removeItem(K_PENDING_DETECT)
      return pending
    }
    return sessionStorage.getItem(K_DETECT_TEXT) ?? ''
  })
  const [loadedDocName, setLoadedDocName] = useState<string | null>(
    () => sessionStorage.getItem(K_DOC_NAME)
  )
  const [hasPdfText, setHasPdfText] = useState(() => !!sessionStorage.getItem(K_PDF_TEXT))
  const [report, setReport] = useState<AIDetectionReport | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [docLoading, setDocLoading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const [docDragging, setDocDragging] = useState(false)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [sentences, setSentences] = useState<SentenceResult[]>([])
  const [sentProgress, setSentProgress] = useState<{ done: number; total: number } | null>(null)
  const skipAnimRef = useRef(false)
  const sentListRef = useRef<HTMLDivElement>(null)

  // Segunda opinión automática de escritura (LanguageTool)
  const [ltReport, setLtReport] = useState<GrammarReport | null>(null)
  const [ltLoading, setLtLoading] = useState(false)
  const [ltError, setLtError] = useState<string | null>(null)
  const [ltApplying, setLtApplying] = useState(false)
  const [ltApplyMsg, setLtApplyMsg] = useState<string | null>(null)

  // aplicar correcciones de ortografía y concordancia al texto de una vez
  const applyLtFixes = useCallback(() => {
    if (!ltReport || ltApplying) return
    setLtApplying(true)
    try {
      const { text: fixed, applied } = applyGrammarFixes(detectText, ltReport.issues)
      if (applied > 0) {
        setDetectText(fixed)
        setLtReport(null)
        setLtError(null)
        setLtApplyMsg(
          `Se aplicaron ${applied} correcciones de ortografía y concordancia. El texto se actualizó: vuelve a analizar para ver el veredicto limpio.`
        )
      } else {
        setLtApplyMsg(
          'No hay correcciones de ortografía/concordancia con sugerencia automática que aplicar.'
        )
      }
    } finally {
      setLtApplying(false)
    }
  }, [ltReport, ltApplying, detectText])

  // opciones de acomodo del texto (por señal alta del detector)
  const [fixSel, setFixSel] = useState<Record<string, boolean>>({})
  const [fixMsg, setFixMsg] = useState<string | null>(null)

  // al llegar un informe nuevo se pre-marcan las señales altas (≥45)
  useEffect(() => {
    if (!report) return
    const sel: Record<string, boolean> = {}
    for (const m of report.metrics) {
      if (m.aiScore >= 45 && SIGNAL_FIX[m.key]) sel[m.key] = true
    }
    setFixSel(sel)
    setFixMsg(null)
  }, [report])

  // cajas plegables de resultados
  const [openVerdict, setOpenVerdict] = useState(true)
  const [openSentences, setOpenSentences] = useState(true)
  const [openGrammar, setOpenGrammar] = useState(true)

  // Humanizador / parafraseo
  const [humText, setHumText] = useState('')
  const [humBefore, setHumBefore] = useState<number | null>(null)
  const [humAfter, setHumAfter] = useState<number | null>(null)
  const [humTruncated, setHumTruncated] = useState(false)
  const [humChanges, setHumChanges] = useState('')
  const [humRunning, setHumRunning] = useState(false)
  const [humMode, setHumMode] = useState<'rules' | 'paraphrase' | 'ia'>('rules')
  const [humFlaggedOnly, setHumFlaggedOnly] = useState(false)
  const [humError, setHumError] = useState<string | null>(null)
  const [humProgress, setHumProgress] = useState<string | null>(null)

  // comparte el texto con la página de plagio y conserva transferencias entre páginas
  useEffect(() => {
    sessionStorage.setItem(K_DETECT_TEXT, detectText)
    sessionStorage.setItem(K_DOC_NAME, loadedDocName ?? '')
    window.dispatchEvent(new Event('app:text'))
  }, [detectText, loadedDocName])

  // si se convierte un PDF en otra pestaña del navegador, se refleja aquí
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === K_PDF_TEXT) setHasPdfText(!!e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const runGrammarCheck = useCallback((text: string) => {
    setLtReport(null)
    setLtError(null)
    setLtApplyMsg(null)
    setLtLoading(true)
    checkGrammar(text)
      .then((r) => setLtReport(r))
      .catch((e) =>
        setLtError(e instanceof Error ? e.message : 'No se pudo contactar con LanguageTool.')
      )
      .finally(() => setLtLoading(false))
  }, [])

  // Análisis detallado oración por oración con revelado progresivo
  const runAnalysis = useCallback(async (overrideText?: string) => {
    if (analyzing) return
    const trimmed = (overrideText ?? detectText).trim()
    if (trimmed.split(/\s+/).filter(Boolean).length < 40) return
    setAnalyzing(true)
    setReport(null)
    setSentences([])
    setSentProgress(null)
    skipAnimRef.current = false

    const { report: rep, sentences: sents } = analyzeDetailed(trimmed)
    setSentProgress({ done: 0, total: sents.length })

    // duración total de la animación ~6 s, con límites por línea
    const delay = Math.min(140, Math.max(35, Math.round(6000 / Math.max(1, sents.length))))
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    for (let i = 0; i < sents.length; i++) {
      if (skipAnimRef.current) {
        setSentences([...sents])
        setSentProgress({ done: sents.length, total: sents.length })
        break
      }
      await sleep(delay)
      setSentences((prev) => [...prev, sents[i]])
      setSentProgress({ done: i + 1, total: sents.length })
    }

    await sleep(350)
    setReport(rep)
    setAnalyzing(false)

    // segunda opinión automática: gramática, ortografía y estilo
    runGrammarCheck(trimmed)
  }, [analyzing, detectText, runGrammarCheck])

  // aplica al texto solo los arreglos seleccionados y vuelve a analizar
  const applyFixesAndReanalyze = useCallback(async () => {
    const src = detectText.trim()
    if (!src || analyzing) return
    const flags: NonNullable<Parameters<typeof humanizeText>[1]['fix']> = {}
    let any = false
    let rhythm = false
    for (const [key, sel] of Object.entries(fixSel)) {
      if (!sel) continue
      const f = SIGNAL_FIX[key]?.flag
      if (!f) continue
      any = true
      if (f === 'rhythm') rhythm = true
      else flags[f] = true
    }
    if (!any) {
      setFixMsg('Marca al menos una opción para acomodar el texto.')
      return
    }
    const fixed = humanizeText(src, { varyRhythm: rhythm, fix: flags })
    if (fixed.trim() === src) {
      setFixMsg('El texto quedó igual: esas señales no tienen coincidencias que acomodar.')
      return
    }
    setDetectText(fixed)
    setFixMsg(null)
    await runAnalysis(fixed)
  }, [detectText, analyzing, fixSel, runAnalysis])

  // auto-scroll de la lista de oraciones mientras se revela
  useEffect(() => {
    const el = sentListRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [sentences.length])

  const handleDocFile = useCallback(async (f: File) => {
    setDocError(null)
    setDocLoading(true)
    try {
      const text = await extractTextFromFile(f)
      setDetectText(text)
      setReport(null)
      setSentences([])
      setSentProgress(null)
      setLtReport(null)
      setLtError(null)
      setLoadedDocName(f.name)
    } catch (e) {
      console.error(e)
      setDocError(e instanceof Error ? e.message : 'No se pudo leer el documento.')
      setLoadedDocName(null)
    } finally {
      setDocLoading(false)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }, [])

  const runHumanize = useCallback(async () => {
    const src = detectText.trim()
    if (!src || humRunning) return
    setHumRunning(true)
    setHumError(null)
    setHumText('')
    setHumBefore(null)
    setHumAfter(null)
    setHumTruncated(false)
    setHumChanges('')
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    try {
      const flagged =
        humFlaggedOnly && sentences.length > 0
          ? new Set(sentences.filter((s) => s.score >= 50).map((s) => s.index))
          : undefined
      setHumProgress('Calculando puntuación actual…')
      await sleep(250)
      const before = analyzeDetailed(src).report.overallScore

      let result: string
      let iaNote: string | null = null
      if (humMode === 'ia') {
        try {
          setHumProgress('Humanizando con IA (automático)…')
          const r = await humanizeWithAI(src, setHumProgress)
          setHumTruncated(r.truncated)
          setHumChanges(r.changes)
          result = r.text
        } catch (e) {
          // el servidor de IA no responde (p. ej. hosting estático sin /api/humanize):
          // se recurre al parafraseo de ida y vuelta + reglas, que vive en el navegador
          iaNote = e instanceof Error ? e.message : 'El servidor de IA no está disponible.'
          setHumProgress('Servidor de IA no disponible; aplicando parafraseo local…')
          const r = await paraphraseText(src, (d, t) => setHumProgress(`Parafraseando trozo ${d} de ${t}…`))
          setHumProgress('Puliendo el parafraseo (sustituyendo lenguaje grandilocuente)…')
          await sleep(300)
          result = humanizeText(r.text, { varyRhythm: false })
          setHumTruncated(false)
        }
      } else if (humMode === 'paraphrase') {
        setHumProgress('Parafraseando con traducción de ida y vuelta…')
        const r = await paraphraseText(src, (d, t) => setHumProgress(`Parafraseando trozo ${d} de ${t}…`))
        setHumProgress('Puliendo el parafraseo (sustituyendo lenguaje grandilocuente)…')
        await sleep(300)
        // la traducción de ida y vuelta conserva las metáforas que más pesan
        // en la señal de IA; se les aplican las reglas de humanización
        result = humanizeText(r.text, { varyRhythm: false })
      } else {
        setHumProgress('Aplicando reglas de humanización (frases, sinónimos, ritmo)…')
        await sleep(400)
        result = humanizeText(src, { varyRhythm: true, onlySentences: flagged })
      }

      setHumProgress('Re-evaluando el texto resultante…')
      await sleep(250)
      const after = analyzeDetailed(result).report.overallScore
      setHumText(result)
      setHumBefore(before)
      setHumAfter(after)
      if (iaNote) {
        setHumChanges(`⚠️ ${iaNote}\n\nSe aplicó el parafraseo local (ida y vuelta + reglas) como alternativa.`)
      }
    } catch (e) {
      console.error(e)
      setHumError(e instanceof Error ? e.message : 'No se pudo humanizar el texto. Inténtalo de nuevo.')
    } finally {
      setHumRunning(false)
      setHumProgress(null)
    }
  }, [detectText, humRunning, humMode, humFlaggedOnly, sentences])

  return (
    <PageShell>
            <Card className="card-accent mb-6 border-violet-200/60 dark:border-violet-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#8b5cf6,#d946ef)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ScanLine className="h-5 w-5 text-violet-600" />
                  Detector de texto generado por IA
                </CardTitle>
                <CardDescription>
                  Análisis minucioso estilo Turnitin: segmentación en ventanas solapadas, perplejidad,
                  burstiness, repetición y frases de molde. Pega un texto o usa el del PDF que cargaste.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Carga de documento */}
                <div className="space-y-2">
                  <Label>Documento (opcional)</Label>
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".txt,.md,.csv,.docx,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void handleDocFile(f)
                    }}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !docLoading && docInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && docInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDocDragging(true)
                    }}
                    onDragLeave={() => setDocDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDocDragging(false)
                      const f = e.dataTransfer.files?.[0]
                      if (f) void handleDocFile(f)
                    }}
                    className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                      docDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40'
                    } ${docLoading ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    {docLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <p className="text-sm font-medium">Extrayendo texto del documento…</p>
                      </>
                    ) : loadedDocName ? (
                      <>
                        <FileText className="h-5 w-5 text-primary" />
                        <p className="text-sm">
                          <span className="font-medium">{loadedDocName}</span>{' '}
                          <span className="text-muted-foreground">
                            — texto cargado, ya puedes analizarlo
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <FileUp className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Arrastra un documento o haz clic: <span className="font-medium">.pdf · .docx · .txt · .md · .csv</span>
                        </p>
                      </>
                    )}
                  </div>
                  {docError && <p className="text-xs text-destructive">{docError}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="detect-input">Texto a analizar</Label>
                    <span className="text-xs text-muted-foreground">
                      {detectText.trim() ? detectText.trim().split(/\s+/).length : 0} palabras
                      (mínimo recomendado: 300)
                    </span>
                  </div>
                  <Textarea
                    id="detect-input"
                    value={detectText}
                    onChange={(e) => {
                      setDetectText(e.target.value)
                      setReport(null)
                      setSentences([])
                      setSentProgress(null)
                      setLtReport(null)
                      setLtError(null)
                      setLoadedDocName(null)
                    }}
                    placeholder="Pega aquí el texto que quieres analizar…"
                    className="min-h-44 leading-relaxed"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => void runAnalysis()}
                    disabled={analyzing || detectText.trim().split(/\s+/).filter(Boolean).length < 40}
                  >
                    {analyzing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ScanLine className="mr-2 h-4 w-4" />
                    )}
                    {analyzing ? 'Analizando…' : 'Analizar oración por oración'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!hasPdfText}
                    onClick={() => {
                      setDetectText(sessionStorage.getItem(K_PDF_TEXT) ?? '')
                      setReport(null)
                      setSentences([])
                      setSentProgress(null)
                      setLoadedDocName(null)
                    }}
                  >
                    <FileText className="mr-1.5 h-4 w-4" />
                    Usar texto del PDF cargado
                  </Button>
                  <Button variant="ghost" onClick={() => { setDetectText(''); setReport(null); setSentences([]); setSentProgress(null); setLtReport(null); setLtError(null); setLtApplyMsg(null); setLoadedDocName(null); setDocError(null) }}>
                    <RefreshCcw className="mr-1.5 h-4 w-4" /> Limpiar
                  </Button>
                </div>

                {!hasPdfText && (
                  <p className="text-xs text-muted-foreground">
                    Consejo: carga un PDF en la página «Conversor» y podrás analizar su texto con un clic.
                  </p>
                )}

                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Herramienta de cribado, no prueba</AlertTitle>
                  <AlertDescription>
                    Este detector usa heurísticas estadísticas (no un modelo entrenado como el de
                    Turnitin). Produce una estimación para orientar la revisión: un porcentaje alto no
                    demuestra uso de IA y uno bajo no lo descarta. Se recomienda como apoyo, no como veredicto.
                  </AlertDescription>
                </Alert>

                {/* Segunda opinión con Grammarly */}
                <div className="rounded-xl border bg-gradient-to-br from-indigo-50 to-transparent p-4 dark:from-indigo-950/40">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                      <SpellCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="font-semibold">Tercera opinión: Grammarly (opcional, con tu cuenta)</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          El análisis de gramática y estilo ya se ejecuta automáticamente para todos los
                          usuarios con LanguageTool. Si además tienes cuenta Grammarly Premium, puedes ver
                          sus sugerencias sobre el mismo texto con la extensión del navegador.
                        </p>
                      </div>
                      <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                        <li>
                          Instala la{' '}
                          <a
                            href="https://www.grammarly.com/browser-extension"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-400"
                          >
                            extensión de Grammarly
                          </a>{' '}
                          para tu navegador e inicia sesión con tu cuenta premium.
                        </li>
                        <li>
                          Vuelve a esta pestaña: Grammarly revisará el texto del área de análisis en tiempo
                          real (subrayados de gramática, claridad y tono), junto a nuestro análisis de IA.
                        </li>
                        <li>
                          Para el informe de originalidad, copia el texto en el comprobador de plagio de
                          Grammarly (botón de abajo).
                        </li>
                      </ol>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button variant="outline" size="sm" asChild>
                          <a href="https://app.grammarly.com/" target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir Grammarly
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href="https://www.grammarly.com/plagiarism-checker"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Comprobar plagio
                          </a>
                        </Button>
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Nota: Grammarly descontinuó su SDK para desarrolladores en enero de 2024, por lo
                        que ya no es posible integrarlo automáticamente dentro de aplicaciones de
                        terceros. La extensión del navegador con tu sesión premium es la vía oficial
                        para usarlo aquí.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progreso del análisis oración por oración */}
                {analyzing && sentProgress && (
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <p className="flex items-center gap-2 font-medium">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Analizando oración {sentProgress.done} de {sentProgress.total}…
                      </p>
                      {sentProgress.total > 30 && (
                        <Button variant="ghost" size="sm" onClick={() => (skipAnimRef.current = true)}>
                          Mostrar todo
                        </Button>
                      )}
                    </div>
                    <Progress
                      value={sentProgress.total ? (sentProgress.done / sentProgress.total) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                )}

                {/* Veredicto global: primero, visible sin bajar */}
                {report && (
                  <Collapsible
                    open={openVerdict}
                    onOpenChange={setOpenVerdict}
                    className="rounded-xl border"
                  >
                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-4 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Veredicto global
                        </h3>
                        <Badge className={uniAIBadge(report.overallScore)}>{report.overallScore}% · {uniAIText(report.overallScore)}</Badge>
                      </div>
                      <ChevronDown
                        className={cn('h-4 w-4 shrink-0 transition-transform', openVerdict && 'rotate-180')}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                        <div className="text-center">
                          <p className={`text-5xl font-extrabold ${uniAIColor(report.overallScore)}`}>
                            {report.overallScore}%
                          </p>
                          <p className="mt-1 text-sm font-medium">probabilidad de IA</p>
                          <Badge className={`mt-2 ${uniAIBadge(report.overallScore)}`}>
                            {uniAIText(report.overallScore)}
                          </Badge>
                        </div>
                        <div className="w-full flex-1 space-y-2">
                          <Progress
                            value={report.overallScore}
                            className={cn('h-3', report.overallScore > UNI_AI_MAX && '[&>div]:bg-red-500')}
                          />
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>{report.wordCount.toLocaleString('es')} palabras analizadas</span>
                            <span>
                              fiabilidad:{' '}
                              <span className="font-medium">
                                {report.confidence === 'alta' ? 'alta' : report.confidence === 'media' ? 'media' : 'baja'}
                              </span>
                            </span>
                            <span>{report.segments.length} segmentos analizados</span>
                          </div>
                          <p
                            className={cn(
                              'flex items-start gap-1.5 text-xs font-medium',
                              report.overallScore <= UNI_AI_MAX ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {report.overallScore <= UNI_AI_MAX ? (
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            )}
                            Criterio universitario configurado: máximo {UNI_AI_MAX}% de IA en el texto.
                          </p>
                          {report.warnings.map((w, i) => (
                            <p key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
                            </p>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Detalle oración por oración (plegable) */}
                {sentences.length > 0 && (
                  <Collapsible
                    open={openSentences}
                    onOpenChange={setOpenSentences}
                    className="rounded-xl border"
                  >
                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-4 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Análisis oración por oración
                        </h3>
                        <Badge variant="secondary">
                          {sentences.filter((s) => s.flags.length > 0).length} de {sentences.length} con señales
                        </Badge>
                      </div>
                      <ChevronDown
                        className={cn('h-4 w-4 shrink-0 transition-transform', openSentences && 'rotate-180')}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div ref={sentListRef} className="h-96 overflow-y-auto rounded-lg border">
                        <div className="divide-y">
                          {sentences.map((s) => (
                            <div key={s.index} className="flex gap-3 p-3">
                              <div className={`w-1 shrink-0 rounded-full ${LABEL_BAR[s.label]}`} />
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className={LABEL_BADGE[s.label]}>{s.score}% IA</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    #{s.index} · {s.words} palabras
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                  {s.text.length > 320 ? s.text.slice(0, 320) + '…' : s.text}
                                </p>
                                {s.flags.length > 0 && (
                                  <ul className="list-inside list-disc text-xs text-muted-foreground">
                                    {s.flags.map((f, i) => (
                                      <li key={i}>{f}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Resultados */}
                {report && (
                  <div className="space-y-6 pt-2">
                    <Separator />

                    {/* Segunda opinión automática: gramática y estilo (LanguageTool, plegable) */}
                    {(ltLoading || ltReport || ltError) && (
                      <Collapsible
                        open={openGrammar}
                        onOpenChange={setOpenGrammar}
                        className="rounded-xl border"
                      >
                        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-4 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              Gramática y estilo (automático)
                            </h3>
                            {ltReport && (
                              <Badge variant="secondary" className="gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                {ltReport.issues.length} sugerencias
                                {ltReport.languageName && ` · ${ltReport.languageName}`}
                              </Badge>
                            )}
                          </div>
                          <ChevronDown
                            className={cn('h-4 w-4 shrink-0 transition-transform', openGrammar && 'rotate-180')}
                          />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 px-4 pb-4">

                        {ltLoading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            Revisando ortografía, gramática, puntuación y estilo…
                          </div>
                        )}

                        {ltError && (
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm text-destructive">{ltError}</p>
                            <Button variant="outline" size="sm" onClick={() => runGrammarCheck(detectText.trim())}>
                              Reintentar
                            </Button>
                          </div>
                        )}

                        {ltReport && (
                          <>
                            {ltReport.issues.length === 0 ? (
                              <p className="text-sm text-green-700 dark:text-green-400">
                                Sin problemas de escritura detectados por LanguageTool.
                              </p>
                            ) : (
                              <>
                                <div className="flex flex-wrap gap-2">
                                  {ltReport.counts.map((c) => (
                                    <Badge key={c.category} className={categoryBadgeClass(c.category)}>
                                      {c.category}: {c.count}
                                    </Badge>
                                  ))}
                                </div>
                                <ScrollArea className="h-64 rounded-lg border">
                                  <div className="divide-y">
                                    {ltReport.issues.map((issue, i) => (
                                      <div key={i} className="space-y-1 p-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge className={categoryBadgeClass(issue.category)}>
                                            {issue.category}
                                          </Badge>
                                          <p className="text-sm font-medium">{issue.short || issue.message}</p>
                                          {issue.replacement && (
                                            <Badge variant="outline" className="font-mono">
                                              → {issue.replacement}
                                            </Badge>
                                          )}
                                        </div>
                                        {issue.short && (
                                          <p className="text-xs text-muted-foreground">{issue.message}</p>
                                        )}
                                        {issue.sentence && (
                                          <p className="text-xs italic leading-relaxed text-muted-foreground">
                                            {issue.sentence.length > 180
                                              ? issue.sentence.slice(0, 180) + '…'
                                              : issue.sentence}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </>
                            )}
                            {ltReport.issues.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={applyLtFixes}
                                  disabled={ltApplying}
                                >
                                  {ltApplying ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Wrench className="mr-1.5 h-3.5 w-3.5" />
                                  )}
                                  Aplicar correcciones de ortografía y concordancia al texto
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {
                                    ltReport.issues.filter(
                                      (i) => i.replacement && i.offset >= 0 && isAutoFixable(i)
                                    ).length
                                  }{' '}
                                  correcciones disponibles
                                </span>
                              </div>
                            )}
                            {ltApplyMsg && (
                              <p className="flex items-start gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {ltApplyMsg}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                              Revisión automática con LanguageTool (motor de código abierto). Funciona para
                              cualquier usuario sin cuentas ni extensiones.
                            </p>
                          </>
                        )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Métricas */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Señales analizadas
                      </h3>
                      {report.metrics.map((m) => (
                        <div key={m.key} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-muted-foreground">
                              señal de IA: {m.aiScore}/100
                            </span>
                          </div>
                          <Progress value={m.aiScore} className="h-2" />
                          <p className="text-xs text-muted-foreground">{m.detail}</p>
                        </div>
                      ))}
                    </div>

                    {/* Opciones para acomodar el texto */}
                    <div className="space-y-3 rounded-xl border p-4">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Opciones para acomodar el texto
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Marca qué señales altas quieres corregir: se aplican al texto y se vuelve a
                        analizar al instante para ver cuánto baja la puntuación. El detector no se
                        toca — baja porque el texto cambia de verdad.
                      </p>
                      <div className="space-y-2">
                        {report.metrics
                          .filter((m) => SIGNAL_FIX[m.key])
                          .map((m) => (
                            <div key={m.key} className="flex items-start gap-2.5">
                              <Checkbox
                                id={`fix-${m.key}`}
                                checked={fixSel[m.key] === true}
                                onCheckedChange={(v) =>
                                  setFixSel((p) => ({ ...p, [m.key]: v === true }))
                                }
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <label htmlFor={`fix-${m.key}`} className="cursor-pointer text-sm font-medium">
                                  {SIGNAL_FIX[m.key].label}{' '}
                                  <Badge
                                    className={
                                      m.aiScore >= 60
                                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    }
                                  >
                                    {m.aiScore}%
                                  </Badge>
                                </label>
                                <p className="text-xs text-muted-foreground">{SIGNAL_FIX[m.key].desc}</p>
                              </div>
                            </div>
                          ))}
                        {report.metrics.some((m) => m.key === 'generic' && m.aiScore >= 45) && (
                          <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Escritura genérica ({report.metrics.find((m) => m.key === 'generic')?.aiScore}%):
                            agrégale al texto cifras, fechas, nombres propios o ejemplos concretos a
                            mano; eso no se puede automatizar sin inventar datos.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button size="sm" onClick={() => void applyFixesAndReanalyze()} disabled={analyzing}>
                          {analyzing ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Aplicar y volver a analizar
                        </Button>
                        {fixMsg && <span className="text-xs text-muted-foreground">{fixMsg}</span>}
                      </div>
                    </div>

                    {/* Segmentos */}
                    {report.segments.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Análisis por segmento (ventanas solapadas, como Turnitin)
                        </h3>
                        <ScrollArea className="h-80 rounded-lg border">
                          <div className="divide-y">
                            {report.segments.map((seg) => (
                              <div key={seg.index} className="flex gap-3 p-3">
                                <div className={`w-1 shrink-0 rounded-full ${LABEL_BAR[seg.label]}`} />
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={LABEL_BADGE[seg.label]}>
                                      {seg.score}% · {LABEL_TEXT[seg.label]}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Segmento {seg.index} · {seg.words} palabras
                                    </span>
                                  </div>
                                  <p className="text-xs leading-relaxed text-muted-foreground">
                                    {seg.preview}
                                  </p>
                                  {seg.reasons.length > 0 && (
                                    <ul className="list-inside list-disc text-xs text-muted-foreground">
                                      {seg.reasons.map((r, i) => (
                                        <li key={i}>{r}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          {/* ═══════════════ Humanizador (mismo apartado) ═══════════════ */}
            <Card className="card-accent mb-6 border-violet-200/60 dark:border-violet-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#8b5cf6,#d946ef)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wand2 className="h-5 w-5 text-violet-600" />
                  Humanizador y parafraseo
                </CardTitle>
                <CardDescription>
                  Reescribe el texto para reducir los patrones que detecta la IA: con reglas locales,
                  con la IA integrada de la app (automática, sin configuración) o parafraseando por
                  otro idioma. Muestra la puntuación antes y después.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Úsalo con criterio académico</AlertTitle>
                  <AlertDescription>
                    Estas herramientas ayudan a mejorar tu propia redacción. Para trabajos universitarios,
                    la versión final debe reflejar tu análisis y tus palabras; muchas instituciones
                    consideran fraude presentar texto generado o disfrazado de IA como propio.
                  </AlertDescription>
                </Alert>

                {detectText.trim() ? (
                  <p className="text-sm text-muted-foreground">
                    Fuente: texto del detector ({detectText.trim().split(/\s+/).length.toLocaleString('es')} palabras
                    {loadedDocName ? ` · ${loadedDocName}` : ''}).
                  </p>
                ) : (
                  <p className="text-sm text-amber-600">
                    Primero carga o pega un texto en la pestaña «Detector IA».
                  </p>
                )}

                <RadioGroup value={humMode} onValueChange={(v) => setHumMode(v as 'rules' | 'paraphrase' | 'ia')}>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <RadioGroupItem value="rules" id="h-rules" className="mt-1" />
                    <div>
                      <Label htmlFor="h-rules" className="font-medium">Humanización rápida (reglas locales)</Label>
                      <p className="text-sm text-muted-foreground">
                        Sustituye frases típicas de IA, aplica sinónimos y varía el ritmo. Instantáneo, sin enviar nada.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <RadioGroupItem value="ia" id="h-ia" className="mt-1" />
                    <div>
                      <Label htmlFor="h-ia" className="font-medium">Humanización con IA (automático)</Label>
                      <p className="text-sm text-muted-foreground">
                        Envía el texto a la IA integrada de la app con el prompt maestro de humanización. La mejor
                        calidad: sin claves, sin configuración, listo para usar.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border p-3">
                    <RadioGroupItem value="paraphrase" id="h-para" className="mt-1" />
                    <div>
                      <Label htmlFor="h-para" className="font-medium">Parafraseo profundo (traducción de ida y vuelta)</Label>
                      <p className="text-sm text-muted-foreground">
                        Reescribe el texto viajando por otro idioma. Más intenso, pero puede alterar matices: revísalo.
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex flex-wrap items-center gap-4">
                  <Button onClick={() => void runHumanize()} disabled={humRunning || !detectText.trim()}>
                    {humRunning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {humRunning ? 'Procesando…' : 'Humanizar ahora'}
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hum-flagged"
                      checked={humFlaggedOnly}
                      onCheckedChange={(v) => setHumFlaggedOnly(v === true)}
                      disabled={sentences.length === 0 || humMode !== 'rules'}
                    />
                    <Label htmlFor="hum-flagged" className="text-sm">
                      Solo oraciones marcadas como IA por el detector
                    </Label>
                  </div>
                </div>

                {humProgress && humRunning && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> {humProgress}
                  </div>
                )}
                {humError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{humError}</AlertDescription>
                  </Alert>
                )}

                {humText && humBefore !== null && humAfter !== null && (
                  <div className="space-y-3 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium">Puntuación de IA estimada (criterio: ≤{UNI_AI_MAX}%):</p>
                      <Badge className={uniAIBadge(humBefore)}>
                        antes {humBefore}%
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge className={uniAIBadge(humAfter)}>
                        después {humAfter}%
                      </Badge>
                      {humAfter <= UNI_AI_MAX && humBefore > UNI_AI_MAX && (
                        <Badge className={cn(LABEL_BADGE.humano, 'gap-1')}>
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> ahora dentro del criterio universitario
                        </Badge>
                      )}
                      {humAfter < humBefore && !(humAfter <= UNI_AI_MAX && humBefore > UNI_AI_MAX) && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> reducción de {humBefore - humAfter} puntos
                        </Badge>
                      )}
                    </div>
                    {humTruncated && (
                      <p className="text-xs text-amber-600">
                        La respuesta llegó cortada por el límite de longitud: humaniza el texto por partes.
                      </p>
                    )}
                    <Textarea value={humText} onChange={(e) => setHumText(e.target.value)} className="min-h-52 leading-relaxed" />
                    {humChanges && (
                      <details className="rounded-lg border bg-muted/30 px-3 py-2">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                          Ver qué cambió la IA
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                          {humChanges}
                        </p>
                      </details>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(humText)
                        }}
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadBlob(new Blob([humText], { type: 'text/plain;charset=utf-8' }), 'texto_humanizado.txt')
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
                              [{ page: 1, text: humText }],
                              null,
                              'convert',
                              'Texto humanizado',
                              false,
                              `Puntuación de IA estimada: ${humBefore}% → ${humAfter}% · Procesado con el humanizador`
                            )
                            downloadBlob(blob, 'texto_humanizado.docx')
                          })()
                        }}
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" /> Descargar Word (.docx)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDetectText(humText)
                          setReport(null)
                          setSentences([])
                          setSentProgress(null)
                          setLoadedDocName(null)
                        }}
                      >
                        <ScanLine className="mr-1.5 h-3.5 w-3.5" /> Re-analizar en Detector IA
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Estimación calculada con este mismo detector. Verifica siempre el texto final y,
                      si tu institución usa Turnitin o similar, contrasta allí también.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

    </PageShell>
  )
}
