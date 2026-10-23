import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  FileUp,
  Languages,
  Loader2,
  RefreshCcw,
  XCircle,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { extractPages, countChars, countWords, type PdfPage } from '@/lib/pdf'
import { translatePages, type TranslateResult } from '@/lib/translate'
import { buildDocx, downloadBlob, type DocMode } from '@/lib/docx'
import { AUTO, LANGUAGES } from '@/lib/languages'
import PageShell from '@/components/PageShell'
import { K_PDF_TEXT } from '@/lib/pageShared'

type Stage = 'idle' | 'extracting' | 'ready' | 'processing' | 'done' | 'error'

const MODE_LABEL: Record<DocMode, string> = {
  convert: 'convertido (sin traducir)',
  translate: 'traducido',
  bilingual: 'bilingüe',
}

export default function ConversorPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PdfPage[]>([])
  const [translatedPages, setTranslatedPages] = useState<PdfPage[] | null>(null)
  const [mode, setMode] = useState<DocMode>('translate')
  const [source, setSource] = useState('auto')
  const [target, setTarget] = useState('en')
  const [withHeadings, setWithHeadings] = useState(true)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [progressLabel, setProgressLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [detected, setDetected] = useState<string | null>(null)
  const [doneInfo, setDoneInfo] = useState<{ mode: DocMode; filename: string } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // comparte el texto extraído con la página del detector
  useEffect(() => {
    sessionStorage.setItem(K_PDF_TEXT, pages.map((p) => p.text).join('\n\n'))
  }, [pages])

  const stats = useMemo(
    () => ({ words: countWords(pages), chars: countChars(pages), pages: pages.length }),
    [pages]
  )

  const emptyPages = pages.length > 0 && stats.chars === 0

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setFile(null)
    setPages([])
    setTranslatedPages(null)
    setStage('idle')
    setError(null)
    setProgress(null)
    setDetected(null)
    setDoneInfo(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('El archivo debe ser un PDF.')
      return
    }
    setError(null)
    setDetected(null)
    setDoneInfo(null)
    setFile(f)
    setStage('extracting')
    setProgressLabel('Leyendo y extrayendo el texto del PDF…')
    setProgress(null)
    try {
      const extracted = await extractPages(f, (done, total) => setProgress({ done, total }))
      setPages(extracted)
      setStage('ready')
    } catch (e) {
      setError('No se pudo leer el PDF. ¿Está dañado o protegido con contraseña?')
      setFile(null)
      setStage('idle')
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files?.[0]
      if (f) void handleFile(f)
    },
    [handleFile]
  )

  const generate = useCallback(async () => {
    if (!file || pages.length === 0) return
    setError(null)
    setDoneInfo(null)
    setDetected(null)
    abortRef.current = new AbortController()

    try {
      let translated: TranslateResult | null = null

      if (mode !== 'convert') {
        if (source !== 'auto' && source === target) {
          throw new Error('El idioma de origen y de destino son iguales. Cambia uno de los dos.')
        }
        setStage('processing')
        setProgressLabel('Traduciendo el texto…')
        setProgress({ done: 0, total: 1 })
        translated = await translatePages(
          pages,
          source,
          target,
          (done, total) => setProgress({ done, total }),
          abortRef.current.signal
        )
        if (translated.detectedSource) setDetected(translated.detectedSource)
        setTranslatedPages(translated.pages)
      } else {
        setStage('processing')
        setProgressLabel('Generando el documento Word…')
        setProgress(null)
      }

      setProgressLabel('Generando el documento Word (.docx)…')
      const langName = LANGUAGES.find((l) => l.code === target)?.name ?? target
      const footerNote =
        mode === 'convert'
          ? 'Convertido de PDF a Word'
          : mode === 'translate'
            ? `Traducido al ${langName} con traducción automática`
            : `Documento bilingüe · traducción al ${langName} en cursiva`

      const blob = await buildDocx(
        pages,
        translated?.pages ?? null,
        mode,
        file.name.replace(/\.pdf$/i, ''),
        withHeadings,
        footerNote
      )
      const outName = `${file.name.replace(/\.pdf$/i, '')}_${MODE_LABEL[mode].split(' ')[0]}.docx`
      downloadBlob(blob, outName)
      setDoneInfo({ mode, filename: outName })
      setStage('done')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setStage('ready')
      } else {
        console.error(e)
        setError(
          e instanceof Error
            ? e.message
            : 'Ocurrió un error durante el proceso. Inténtalo de nuevo.'
        )
        setStage('ready')
      }
    } finally {
      setProgress(null)
      setProgressLabel('')
    }
  }, [file, pages, mode, source, target, withHeadings])

  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <PageShell>
        {/* Paso 1: archivo */}
        <Card className="card-accent mb-6 border-sky-200/60 dark:border-sky-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#0ea5e9,#22d3ee)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                1
              </span>
              Sube tu PDF
            </CardTitle>
            <CardDescription>Arrastra el archivo aquí o haz clic para seleccionarlo.</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => stage === 'idle' || stage === 'ready' || stage === 'done' ? inputRef.current?.click() : undefined}
              onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40'
              } ${stage === 'extracting' || stage === 'processing' ? 'pointer-events-none opacity-60' : ''}`}
            >
              {stage === 'extracting' ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-medium">Extrayendo texto…</p>
                </>
              ) : file ? (
                <>
                  <FileText className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · {stats.pages} página
                      {stats.pages === 1 ? '' : 's'} · {stats.words.toLocaleString('es')} palabras ·{' '}
                      {stats.chars.toLocaleString('es')} caracteres
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Texto extraído
                    </Badge>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); reset() }}>
                      <RefreshCcw className="mr-1.5 h-3.5 w-3.5" /> Cambiar archivo
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <FileUp className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Arrastra tu PDF aquí</p>
                  <p className="text-sm text-muted-foreground">o haz clic para explorar tus archivos</p>
                </>
              )}
            </div>

            {emptyPages && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No se encontró texto</AlertTitle>
                <AlertDescription>
                  Este PDF parece ser una imagen escaneada. Las páginas escaneadas necesitan
                  reconocimiento óptico de caracteres (OCR), que esta herramienta no incluye.
                </AlertDescription>
              </Alert>
            )}

            {stage === 'ready' && pages.length > 0 && !emptyPages && (
              <div className="mt-4">
                <Label className="mb-2 block text-sm font-medium">Vista previa del texto extraído</Label>
                <ScrollArea className="h-44 rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
                  {pages[0].text.slice(0, 4000) || '(página vacía)'}
                  {stats.chars > 4000 ? '\n\n…' : ''}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paso 2: opciones */}
        {stage === 'ready' && pages.length > 0 && !emptyPages && (
          <Card className="card-accent mb-6 border-sky-200/60 dark:border-sky-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#0ea5e9,#22d3ee)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                  2
                </span>
                Elige las opciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as DocMode)}>
                <div className="flex items-start space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value="convert" id="m-convert" className="mt-1" />
                  <div>
                    <Label htmlFor="m-convert" className="font-medium">Solo convertir a Word</Label>
                    <p className="text-sm text-muted-foreground">
                      Extrae el texto tal cual y lo guarda en un .docx editable.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value="translate" id="m-translate" className="mt-1" />
                  <div>
                    <Label htmlFor="m-translate" className="font-medium">Traducir a otro idioma</Label>
                    <p className="text-sm text-muted-foreground">
                      El documento Word contendrá únicamente el texto traducido.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value="bilingual" id="m-bilingual" className="mt-1" />
                  <div>
                    <Label htmlFor="m-bilingual" className="font-medium">Documento bilingüe</Label>
                    <p className="text-sm text-muted-foreground">
                      Cada párrafo original va seguido de su traducción en cursiva.
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {mode !== 'convert' && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Idioma de origen</Label>
                      <Select value={source} onValueChange={setSource}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AUTO.code}>{AUTO.name}</SelectItem>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Idioma de destino</Label>
                      <Select value={target} onValueChange={setTarget}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="headings"
                  checked={withHeadings}
                  onCheckedChange={(v) => setWithHeadings(v === true)}
                />
                <Label htmlFor="headings" className="text-sm">
                  Incluir encabezados «Página N» entre secciones
                </Label>
              </div>

              <Button size="lg" className="w-full" onClick={() => void generate()}>
                <Languages className="mr-2 h-5 w-5" />
                {mode === 'convert' ? 'Generar documento Word' : 'Traducir y generar Word'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progreso */}
        {stage === 'processing' && (
          <Card className="card-accent mb-6 border-sky-200/60 dark:border-sky-900/40" style={{ ['--card-accent-gradient' as string]: 'linear-gradient(90deg,#0ea5e9,#22d3ee)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                <p className="font-medium">{progressLabel}</p>
              </div>
              {progress && (
                <div className="mt-4 space-y-1.5">
                  <Progress value={pct} />
                  <p className="text-right text-xs text-muted-foreground">
                    {progress.done.toLocaleString('es')} / {progress.total.toLocaleString('es')} · {pct}%
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => abortRef.current?.abort()}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Cancelar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && stage !== 'idle' && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {error && stage === 'idle' && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado */}
        {stage === 'done' && doneInfo && (
          <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <div>
                  <p className="text-lg font-semibold">¡Documento {MODE_LABEL[doneInfo.mode]} listo!</p>
                  <p className="text-sm text-muted-foreground">
                    Se descargó <span className="font-medium">{doneInfo.filename}</span>
                    {detected && (
                      <>
                        {' '}· idioma detectado:{' '}
                        <span className="font-medium">
                          {LANGUAGES.find((l) => l.code === detected)?.name ?? detected}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const txt =
                        doneInfo.mode !== 'convert' && translatedPages
                          ? translatedPages.map((p) => p.text).join('\n\n')
                          : pages.map((p) => p.text).join('\n\n')
                      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
                      downloadBlob(blob, doneInfo.filename.replace(/\.docx$/, '.txt'))
                    }}
                  >
                    <Download className="mr-1.5 h-4 w-4" /> También como .txt
                  </Button>
                  <Button onClick={reset}>
                    <RefreshCcw className="mr-1.5 h-4 w-4" /> Convertir otro PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

    </PageShell>
  )
}
