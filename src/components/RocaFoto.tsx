import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/* Foto de muestra de cada roca identificada (Wikimedia Commons, licencia
   libre), descargadas en public/rocas/ con scripts/descargar_rocas.py.
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
  const slug = FOTOS[id]
  if (!slug) return null
  const src = `/rocas/${slug}.jpg`
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{nombre}</DialogTitle>
            <DialogDescription>
              Muestra de mano de referencia. Foto: Wikimedia Commons (licencia libre).
            </DialogDescription>
          </DialogHeader>
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
