import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/* Rocas con fotografía micro (lámina delgada) extraída de la Guía de
   rocas del Museo de Ciencias Naturales de Barcelona (macro y micro). */
const MICRO: Record<string, string> = {
  granito: 'granito',
  gabro: 'gabro',
  peridotita: 'peridotita',
  basalto: 'basalto',
  riolita: 'riolita',
  obsidiana: 'obsidiana',
  pumita: 'pumita',
  conglomerado: 'conglomerado',
  cuarzoarenita: 'cuarzoarenita',
  lutita: 'lutita',
  yeso: 'yeso',
  sal: 'sal',
  'carbon-bituminoso': 'carbon-bituminoso',
  pizarra: 'pizarra',
  filita: 'filita',
  esquisto: 'esquisto',
  gneis: 'gneis',
  corneana: 'corneana',
  marmol: 'marmol',
  cuarcita: 'cuarcita',
}

/* Foto de muestra de cada roca identificada. Las 21 rocas con macro de la
   Guía (Museo de Ciencias Naturales de Barcelona) usan esa foto; el resto
   conserva Wikimedia Commons (licencia libre).
   Clave = id de la candidata en los árboles de decisión. */
const FOTOS: Record<string, string> = {
  // Ígneas
  toba: 'toba',
  'brecha-volcanica': 'brecha-volcanica',
  obsidiana: 'obsidiana',
  pumita: 'pumita',
  granito: 'granito',
  riolita: 'riolita',
  diorita: 'diorita',
  andesita: 'andesita',
  gabro: 'gabro',
  basalto: 'basalto',
  peridotita: 'peridotita',
  komatiita: 'komatiita',
  // Sedimentarias
  conglomerado: 'conglomerado',
  brecha: 'brecha',
  cuarzoarenita: 'cuarzoarenita',
  arcosa: 'arcosa',
  grauvaca: 'grauvaca',
  limolita: 'limolita',
  'roca-arcilla': 'roca-arcilla',
  lutita: 'lutita',
  turba: 'turba',
  'carbon-bituminoso': 'carbon-bituminoso',
  dolostona: 'dolostona',
  calcidurita: 'calcidurita',
  calcarenita: 'calcarenita',
  micrita: 'micrita',
  coquina: 'coquina',
  tiza: 'tiza',
  tufo: 'tufo',
  'caliza-olitica': 'caliza-olitica',
  chert: 'chert',
  sal: 'sal',
  yeso: 'yeso',
  hierro: 'hierro',
  // Metamórficas
  pizarra: 'pizarra',
  filita: 'filita',
  esquisto: 'esquisto',
  gneis: 'gneis',
  antracita: 'antracita',
  corneana: 'corneana',
  serpentina: 'serpentina',
  esteatita: 'esteatita',
  cuarcita: 'cuarcita',
  marmol: 'marmol',
  metaconglomerado: 'metaconglomerado',
}

/** Foto de la roca identificada con vista ampliada al hacer clic. */
export default function RocaFoto({ id, nombre }: { id: string; nombre: string }) {
  const [open, setOpen] = useState(false)
  const [vista, setVista] = useState<'macro' | 'micro'>('macro')
  const slug = FOTOS[id]
  if (!slug) return null
  const microSlug = MICRO[id]
  const src = vista === 'micro' && microSlug ? `/rocas/micro/${microSlug}.jpg` : `/rocas/${slug}.jpg`
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Ver foto de ${nombre}`}
        className="mx-auto block overflow-hidden rounded-lg border shadow-sm transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={src}
          alt={`Muestra de ${nombre}`}
          loading="lazy"
          className="max-h-52 w-auto object-cover"
        />
      </button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (o) setVista('macro')
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{nombre}</DialogTitle>
            <DialogDescription>
              {vista === 'micro'
                ? 'Lámina delgada vista al microscopio (foto micro). Fuente: Guía de rocas, Museo de Ciencias Naturales de Barcelona.'
                : microSlug
                  ? 'Muestra de mano de referencia (foto macro). Fuente: Guía de rocas, Museo de Ciencias Naturales de Barcelona.'
                  : 'Muestra de mano de referencia. Foto: Wikimedia Commons (licencia libre).'}
            </DialogDescription>
          </DialogHeader>
          {microSlug && (
            <div className="mb-3 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setVista('macro')}
                className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                  vista === 'macro' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                }`}
              >
                🔍 Macro (mano)
              </button>
              <button
                type="button"
                onClick={() => setVista('micro')}
                className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                  vista === 'micro' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                }`}
              >
                🔬 Micro (lámina)
              </button>
            </div>
          )}
          <img
            src={src}
            alt={`Muestra ampliada de ${nombre}`}
            className="mx-auto max-h-[65vh] w-auto rounded-lg border object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
