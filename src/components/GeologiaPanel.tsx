import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { Mountain } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import IdentificaIgneas from '@/components/IdentificaIgneas'
import IdentificaSedimentarias from '@/components/IdentificaSedimentarias'
import IdentificaMetamorficas from '@/components/IdentificaMetamorficas'
import { qapfName, qflName, ultramaficaName, VOLCANIC_EQ } from '@/lib/clasificacion'

/* ═══════════════════════════════════════════════════════════════════
   Diagramas interactivos de clasificación de rocas
   · Ígneas:
       - QAPF de Streckeisen (plutónicas y volcánicas)
       - Rocas ultramáficas (Ol–Opx–Cpx)
       - Diagrama TAS (Total Alkali vs. Silica)
   · Sedimentarias:
       - Detríticas: escala de Wentworth, triángulo QFL y triángulo de Picard
       - Carbonatadas: Folk y Dunham
       - Químicas no carbonatadas: secuencia evaporítica y texturas de sílice
       - Orgánicas: grado de carbonificación (madurez del carbón)
   · Metamórficas: cuadrícula composición × grado de metamorfismo
   Los nombres son aproximados (límites simplificados de los campos).
   ═══════════════════════════════════════════════════════════════════ */

type V2 = { x: number; y: number }

/** Coordenadas baricéntricas dentro de un triángulo */
function bary(p1: V2, p2: V2, p3: V2, w1: number, w2: number, w3: number): V2 {
  return {
    x: w1 * p1.x + w2 * p2.x + w3 * p3.x,
    y: w1 * p1.y + w2 * p2.y + w3 * p3.y,
  }
}

/** Convierte un clic sobre un SVG a coordenadas de su viewBox */
function svgClick(e: ReactMouseEvent<SVGSVGElement>): V2 {
  const svg = e.currentTarget
  const p = new DOMPoint(e.clientX, e.clientY)
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const v = p.matrixTransform(ctm.inverse())
  return { x: v.x, y: v.y }
}

/** Pesos baricéntricos de un punto respecto a un triángulo (v1, v2, v3) */
function baryWeights(pt: V2, v1: V2, v2: V2, v3: V2): [number, number, number] {
  const det = (v2.y - v3.y) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y)
  if (Math.abs(det) < 1e-9) return [1 / 3, 1 / 3, 1 / 3]
  const w1 = ((v2.y - v3.y) * (pt.x - v3.x) + (v3.x - v2.x) * (pt.y - v3.y)) / det
  const w2 = ((v3.y - v1.y) * (pt.x - v3.x) + (v1.x - v3.x) * (pt.y - v3.y)) / det
  return [w1, w2, 1 - w1 - w2]
}

/** Recorta un punto cualquiera al interior (o borde) de un triángulo */
function clampTriangle(pt: V2, v1: V2, v2: V2, v3: V2): V2 {
  const [w1, w2, w3] = baryWeights(pt, v1, v2, v3)
  const c1 = Math.max(0, w1)
  const c2 = Math.max(0, w2)
  const c3 = Math.max(0, w3)
  const s = c1 + c2 + c3 || 1
  return { x: (c1 * v1.x + c2 * v2.x + c3 * v3.x) / s, y: (c1 * v1.y + c2 * v2.y + c3 * v3.y) / s }
}

/** Redondea un peso baricéntrico a porcentaje entero 0–100 */
const asPct = (w: number) => Math.max(0, Math.min(100, Math.round(w * 100)))

/* ─────────────────────────── QAPF (Streckeisen) ─────────────────────────── */

// Vértices del rombo QAPF
const VQ: V2 = { x: 50, y: 6 }
const VF: V2 = { x: 50, y: 106 }
const VA: V2 = { x: 6, y: 56 }
const VP: V2 = { x: 94, y: 56 }

/** Punto en el triángulo QAP (F = 0) o FAP (F > 0) */
function qapfPoint(q: number, a: number, p: number, f: number): { pt: V2; usesF: boolean } {
  if (f > 0 && a + p + f > 0) {
    const t = a + p + f
    return { pt: bary(VF, VA, VP, f / t, a / t, p / t), usesF: true }
  }
  const t = q + a + p || 1
  return { pt: bary(VQ, VA, VP, q / t, a / t, p / t), usesF: false }
}



/** Línea paralela a la base a una fracción dada desde el ápice */
function apexLine(apex: V2, left: V2, right: V2, frac: number): string {
  const l = { x: apex.x + frac * (left.x - apex.x), y: apex.y + frac * (left.y - apex.y) }
  const r = { x: apex.x + frac * (right.x - apex.x), y: apex.y + frac * (right.y - apex.y) }
  return `${l.x},${l.y} ${r.x},${r.y}`
}

/** Línea desde el ápice hasta un % de la base (de A a P) */
function radialLine(apex: V2, left: V2, right: V2, basePct: number): string {
  const b = { x: left.x + (basePct / 100) * (right.x - left.x), y: left.y }
  return `${apex.x},${apex.y} ${b.x},${b.y}`
}

function QapfDiagram() {
  const [q, setQ] = useState(30)
  const [a, setA] = useState(40)
  const [p, setP] = useState(30)
  const [f, setF] = useState(0)
  const [tipo, setTipo] = useState<'plutonica' | 'volcanica'>('plutonica')

  const { pt, usesF } = useMemo(() => qapfPoint(q, a, p, f), [q, a, p, f])
  const namePlutonica = useMemo(() => qapfName(q, a, p, f), [q, a, p, f])
  const name = tipo === 'volcanica' ? (VOLCANIC_EQ[namePlutonica] ?? namePlutonica) : namePlutonica
  const total = q + a + p + f

  const sliders: Array<{ label: string; value: number; set: (v: number) => void; color: string }> = [
    // Cuarzo y feldespatoides no coexisten en equilibrio: subir uno pone el otro a 0
    { label: 'Q · Cuarzo', value: q, set: (v) => { setQ(v); if (v > 0) setF(0) }, color: 'bg-amber-500' },
    { label: 'A · Feldespato alcalino', value: a, set: setA, color: 'bg-rose-500' },
    { label: 'P · Plagioclasa', value: p, set: setP, color: 'bg-sky-500' },
    { label: 'F · Feldespatoide', value: f, set: (v) => { setF(v); if (v > 0) setQ(0) }, color: 'bg-violet-500' },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <svg
          viewBox="0 0 100 112"
          className="w-full max-w-sm cursor-pointer"
          onClick={(e) => {
            const raw = svgClick(e)
            if (raw.y < VA.y) {
              const p = clampTriangle(raw, VQ, VA, VP)
              const [wq, wa, wp] = baryWeights(p, VQ, VA, VP)
              setQ(asPct(wq)); setA(asPct(wa)); setP(asPct(wp)); setF(0)
            } else {
              const p = clampTriangle(raw, VF, VA, VP)
              const [wf, wa, wp] = baryWeights(p, VF, VA, VP)
              setF(asPct(wf)); setA(asPct(wa)); setP(asPct(wp)); setQ(0)
            }
          }}
        >
          {/* Rombo Q-A-F-P */}
          <polygon points={`${VQ.x},${VQ.y} ${VA.x},${VA.y} ${VF.x},${VF.y} ${VP.x},${VP.y}`} fill="white" stroke="#64748b" strokeWidth="0.6" />
          {/* Línea media A-P */}
          <line x1={VA.x} y1={VA.y} x2={VP.x} y2={VP.y} stroke="#64748b" strokeWidth="0.4" />
          {/* Rejilla triángulo superior (QAP): Q = 90, 60, 20 y 5.
              apexLine usa la distancia desde el ápice: Q = 60 → fracción 0.4 */}
          {[90, 60, 20, 5].map((qv) => {
            const [x1, y1, x2, y2] = apexLine(VQ, VA, VP, 1 - qv / 100).split(/[ ,]/)
            return <line key={qv} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          })}
          {/* Radiantes A/(A+P) = 10, 35, 65, 90 */}
          {[10, 35, 65, 90].map((pct) => {
            const [x1, y1, x2, y2] = radialLine(VQ, VA, VP, pct).split(/[ ,]/)
            return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          })}
          {/* Rejilla triángulo inferior (FAP): F = 60 y 10 */}
          {[60, 10].map((fv) => {
            const [x1, y1, x2, y2] = apexLine(VF, VA, VP, 1 - fv / 100).split(/[ ,]/)
            return <line key={fv} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e2e8f0" strokeWidth="0.3" strokeDasharray="1.5,1.5" />
          })}
          {[10, 35, 65, 90].map((pct) => {
            const [x1, y1, x2, y2] = radialLine(VF, VA, VP, pct).split(/[ ,]/)
            return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e2e8f0" strokeWidth="0.3" strokeDasharray="1.5,1.5" />
          })}
          {/* Etiquetas de vértices */}
          <text x={VQ.x} y={VQ.y - 2} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">Q</text>
          <text x={VA.x - 3} y={VA.y + 1} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">A</text>
          <text x={VP.x + 3} y={VP.y + 1} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">P</text>
          <text x={VF.x} y={VF.y + 5} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">F</text>
          <text x={VQ.x + 0.4 * (VP.x - VQ.x) + 1} y={VQ.y + 0.4 * (VP.y - VQ.y) + 1} fontSize="2.8" fill="#94a3b8">Q=60</text>
          <text x={VQ.x + 0.8 * (VP.x - VQ.x) + 1} y={VQ.y + 0.8 * (VP.y - VQ.y) + 1} fontSize="2.8" fill="#94a3b8">Q=20</text>
          {/* Punto interactivo */}
          <circle cx={pt.x} cy={pt.y} r="2.4" fill={usesF ? '#8b5cf6' : '#e11d48'} stroke="white" strokeWidth="0.5" style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }} />
        </svg>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Doble triángulo QAPF: si F {'>'} 0 el punto cae en el triángulo inferior (feldespatoides).
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(['plutonica', 'volcanica'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                tipo === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {t === 'plutonica' ? 'Rocas plutónicas (cristales visibles)' : 'Rocas volcánicas (grano fino / vítreas)'}
            </button>
          ))}
        </div>
        {sliders.map((s) => (
          <div key={s.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{s.label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={s.value}
                  onChange={(e) => s.set(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="h-7 w-16 text-right text-xs"
                />
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {total > 0 ? Math.round((s.value / total) * 100) : 0}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={s.value}
              onChange={(e) => s.set(Number(e.target.value))}
              className={`w-full accent-current ${s.color}`}
            />
          </div>
        ))}
        <div className="rounded-lg border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Roca resultante (aprox.):</p>
          <p className="text-lg font-semibold">{name}</p>
          <Badge variant="secondary" className="mt-1">
            QAPF · rocas {tipo === 'plutonica' ? 'plutónicas (cristales visibles)' : 'volcánicas (grano fino/vítreas)'} ·{' '}
            {usesF ? 'triángulo FAP (con feldespatoides)' : 'triángulo QAP (con cuarzo)'}
          </Badge>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Ígneas: rocas ultramáficas ─────────────────────────── */

const VOl: V2 = { x: 50, y: 8 } // Olivino
const VOpx: V2 = { x: 8, y: 92 } // Ortopiroxeno
const VCpx: V2 = { x: 92, y: 92 } // Clinopiroxeno


function UltramaficasDiagram() {
  const [ol, setOl] = useState(50)
  const [opx, setOpx] = useState(30)
  const [cpx, setCpx] = useState(20)
  const t = ol + opx + cpx || 1
  const name = ultramaficaName(ol, opx, cpx)
  const pt = bary(VOl, VOpx, VCpx, ol / t, opx / t, cpx / t)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <svg
          viewBox="0 0 100 108"
          className="w-full max-w-sm cursor-pointer"
          onClick={(e) => {
            const p = clampTriangle(svgClick(e), VOl, VOpx, VCpx)
            const [w1, w2, w3] = baryWeights(p, VOl, VOpx, VCpx)
            setOl(asPct(w1)); setOpx(asPct(w2)); setCpx(asPct(w3))
          }}
        >
          <polygon points={`${VOl.x},${VOl.y} ${VOpx.x},${VOpx.y} ${VCpx.x},${VCpx.y}`} fill="white" stroke="#64748b" strokeWidth="0.6" />
          {/* Rejilla: Ol = 90, 40 y 10 (fracción desde el ápice = 1 − Ol), radiantes Opx/Cpx */}
          {[90, 40, 10].map((ov) => {
            const [x1, y1, x2, y2] = apexLine(VOl, VOpx, VCpx, 1 - ov / 100).split(/[ ,]/)
            return <line key={ov} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          })}
          {[10, 90].map((pct) => {
            const [x1, y1, x2, y2] = radialLine(VOl, VOpx, VCpx, pct).split(/[ ,]/)
            return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          })}
          <text x={VOl.x} y={VOl.y - 2} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">Ol</text>
          <text x={VOpx.x - 4} y={VOpx.y + 4} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">Opx</text>
          <text x={VCpx.x + 5} y={VCpx.y + 4} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">Cpx</text>
          <text x={VOl.x + 0.1 * (VCpx.x - VOl.x) + 1} y={VOl.y + 0.1 * (VCpx.y - VOl.y) + 1} fontSize="2.8" fill="#94a3b8">Ol=90</text>
          <text x={VOl.x + 0.6 * (VCpx.x - VOl.x) + 1} y={VOl.y + 0.6 * (VCpx.y - VOl.y) + 1} fontSize="2.8" fill="#94a3b8">Ol=40</text>
          <text x={VOl.x + 0.9 * (VCpx.x - VOl.x) + 1} y={VOl.y + 0.9 * (VCpx.y - VOl.y) + 1} fontSize="2.8" fill="#94a3b8">Ol=10</text>
          {/* Punto interactivo */}
          <circle cx={pt.x} cy={pt.y} r="2.4" fill="#0d9488" stroke="white" strokeWidth="0.5" style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }} />
        </svg>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Para rocas con más del 90 % de minerales máficos el diagrama QAPF ya no sirve: se usa la
          proporción de olivino y piroxenos.
        </p>
      </div>
      <div className="space-y-3">
        <SliderRow label="Ol · Olivino" value={ol} total={t} onChange={setOl} color="bg-emerald-600" />
        <SliderRow label="Opx · Ortopiroxeno" value={opx} total={t} onChange={setOpx} color="bg-teal-600" />
        <SliderRow label="Cpx · Clinopiroxeno" value={cpx} total={t} onChange={setCpx} color="bg-cyan-600" />
        <NameBox
          caption="Roca ultramáfica resultante (aprox.):"
          name={name}
          badge="QAPF no aplica: >90 % de minerales máficos"
        />
      </div>
    </div>
  )
}

/* ─────────────────────────── Ígneas: diagrama TAS ─────────────────────────── */

const TAS_X0 = 8 // SiO2 40 % → x = 8
const TAS_X1 = 96 // SiO2 80 % → x = 96
const TAS_Y0 = 92 // álcalis 0 % → y = 92
const TAS_Y1 = 6 // álcalis 15 % → y = 6
const tasX = (sio2: number) => TAS_X0 + ((sio2 - 40) / 40) * (TAS_X1 - TAS_X0)
const tasY = (alk: number) => TAS_Y0 + (alk / 15) * (TAS_Y1 - TAS_Y0)
/** Línea de MacDonald: límite serie alcalina / subalcalina */
const tasLine = (sio2: number) => 0.37 * sio2 - 14.3

function tasName(sio2: number, alk: number): { name: string; serie: string } {
  const alcalina = alk > tasLine(sio2)
  // Subalcalina incluye las series toleítica y calcoalcalina (no se distinguen en el TAS)
  const serie = alcalina ? 'Serie alcalina' : 'Serie subalcalina'
  if (sio2 < 41) return { name: alcalina ? 'Foidita / Picrobasalto' : 'Picrobasalto', serie }
  if (sio2 < 45) return { name: alcalina ? 'Basanita / Tefrita' : 'Picrobasalto / Basalto', serie }
  if (sio2 < 52) return { name: alcalina ? 'Traquibasalto' : 'Basalto', serie }
  if (sio2 < 57) return { name: alcalina ? 'Traquiandesita basáltica' : 'Andesita basáltica', serie }
  if (sio2 < 63) return { name: alcalina ? 'Traquiandesita' : 'Andesita', serie }
  if (sio2 < 69) return { name: alcalina ? 'Traquita / Traquidacita' : 'Dacita', serie }
  return { name: alcalina ? 'Riolita alcalina (comendita–pantelerita)' : 'Riolita', serie }
}

function TasDiagram() {
  const [sio2, setSio2] = useState(60)
  const [alk, setAlk] = useState(4.5)
  const { name, serie } = tasName(sio2, alk)
  const alcalina = alk > tasLine(sio2)
  const px = tasX(sio2)
  const py = tasY(alk)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <svg
          viewBox="0 0 100 104"
          className="w-full max-w-sm cursor-pointer"
          onClick={(e) => {
            const p = svgClick(e)
            const s = 40 + ((p.x - TAS_X0) / (TAS_X1 - TAS_X0)) * 40
            const a = ((p.y - TAS_Y0) / (TAS_Y1 - TAS_Y0)) * 15
            setSio2(Math.round(Math.max(40, Math.min(80, s)) * 10) / 10)
            setAlk(Math.round(Math.max(0, Math.min(15, a)) * 10) / 10)
          }}
        >
          {/* Marco del plot */}
          <line x1={TAS_X0} y1={TAS_Y0} x2={TAS_X1} y2={TAS_Y0} stroke="#64748b" strokeWidth="0.6" />
          <line x1={TAS_X0} y1={TAS_Y0} x2={TAS_X0} y2={TAS_Y1} stroke="#64748b" strokeWidth="0.6" />
          {/* Rejilla cada 5 % SiO2 y 3 % álcalis */}
          {[45, 50, 55, 60, 65, 70, 75].map((s) => (
            <line key={s} x1={tasX(s)} y1={TAS_Y1} x2={tasX(s)} y2={TAS_Y0} stroke="#e2e8f0" strokeWidth="0.3" />
          ))}
          {[3, 6, 9, 12].map((a) => (
            <line key={a} x1={TAS_X0} y1={tasY(a)} x2={TAS_X1} y2={tasY(a)} stroke="#e2e8f0" strokeWidth="0.3" />
          ))}
          {/* Etiquetas de ejes */}
          {[40, 50, 60, 70, 80].map((s) => (
            <text key={s} x={tasX(s)} y={TAS_Y0 + 4} textAnchor="middle" fontSize="3" fill="#64748b">{s}</text>
          ))}
          {[0, 3, 6, 9, 12, 15].map((a) => (
            <text key={a} x={TAS_X0 - 2} y={tasY(a) + 1} textAnchor="end" fontSize="3" fill="#64748b">{a}</text>
          ))}
          <text x={(TAS_X0 + TAS_X1) / 2} y={103} textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#334155">SiO₂ (% en peso)</text>
          <text x={3} y={(TAS_Y0 + TAS_Y1) / 2} textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#334155" transform={`rotate(-90 3 ${(TAS_Y0 + TAS_Y1) / 2})`}>Na₂O + K₂O (%)</text>
          {/* Línea de MacDonald (alcalina / subalcalina) */}
          <line x1={tasX(41)} y1={tasY(tasLine(41))} x2={tasX(69)} y2={tasY(tasLine(69))} stroke="#94a3b8" strokeWidth="0.4" strokeDasharray="2,1.5" />
          <text x={tasX(52)} y={tasY(tasLine(52)) - 2} fontSize="2.6" fill="#94a3b8" textAnchor="middle">alcalina ↑ / subalcalina ↓</text>
          {/* Punto interactivo */}
          <circle cx={px} cy={py} r="2.4" fill={alcalina ? '#d97706' : '#0284c7'} stroke="white" strokeWidth="0.5" style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }} />
        </svg>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Para rocas volcánicas tan finas o vítreas que no se pueden identificar sus minerales: se
          clasifican por el análisis químico de roca total.
        </p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">SiO₂ · Sílice (% en peso)</Label>
            <Input
              type="number"
              min={40}
              max={80}
              step={0.1}
              value={sio2}
              onChange={(e) => setSio2(Math.max(40, Math.min(80, Number(e.target.value) || 40)))}
              className="h-7 w-16 text-right text-xs"
            />
          </div>
          <input
            type="range"
            min={40}
            max={80}
            step={0.1}
            value={sio2}
            onChange={(e) => setSio2(Number(e.target.value))}
            className="w-full accent-current bg-sky-600"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Na₂O + K₂O · Álcalis totales (% en peso)</Label>
            <Input
              type="number"
              min={0}
              max={15}
              step={0.1}
              value={alk}
              onChange={(e) => setAlk(Math.max(0, Math.min(15, Number(e.target.value) || 0)))}
              className="h-7 w-16 text-right text-xs"
            />
          </div>
          <input
            type="range"
            min={0}
            max={15}
            step={0.1}
            value={alk}
            onChange={(e) => setAlk(Number(e.target.value))}
            className="w-full accent-current bg-amber-500"
          />
        </div>
        <NameBox caption="Roca resultante (aprox.):" name={name} badge={serie} />
      </div>
    </div>
  )
}

/* ─────────────────────────── Detríticas: escala de Wentworth ─────────────────────────── */

/** Clases granulométricas (límite superior en mm, escala logarítmica) */
const WENTWORTH = [
  { max: 256, label: 'Bloques', rock: 'Rudita (conglomerado/brecha)' },
  { max: 64, label: 'Cantos', rock: 'Rudita (conglomerado/brecha)' },
  { max: 2, label: 'Gránulos y guijarros (grava)', rock: 'Rudita (conglomerado/brecha)' },
  { max: 1, label: 'Arena muy gruesa', rock: 'Arenita muy gruesa' },
  { max: 0.5, label: 'Arena gruesa', rock: 'Arenita gruesa' },
  { max: 0.25, label: 'Arena media', rock: 'Arenita media' },
  { max: 0.125, label: 'Arena fina', rock: 'Arenita fina' },
  { max: 0.062, label: 'Arena muy fina', rock: 'Arenita muy fina' },
  { max: 0.004, label: 'Limo', rock: 'Limolita' },
  { max: 0.0001, label: 'Arcilla', rock: 'Arcillita / Lutita' },
]

function wentworthClass(dmm: number) {
  return WENTWORTH.find((w) => dmm > w.max) ?? WENTWORTH[WENTWORTH.length - 1]
}

/** Posición logarítmica en la barra: 256 mm a la izquierda → 0.0001 mm a la derecha
    (mismo sentido que el control deslizante en φ) */
const LOG_MIN = Math.log10(0.0001)
const LOG_MAX = Math.log10(256)
const logPos = (d: number) => (1 - (Math.log10(Math.max(d, 0.0001)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100

function WentworthDiagram() {
  const [phi, setPhi] = useState(1) // tamaño en unidades phi (0 = 1 mm)

  const dmm = Math.pow(2, -phi)
  const cls = wentworthClass(dmm)
  const pos = logPos(dmm)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Diámetro del grano: {dmm >= 0.01 ? dmm.toFixed(2) : dmm.toExponential(1)} mm (φ = {phi})</Label>
          <span className="text-xs text-muted-foreground">{cls.label}</span>
        </div>
        <input
          type="range"
          min={-8}
          max={12}
          step={0.5}
          value={phi}
          onChange={(e) => setPhi(Number(e.target.value))}
          className="w-full accent-current bg-orange-600"
        />
        {/* Escala logarítmica con marcador (clic para fijar el tamaño) */}
        <div
          className="relative h-12 w-full cursor-pointer overflow-hidden rounded-lg border"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const f = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
            const logd = LOG_MAX - f * (LOG_MAX - LOG_MIN)
            const p = -logd / Math.log10(2)
            setPhi(Math.round(Math.max(-8, Math.min(12, p)) * 2) / 2)
          }}
        >
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-stone-300 via-yellow-200 to-orange-300 opacity-60 dark:opacity-30" style={{ width: '100%' }} />
          {/* Límites de ruditas/arenitas/lutitas en posición log */}
          {[
            { at: 2, label: '2 mm' },
            { at: 0.062, label: '1/16 mm' },
          ].map((m) => (
            <div key={m.label} className="absolute inset-y-0 border-l border-dashed border-slate-500" style={{ left: `${logPos(m.at)}%` }}>
              <span className="absolute bottom-0.5 -translate-x-1/2 text-[9px] text-slate-600 dark:text-slate-300">{m.label}</span>
            </div>
          ))}
          <div className="absolute inset-y-0 border-l-2 border-rose-600" style={{ left: `${pos}%`, transition: 'left 0.2s ease' }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>256 mm</span>
          <span>Gravas · Arenas · Limos/arcillas →</span>
          <span>0.0001 mm</span>
        </div>
      </div>
      <NameBox caption="Clase granulométrica y roca (aprox.):" name={`${cls.label} → ${cls.rock}`} badge="Escala de Wentworth" />
    </div>
  )
}

/* ─────────────────────────── Detríticas: triángulo QFL (areniscas) ─────────────────────────── */

const VQf: V2 = { x: 50, y: 8 } // Cuarzo
const VFl: V2 = { x: 8, y: 92 } // Feldespatos
const VLl: V2 = { x: 92, y: 92 } // Fragmentos líticos


function QflDiagram() {
  const [q, setQ] = useState(70)
  const [f, setF] = useState(15)
  const [l, setL] = useState(15)
  const t = q + f + l || 1
  const pt = bary(VQf, VFl, VLl, q / t, f / t, l / t)
  const { name, interp } = qflName(q, f, l)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <svg
          viewBox="0 0 100 100"
          className="w-full max-w-sm cursor-pointer"
          onClick={(e) => {
            const p = clampTriangle(svgClick(e), VQf, VFl, VLl)
            const [wq, wf, wl] = baryWeights(p, VQf, VFl, VLl)
            setQ(asPct(wq)); setF(asPct(wf)); setL(asPct(wl))
          }}
        >
          <polygon points={`${VQf.x},${VQf.y} ${VFl.x},${VFl.y} ${VLl.x},${VLl.y}`} fill="white" stroke="#64748b" strokeWidth="0.6" />
          {[75, 90].map((pct) => {
            // fracción desde el ápice Q = 1 − Q
            const [x1, y1, x2, y2] = apexLine(VQf, VFl, VLl, 1 - pct / 100).split(/[ ,]/)
            return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          })}
          <line x1={VQf.x} y1={VQf.y} x2={(VFl.x + VLl.x) / 2} y2={VFl.y} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          <text x={VQf.x} y={VQf.y - 2} textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#334155">Q · Cuarzo</text>
          <text x={VFl.x - 2} y={VFl.y + 5} textAnchor="middle" fontSize="4.2" fontWeight="bold" fill="#334155">F · Feldespatos</text>
          <text x={VLl.x + 2} y={VLl.y + 5} textAnchor="middle" fontSize="4.2" fontWeight="bold" fill="#334155">L · Líticos</text>
          <circle cx={pt.x} cy={pt.y} r="2.4" fill="#0891b2" stroke="white" strokeWidth="0.5" style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }} />
        </svg>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Q + F + L normalizados al 100 %. Líneas: Q = 75 y Q = 90.
        </p>
      </div>
      <div className="space-y-3">
        <SliderRow label="Q · Cuarzo" value={q} total={t} onChange={setQ} color="bg-amber-500" />
        <SliderRow label="F · Feldespatos" value={f} total={t} onChange={setF} color="bg-rose-500" />
        <SliderRow label="L · Fragmentos líticos" value={l} total={t} onChange={setL} color="bg-slate-500" />
        <NameBox caption="Arenisca resultante (aprox.):" name={name} badge={interp} />
      </div>
    </div>
  )
}

/* ─────────────────────────── Detríticas: triángulo de Picard (lutitas) ─────────────────────────── */

const VPiA: V2 = { x: 50, y: 8 } // Arena
const VPiL: V2 = { x: 8, y: 92 } // Limo
const VPiC: V2 = { x: 92, y: 92 } // Arcilla

function picardName(a: number, l: number, c: number): string {
  const t = a + l + c || 1
  const A = (a / t) * 100
  const L = (l / t) * 100
  const C = (c / t) * 100
  if (C >= 67) return 'Lutita'
  if (L >= 67) return 'Limolita'
  if (A >= 67) return 'Arenisca fangosa'
  if (C >= 34 && L >= 34) return 'Fangolita limosa-arcillosa'
  if (A >= 34 && C >= 34) return 'Areno-lutita'
  return 'Limno-arenisca'
}

function PicardDiagram() {
  const [a, setA] = useState(25)
  const [l, setL] = useState(35)
  const [c, setC] = useState(40)
  const t = a + l + c || 1
  const pt = bary(VPiA, VPiL, VPiC, a / t, l / t, c / t)
  const name = picardName(a, l, c)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <svg
          viewBox="0 0 100 100"
          className="w-full max-w-sm cursor-pointer"
          onClick={(e) => {
            const p = clampTriangle(svgClick(e), VPiA, VPiL, VPiC)
            const [wa, wl, wc] = baryWeights(p, VPiA, VPiL, VPiC)
            setA(asPct(wa)); setL(asPct(wl)); setC(asPct(wc))
          }}
        >
          <polygon points={`${VPiA.x},${VPiA.y} ${VPiL.x},${VPiL.y} ${VPiC.x},${VPiC.y}`} fill="white" stroke="#64748b" strokeWidth="0.6" />
          {[0.33, 0.66].map((frac) => {
            const l1 = apexLine(VPiA, VPiL, VPiC, frac).split(/[ ,]/)
            const l2 = apexLine(VPiL, VPiA, VPiC, frac).split(/[ ,]/)
            const l3 = apexLine(VPiC, VPiA, VPiL, frac).split(/[ ,]/)
            return (
              <g key={frac} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5">
                <line x1={l1[0]} y1={l1[1]} x2={l1[2]} y2={l1[3]} />
                <line x1={l2[0]} y1={l2[1]} x2={l2[2]} y2={l2[3]} />
                <line x1={l3[0]} y1={l3[1]} x2={l3[2]} y2={l3[3]} />
              </g>
            )
          })}
          <text x={VPiA.x} y={VPiA.y - 2} textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#334155">Arena</text>
          <text x={VPiL.x - 2} y={VPiL.y + 5} textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#334155">Limo</text>
          <text x={VPiC.x + 2} y={VPiC.y + 5} textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#334155">Arcilla</text>
          <circle cx={pt.x} cy={pt.y} r="2.4" fill="#65a30d" stroke="white" strokeWidth="0.5" style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }} />
        </svg>
      </div>
      <div className="space-y-3">
        <SliderRow label="Arena" value={a} total={t} onChange={setA} color="bg-yellow-500" />
        <SliderRow label="Limo" value={l} total={t} onChange={setL} color="bg-stone-400" />
        <SliderRow label="Arcilla" value={c} total={t} onChange={setC} color="bg-orange-800" />
        <NameBox caption="Roca de grano fino resultante (aprox.):" name={name} badge="Diagrama de Picard (1971)" />
      </div>
    </div>
  )
}

/* ─────────────────────────── Carbonatadas: Folk ─────────────────────────── */

const VFoAl: V2 = { x: 50, y: 8 }
const VFoMi: V2 = { x: 8, y: 92 }
const VFoEs: V2 = { x: 92, y: 92 }

function folkName(alloc: number, mic: number, spar: number): string {
  const t = alloc + mic + spar || 1
  const A = (alloc / t) * 100
  const M = (mic / t) * 100
  const S = (spar / t) * 100
  // Folk (1959, 1962): >10 % de alóquemes → -esparita o -micrita según la matriz dominante
  if (A < 1) return M >= S ? 'Micrita' : 'Esparita / microesparita'
  if (A < 10) return M >= S ? 'Micrita fosilífera' : 'Esparita con alóquemes'
  if (S >= M) return A >= 50 ? 'Bioesparita (bien lavada)' : 'Bioesparita (mal lavada)'
  return A >= 50 ? 'Biomicrita empaquetada' : 'Biomicrita dispersa'
}

function FolkDiagram() {
  const [alloc, setAlloc] = useState(40)
  const [mic, setMic] = useState(35)
  const [spar, setSpar] = useState(25)
  const t = alloc + mic + spar || 1
  const pt = bary(VFoAl, VFoMi, VFoEs, alloc / t, mic / t, spar / t)
  const name = folkName(alloc, mic, spar)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <svg
          viewBox="0 0 100 100"
          className="w-full max-w-sm cursor-pointer"
          onClick={(e) => {
            const p = clampTriangle(svgClick(e), VFoAl, VFoMi, VFoEs)
            const [wal, wmi, wsp] = baryWeights(p, VFoAl, VFoMi, VFoEs)
            setAlloc(asPct(wal)); setMic(asPct(wmi)); setSpar(asPct(wsp))
          }}
        >
          <polygon points={`${VFoAl.x},${VFoAl.y} ${VFoMi.x},${VFoMi.y} ${VFoEs.x},${VFoEs.y}`} fill="white" stroke="#64748b" strokeWidth="0.6" />
          {[0.5, 0.9].map((frac) => {
            // fracción desde el ápice: 0.5 → alóquemes 50 %, 0.9 → alóquemes 10 %
            const [x1, y1, x2, y2] = apexLine(VFoAl, VFoMi, VFoEs, frac).split(/[ ,]/)
            return <line key={frac} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          })}
          <line x1={VFoAl.x} y1={VFoAl.y} x2={(VFoMi.x + VFoEs.x) / 2} y2={VFoMi.y} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          <text x={VFoAl.x} y={VFoAl.y - 2} textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#334155">Alóquemes</text>
          <text x={VFoMi.x - 2} y={VFoMi.y + 5} textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#334155">Micrita</text>
          <text x={VFoEs.x + 2} y={VFoEs.y + 5} textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#334155">Esparita</text>
          <circle cx={pt.x} cy={pt.y} r="2.4" fill="#059669" stroke="white" strokeWidth="0.5" style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }} />
        </svg>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Prefijos según el alóqueme dominante: intra-, oo-, bio-, pel- (p. ej. biomicrita, ooesparita).
        </p>
      </div>
      <div className="space-y-3">
        <SliderRow label="Alóquemes (intraclastos · ooideos · bioclastos · peloides)" value={alloc} total={t} onChange={setAlloc} color="bg-emerald-600" />
        <SliderRow label="Micrita (fango carbonático)" value={mic} total={t} onChange={setMic} color="bg-stone-500" />
        <SliderRow label="Esparita (cemento cristalino)" value={spar} total={t} onChange={setSpar} color="bg-yellow-500" />
        <NameBox caption="Caliza resultante (aprox.):" name={name} badge="Clasificación de Folk (1959)" />
      </div>
    </div>
  )
}

/* ─────────────────────────── Carbonatadas: Dunham ─────────────────────────── */

function dunhamName(grains: number, mudSupported: boolean, withMud: boolean): string {
  // Dunham (1962): primero el soporte (lodo o granos), luego el % de granos o la presencia de lodo
  if (mudSupported) return grains < 10 ? 'Mudstone (caliza lodosa)' : 'Wackestone (lodo-soportada, >10 % de granos)'
  if (withMud) return 'Packstone (grano-soportada, con lodo)'
  return 'Grainstone (grano-soportada, sin lodo)'
}

function DunhamDiagram() {
  const [grains, setGrains] = useState(45)
  const [mudSupported, setMudSupported] = useState(true)
  const [withMud, setWithMud] = useState(true)
  const name = dunhamName(grains, mudSupported, withMud)

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SliderRow label="Contenido de granos/componentes (%)" value={grains} total={100} onChange={setGrains} color="bg-teal-600" />
        <div className="relative h-10 w-full overflow-hidden rounded-lg border">
          <div className="absolute inset-y-0 left-0 bg-teal-200 dark:bg-teal-900" style={{ width: `${grains}%`, transition: 'width 0.3s ease' }} />
          <div className="absolute inset-y-0 right-0 bg-stone-200 dark:bg-stone-800" style={{ width: `${100 - grains}%`, transition: 'width 0.3s ease' }} />
          <div className="absolute inset-y-0 border-l border-dashed border-slate-500" style={{ left: '10%' }} />
          <div className="absolute left-[10%] top-0.5 -translate-x-1/2 text-[9px] text-slate-500">10%</div>
          <div className="absolute inset-y-0 border-l-2 border-teal-600" style={{ left: `${grains}%`, transition: 'left 0.3s ease' }} />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium">Granos {grains}%</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-600 dark:text-stone-300">Lodo {100 - grains}%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox id="dunham-mudsup" checked={mudSupported} onCheckedChange={(v) => setMudSupported(v === true)} />
          <Label htmlFor="dunham-mudsup" className="text-sm">Los granos flotan en lodo (lodo-soportada)</Label>
        </div>
        {!mudSupported && (
          <div className="flex items-center space-x-2">
            <Checkbox id="dunham-withmud" checked={withMud} onCheckedChange={(v) => setWithMud(v === true)} />
            <Label htmlFor="dunham-withmud" className="text-sm">Queda lodo entre los granos apoyados</Label>
          </div>
        )}
      </div>

      <NameBox caption="Caliza resultante (aprox.):" name={name} badge="Clasificación de Dunham (1962)" />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Boundstone · componentes unidos por organismos al depositarse</Badge>
        <Badge variant="outline">Crystalline · cristalización posterior (dolomitización/marmolización)</Badge>
      </div>
    </div>
  )
}

/* ─────────────────────────── Químicas: secuencia evaporítica ─────────────────────────── */

const EVAP_ETAPAS = [
  { until: 20, name: 'Calcita / Dolomita', note: 'Primeros carbonatos en precipitar' },
  { until: 45, name: 'Yeso / Anhidrita', note: 'Sulfatos de calcio' },
  { until: 75, name: 'Halita (sal gema)', note: 'Cloruro sódico' },
  { until: 100, name: 'Sales de K y Mg (silvita · carnalita)', note: 'Últimas en precipitar: potasio y magnesio' },
]

function EvaporitaDiagram() {
  const [sal, setSal] = useState(30)
  const etapa = EVAP_ETAPAS.find((e) => sal <= e.until) ?? EVAP_ETAPAS[EVAP_ETAPAS.length - 1]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SliderRow label="Grado de evaporación / concentración de sales" value={sal} total={100} onChange={setSal} color="bg-cyan-700" />
        {/* Flujo de precipitación con marcador */}
        <div className="relative h-14 w-full overflow-hidden rounded-lg border">
          {(() => {
            let left = 0
            return EVAP_ETAPAS.map((e) => {
              const width = e.until - left
              const seg = (
                <div key={e.name} className="absolute inset-y-0 border-r border-white/60 bg-gradient-to-b from-sky-100 to-sky-200 dark:from-sky-900 dark:to-slate-800" style={{ left: `${left}%`, width: `${width}%` }}>
                  <span className="absolute inset-x-1 top-1.5 text-center text-[9px] font-medium leading-tight text-sky-900 dark:text-sky-100">{e.name}</span>
                </div>
              )
              left = e.until
              return seg
            })
          })()}
          <div className="absolute inset-y-0 border-l-2 border-rose-600" style={{ left: `${sal}%`, transition: 'left 0.3s ease' }} />
          <span className="absolute bottom-0.5 right-1.5 text-[9px] text-slate-500">salinidad creciente →</span>
        </div>
      </div>
      <NameBox caption="Mineral que precipita en esta etapa:" name={etapa.name} badge={etapa.note} />
    </div>
  )
}

/* ─────────────────────────── Químicas: clasificación de sílices ─────────────────────────── */

const SILICE_TIPOS = [
  { id: 'micro', label: 'Microcristalina', name: 'Chert microcristalino', note: 'Cristales visibles solo al microscopio óptico; típico de nódulos en calizas' },
  { id: 'cripto', label: 'Criptocristalina', name: 'Chert criptocristalino', note: 'Cristales indetectables al microscopio óptico; muy común en capas sedimentarias' },
  { id: 'calced', label: 'Fibrosa (calcedónica)', name: 'Calcedonia / Chert calcedónico', note: 'Agregados fibrosos en geodas, venas y rellenos' },
] as const

function SiliceDiagram() {
  const [tipo, setTipo] = useState<(typeof SILICE_TIPOS)[number]['id']>('cripto')
  const sel = SILICE_TIPOS.find((s) => s.id === tipo) ?? SILICE_TIPOS[1]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Textura cristalina bajo el microscopio</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SILICE_TIPOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setTipo(s.id)}
              className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                tipo === s.id ? 'border-primary bg-primary/10 font-medium text-primary' : 'hover:bg-muted/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <NameBox caption="Sílice resultante:" name={sel.name} badge={sel.note} />
    </div>
  )
}

/* ─────────────────────────── Orgánicas: grado de carbonificación ─────────────────────────── */

const CARBON_ZONAS = [
  { until: 55, name: 'Turba', humedad: '~75 %', color: 'bg-amber-200 dark:bg-amber-900' },
  { until: 70, name: 'Lignito', humedad: '~35 %', color: 'bg-amber-400 dark:bg-amber-800' },
  { until: 85, name: 'Hulla bituminosa', humedad: '~8 %', color: 'bg-stone-500' },
  { until: 100, name: 'Antracita', humedad: '~3 %', color: 'bg-slate-800' },
]

function CarbonDiagram() {
  const [c, setC] = useState(65)
  const zona = CARBON_ZONAS.find((z) => c <= z.until) ?? CARBON_ZONAS[CARBON_ZONAS.length - 1]
  const min = 40
  const axisPct = ((c - min) / (100 - min)) * 100

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Carbono fijo (%)</Label>
          <div className="flex items-center gap-2">
            <Input type="number" min={min} max={100} value={c} onChange={(e) => setC(Math.max(min, Math.min(100, Number(e.target.value) || 0)))} className="h-7 w-16 text-right text-xs" />
            <span className="w-6 text-right text-xs text-muted-foreground">%</span>
          </div>
        </div>
        <input type="range" min={min} max={100} value={c} onChange={(e) => setC(Number(e.target.value))} className="w-full accent-current bg-slate-700" />
        {/* Eje de madurez: carbono fijo aumenta, humedad cae; implica ↑ P y T (clic para fijar) */}
        <div
          className="relative h-14 w-full cursor-pointer overflow-hidden rounded-lg border"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const f = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
            setC(Math.round(40 + f * 60))
          }}
        >
          {(() => {
            // La barra va de 40 % a 100 % de C: se usa la misma escala que el marcador
            const toPct = (v: number) => ((v - min) / (100 - min)) * 100
            let left = 0
            return CARBON_ZONAS.map((z) => {
              const width = toPct(z.until) - left
              const seg = (
                <div key={z.name} className={`absolute inset-y-0 ${z.color}`} style={{ left: `${left}%`, width: `${width}%`, transition: 'all 0.3s ease' }}>
                  <span className="absolute inset-x-0 top-1.5 text-center text-[10px] font-semibold text-white drop-shadow">{z.name}</span>
                  <span className="absolute inset-x-0 bottom-1 text-center text-[9px] text-white/90">húm. {z.humedad}</span>
                </div>
              )
              left = toPct(z.until)
              return seg
            })
          })()}
          <div className="absolute inset-y-0 border-l-2 border-rose-500" style={{ left: `${axisPct}%`, transition: 'left 0.3s ease' }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>40 % C (diagenesis temprana)</span>
          <span>↑ presión y temperatura (grado de carbonificación)</span>
          <span>100 % C (metamorfismo)</span>
        </div>
      </div>
      <NameBox caption="Rango del carbón resultante:" name={`${zona.name} (carbono fijo ~${c} %, humedad ${zona.humedad})`} badge="Serie: turba → lignito → hulla → antracita" />
    </div>
  )
}
/* ─────────────────────────── utilidades compartidas ─────────────────────────── */

function SliderRow({
  label,
  value,
  total,
  onChange,
  color,
}: {
  label: string
  value: number
  total: number
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="h-7 w-16 text-right text-xs"
          />
          <span className="w-8 text-right text-xs text-muted-foreground">
            {total > 0 ? Math.round((value / total) * 100) : 0}%
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full accent-current ${color}`}
      />
    </div>
  )
}

function NameBox({ caption, name, badge }: { caption: string; name: string; badge: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <p className="text-lg font-semibold">{name}</p>
      <Badge variant="secondary" className="mt-1">{badge}</Badge>
    </div>
  )
}
/* ─────────────────────────── Metamórficas ─────────────────────────── */

const META_COMPOSICIONES = [
  { id: 'pelitico', label: 'Pelítico (arcilloso)', textura: 'Foliada (esquistosa)' },
  { id: 'arenoso', label: 'Arenoso (cuarcoso)', textura: 'No foliada (granoblástica)' },
  { id: 'calizo', label: 'Calizo (carbonatado)', textura: 'No foliada (granoblástica)' },
  { id: 'mafico', label: 'Máfico (basáltico)', textura: 'Foliada (esquistosa)' },
] as const

const META_GRADOS = ['Bajo', 'Medio', 'Alto'] as const

const META_NOMBRES: Record<string, string[]> = {
  pelitico: [
    'Pizarra',
    'Filita · Esquisto (clorita–biotita–granate)',
    'Gneis (cianita–sillimanita)',
  ],
  arenoso: ['Metaarenisca (incipiente)', 'Cuarcita', 'Cuarcita granoblástica'],
  calizo: ['Mármol incipiente', 'Mármol', 'Mármol / Skarn (contacto)'],
  mafico: ['Esquisto verde', 'Anfibolita', 'Granulita máfica'],
}

function MetamorficasDiagram() {
  const [comp, setComp] = useState<(typeof META_COMPOSICIONES)[number]['id']>('pelitico')
  const [grado, setGrado] = useState(1)

  const compIdx = META_COMPOSICIONES.findIndex((c) => c.id === comp)
  const nombre = META_NOMBRES[comp][grado]
  const textura = META_COMPOSICIONES[compIdx].textura

  // Cuadrícula 3 columnas (grado) x 4 filas (composición)
  const cellX = (g: number) => 26.5 + g * 29 // centros de columna
  const cellY = (c: number) => 14 + c * 22 // centros de fila

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <svg
          viewBox="0 0 100 100"
          className="w-full max-w-sm cursor-pointer"
          onClick={(e) => {
            const p = svgClick(e)
            const g = Math.max(0, Math.min(2, Math.round((p.x - 26.5) / 29)))
            const c = Math.max(0, Math.min(3, Math.round((p.y - 14) / 22)))
            setGrado(g)
            setComp(META_COMPOSICIONES[c].id)
          }}
        >
          {/* Ejes */}
          <text x={50} y={6} textAnchor="middle" fontSize="4" fontWeight="bold" fill="#334155">
            Grado de metamorfismo →
          </text>
          {META_GRADOS.map((g, i) => (
            <text key={g} x={cellX(i)} y={11} textAnchor="middle" fontSize="3.6" fill="#64748b">
              {g}
            </text>
          ))}
          {/* Rejilla */}
          {[0, 1, 2, 3, 4].map((r) => (
            <line key={r} x1={12} y1={cellY(r) - 11} x2={99} y2={cellY(r) - 11} stroke="#e2e8f0" strokeWidth="0.4" />
          ))}
          {[0, 1, 2, 3].map((c) => (
            <line key={c} x1={12 + c * 29} y1={3} x2={12 + c * 29} y2={95} stroke="#e2e8f0" strokeWidth="0.4" />
          ))}
          {/* Etiquetas de fila (composición) */}
          {META_COMPOSICIONES.map((c, i) => (
            <text key={c.id} x={6} y={cellY(i) + 1.5} fontSize="3" fill="#334155">
              {c.label.split(' (')[0]}
            </text>
          ))}
          {/* Nombres en cada celda (abreviados) */}
          {META_COMPOSICIONES.map((c, i) =>
            META_NOMBRES[c.id].map((n, g) => (
              <text key={`${c.id}-${g}`} x={cellX(g)} y={cellY(i) + 1.5} textAnchor="middle" fontSize="2.6" fill="#94a3b8">
                {n.split(' (')[0].split(' /')[0].split(' ·')[0]}
              </text>
            ))
          )}
          {/* Punto interactivo */}
          <circle
            cx={cellX(grado)}
            cy={cellY(compIdx)}
            r="3"
            fill="#d97706"
            stroke="white"
            strokeWidth="0.6"
            style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }}
          />
        </svg>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Composición / protolito</Label>
          <div className="grid grid-cols-2 gap-2">
            {META_COMPOSICIONES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setComp(c.id)}
                className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                  comp === c.id
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Grado de metamorfismo</Label>
          <div className="grid grid-cols-3 gap-2">
            {META_GRADOS.map((g, i) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrado(i)}
                className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                  grado === i
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Roca resultante (aprox.):</p>
          <p className="text-lg font-semibold">{nombre}</p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">{textura}</Badge>
            <Badge variant="outline">{META_GRADOS[grado]}</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Metamórficas: diagrama de facies (P–T) ─────────────────────────── */

type Facies = { id: string; label: string; color: string; tMin: number; tMax: number; pMin: number; pMax: number; desc: string }

const FACIES: Facies[] = [
  { id: 'zeolita', label: 'Ceolitas / Prehnita-Pumpellyita', color: '#a78bfa', tMin: 100, tMax: 300, pMin: 0, pMax: 3.5, desc: 'Metamorfismo de muy bajo grado (baja P y T)' },
  { id: 'hornfels', label: 'Cornubianitas (Hornfels)', color: '#f59e0b', tMin: 450, tMax: 950, pMin: 0, pMax: 2, desc: 'Metamorfismo de contacto: alta T y baja P' },
  { id: 'esqverdes', label: 'Esquistos verdes', color: '#22c55e', tMin: 300, tMax: 500, pMin: 2, pMax: 8, desc: 'Metamorfismo regional de grado bajo' },
  { id: 'anfibolita', label: 'Anfibolita', color: '#84cc16', tMin: 500, tMax: 750, pMin: 3, pMax: 10, desc: 'Metamorfismo regional de grado medio' },
  { id: 'granulita', label: 'Granulita', color: '#ef4444', tMin: 750, tMax: 1000, pMin: 3, pMax: 12, desc: 'Metamorfismo regional de grado alto' },
  { id: 'esqazules', label: 'Esquistos azules', color: '#3b82f6', tMin: 200, tMax: 500, pMin: 6, pMax: 12, desc: 'Zonas de subducción: alta P y baja T' },
  { id: 'eclogita', label: 'Eclogita', color: '#8b5cf6', tMin: 450, tMax: 900, pMin: 10, pMax: 13, desc: 'Subducción profunda: muy alta P' },
]

const FTX0 = 8
const FTX1 = 96
const FPY0 = 92
const FPY1 = 6
const ftX = (t: number) => FTX0 + ((t - 100) / 900) * (FTX1 - FTX0)
const fpY = (p: number) => FPY0 + (p / 13) * (FPY1 - FPY0)

function faciesAt(t: number, p: number): Facies {
  if (p <= 2 && t >= 450) return FACIES.find((f) => f.id === 'hornfels')!
  if (p >= 10 && t >= 450) return FACIES.find((f) => f.id === 'eclogita')!
  if (p >= 6 && t < 500) return FACIES.find((f) => f.id === 'esqazules')!
  if (t < 300 && p < 4) return FACIES.find((f) => f.id === 'zeolita')!
  if (t < 500) return FACIES.find((f) => f.id === 'esqverdes')!
  if (t >= 750) return FACIES.find((f) => f.id === 'granulita')!
  return FACIES.find((f) => f.id === 'anfibolita')!
}

function FaciesDiagram() {
  const [temp, setTemp] = useState(450)
  const [pres, setPres] = useState(4)
  const facies = faciesAt(temp, pres)
  const depthKm = Math.round(pres * 3.3)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <svg
          viewBox="0 0 100 106"
          className="w-full max-w-sm cursor-pointer"
          onClick={(e) => {
            const p = svgClick(e)
            const t = 100 + ((p.x - FTX0) / (FTX1 - FTX0)) * 900
            const pr = ((p.y - FPY0) / (FPY1 - FPY0)) * 13
            setTemp(Math.round(Math.max(100, Math.min(1000, t)) / 10) * 10)
            setPres(Math.round(Math.max(0, Math.min(13, pr)) * 10) / 10)
          }}
        >
          {/* Campos de facies (simplificados) */}
          {FACIES.map((f) => (
            <polygon
              key={f.id}
              points={`${ftX(f.tMin)},${fpY(f.pMin)} ${ftX(f.tMax)},${fpY(f.pMin)} ${ftX(f.tMax)},${fpY(f.pMax)} ${ftX(f.tMin)},${fpY(f.pMax)}`}
              fill={f.color}
              opacity={facies.id === f.id ? 0.45 : 0.16}
              stroke={f.color}
              strokeWidth={facies.id === f.id ? 0.5 : 0.2}
              style={{ transition: 'opacity 0.3s ease' }}
            />
          ))}
          {/* Ejes */}
          <line x1={FTX0} y1={FPY0} x2={FTX1} y2={FPY0} stroke="#64748b" strokeWidth="0.6" />
          <line x1={FTX0} y1={FPY0} x2={FTX0} y2={FPY1} stroke="#64748b" strokeWidth="0.6" />
          {[200, 400, 600, 800, 1000].map((t) => (
            <text key={t} x={ftX(t)} y={FPY0 + 4} textAnchor="middle" fontSize="3" fill="#64748b">{t}</text>
          ))}
          {[0, 3, 6, 9, 12].map((p) => (
            <text key={p} x={FTX0 - 2} y={fpY(p) + 1} textAnchor="end" fontSize="3" fill="#64748b">{p}</text>
          ))}
          <text x={(FTX0 + FTX1) / 2} y={103} textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#334155">Temperatura (°C)</text>
          <text x={3} y={(FPY0 + FPY1) / 2} textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#334155" transform={`rotate(-90 3 ${(FPY0 + FPY1) / 2})`}>Presión (kbar)</text>
          {/* Etiquetas de campos principales */}
          <text x={ftX(200)} y={fpY(1.4)} textAnchor="middle" fontSize="2.6" fill="#6d28d9">Ceolitas</text>
          <text x={ftX(700)} y={fpY(0.9)} textAnchor="middle" fontSize="2.6" fill="#b45309">Hornfels</text>
          <text x={ftX(400)} y={fpY(4.6)} textAnchor="middle" fontSize="2.6" fill="#15803d">Esq. verdes</text>
          <text x={ftX(620)} y={fpY(6.4)} textAnchor="middle" fontSize="2.6" fill="#4d7c0f">Anfibolita</text>
          <text x={ftX(880)} y={fpY(10.8)} textAnchor="middle" fontSize="2.6" fill="#b91c1c">Granulita</text>
          <text x={ftX(340)} y={fpY(9.2)} textAnchor="middle" fontSize="2.6" fill="#1d4ed8">Esq. azules</text>
          <text x={ftX(650)} y={fpY(12.4)} textAnchor="middle" fontSize="2.6" fill="#6d28d9">Eclogita</text>
          {/* Punto interactivo */}
          <circle cx={ftX(temp)} cy={fpY(pres)} r="2.4" fill={facies.color} stroke="white" strokeWidth="0.5" style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }} />
        </svg>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Gráfico P–T con los campos de estabilidad de las principales facies metamórficas. Haz clic
          en cualquier punto del diagrama para fijar la temperatura y la presión. (1 kbar ≈ 3.3 km de
          profundidad.)
        </p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Temperatura (°C)</Label>
            <Input
              type="number"
              min={100}
              max={1000}
              step={10}
              value={temp}
              onChange={(e) => setTemp(Math.max(100, Math.min(1000, Number(e.target.value) || 100)))}
              className="h-7 w-16 text-right text-xs"
            />
          </div>
          <input
            type="range"
            min={100}
            max={1000}
            step={10}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            className="w-full accent-current bg-orange-500"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Presión (kbar)</Label>
            <Input
              type="number"
              min={0}
              max={13}
              step={0.1}
              value={pres}
              onChange={(e) => setPres(Math.max(0, Math.min(13, Number(e.target.value) || 0)))}
              className="h-7 w-16 text-right text-xs"
            />
          </div>
          <input
            type="range"
            min={0}
            max={13}
            step={0.1}
            value={pres}
            onChange={(e) => setPres(Number(e.target.value))}
            className="w-full accent-current bg-sky-600"
          />
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">Facies resultante (aprox.):</p>
          <p className="text-lg font-semibold">{facies.label}</p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">~{depthKm} km de profundidad</Badge>
            <Badge variant="outline">{facies.desc}</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Metamórficas: triángulos ACF / AKF ─────────────────────────── */

const VAm: V2 = { x: 50, y: 8 } // Alúmina
const VCk: V2 = { x: 8, y: 92 } // C (CaO) o K (K₂O)
const VFm: V2 = { x: 92, y: 92 } // F (FeO + MgO + MnO)

function acfName(a: number, c: number, f: number): string {
  const t = a + c + f || 1
  const A = (a / t) * 100
  const C = (c / t) * 100
  const F = (f / t) * 100
  if (A >= 60) return 'Dominio aluminoso: cianita / andalucita / silimanita'
  if (C >= 60) return 'Minerales calcáreos: epidota, grossularia, wollastonita'
  if (F >= 60) return 'Minerales máficos: clorita, anfíbol, biotita'
  if (A >= F && C >= F) return 'Mezcla: silicatos de Ca + aluminosos'
  return 'Mezcla: biotita + anfíbol ± aluminosos'
}

function akfName(a: number, k: number, f: number): string {
  const t = a + k + f || 1
  const A = (a / t) * 100
  const K = (k / t) * 100
  const F = (f / t) * 100
  if (A >= 60) return 'Minerales aluminosos: andalucita / cianita'
  if (K >= 60) return 'Feldespato potásico / moscovita'
  if (F >= 60) return 'Biotita ± granate'
  return 'Mezcla: biotita + moscovita + aluminosos'
}

function AcfAkfDiagram() {
  const [modo, setModo] = useState<'acf' | 'akf'>('acf')
  const [a, setA] = useState(40)
  const [ck, setCk] = useState(30)
  const [f, setF] = useState(30)
  const t = a + ck + f || 1
  const pt = bary(VAm, VCk, VFm, a / t, ck / t, f / t)
  const name = modo === 'acf' ? acfName(a, ck, f) : akfName(a, ck, f)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <svg
          viewBox="0 0 100 108"
          className="w-full max-w-sm cursor-pointer"
          onClick={(e) => {
            const p = clampTriangle(svgClick(e), VAm, VCk, VFm)
            const [wa, wck, wf] = baryWeights(p, VAm, VCk, VFm)
            setA(asPct(wa)); setCk(asPct(wck)); setF(asPct(wf))
          }}
        >
          <polygon points={`${VAm.x},${VAm.y} ${VCk.x},${VCk.y} ${VFm.x},${VFm.y}`} fill="white" stroke="#64748b" strokeWidth="0.6" />
          {[0.33, 0.66].map((frac) => {
            const [x1, y1, x2, y2] = apexLine(VAm, VCk, VFm, frac).split(/[ ,]/)
            return <line key={frac} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          })}
          {[33, 66].map((pct) => {
            const [x1, y1, x2, y2] = radialLine(VAm, VCk, VFm, pct).split(/[ ,]/)
            return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5,1.5" />
          })}
          <text x={VAm.x} y={VAm.y - 2} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">A</text>
          <text x={VCk.x - 7} y={VCk.y + 4} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">{modo === 'acf' ? 'C' : 'K'}</text>
          <text x={VFm.x + 8} y={VFm.y + 4} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#334155">F</text>
          <circle cx={pt.x} cy={pt.y} r="2.4" fill={modo === 'acf' ? '#0d9488' : '#c026d3'} stroke="white" strokeWidth="0.5" style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }} />
        </svg>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Componentes químicos simplificados de la roca proyectados en el triángulo: indican qué
          minerales pueden coexistir estables en una misma facies. La proyección AFM (Thompson) es
          una variación específica para pelitas de grado medio-alto.
        </p>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(['acf', 'akf'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                modo === m
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {m === 'acf' ? 'ACF · máficas y calcáreas' : 'AKF · pelíticas y graníticas'}
            </button>
          ))}
        </div>
        <SliderRow label="A · Al₂O₃ (alúmina)" value={a} total={t} onChange={setA} color="bg-rose-500" />
        <SliderRow
          label={modo === 'acf' ? 'C · CaO (cal)' : 'K · K₂O (potasa)'}
          value={ck}
          total={t}
          onChange={setCk}
          color={modo === 'acf' ? 'bg-sky-500' : 'bg-amber-500'}
        />
        <SliderRow label="F · FeO + MgO + MnO" value={f} total={t} onChange={setF} color="bg-slate-500" />
        <NameBox
          caption="Minerales indicados (aprox.):"
          name={name}
          badge={modo === 'acf' ? 'Diagrama ACF (Eskola)' : 'Diagrama AKF (Eskola)'}
        />
      </div>
    </div>
  )
}

/* ─────────────────────────── Panel principal ─────────────────────────── */

export function IgneasContent() {
  return (
            <Tabs defaultValue="diagramas" className="w-full">
              <TabsList className="mb-4 grid h-auto w-full grid-cols-2 p-1">
                <TabsTrigger value="diagramas" className="py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-base">Clasificación en diagramas</TabsTrigger>
                <TabsTrigger value="macro" className="py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-base">Clasificación de muestra macro</TabsTrigger>
              </TabsList>

              <TabsContent value="diagramas">
            <Tabs defaultValue="qapf" className="w-full">
              <TabsList className="mb-4 grid h-auto w-full bg-transparent gap-1 p-0 [&>button]:rounded-full [&>button]:border [&>button]:text-xs [&>button]:sm:text-sm [&>button]:data-[state=active]:border-primary/40 [&>button]:data-[state=active]:bg-primary/10 [&>button]:data-[state=active]:text-primary [&>button]:data-[state=active]:shadow-none grid-cols-3">
                <TabsTrigger value="qapf">QAPF (Streckeisen)</TabsTrigger>
                <TabsTrigger value="ultramaficas">Ultramáficas</TabsTrigger>
                <TabsTrigger value="tas">Diagrama TAS</TabsTrigger>
              </TabsList>

              <TabsContent value="qapf">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Diagrama QAPF · Streckeisen
                    </CardTitle>
                    <CardDescription>
                      Doble triángulo según cuarzo (Q), feldespatos alcalinos (A), plagioclasa (P) y
                      feldespatoides (F). La misma geometría sirve para rocas plutónicas (enfriamiento
                      lento, cristales visibles: granito, diorita, gabro, sienita) y volcánicas
                      (enfriamiento rápido, grano fino o vítreas: riolita, andesita, basalto, traquita).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QapfDiagram />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ultramaficas">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Rocas ultramáficas
                    </CardTitle>
                    <CardDescription>
                      Si la roca tiene más del 90 % de minerales oscuros (máficos: olivino, piroxenos y
                      anfíboles), el QAPF ya no sirve: se usa el triángulo Olivino – Ortopiroxeno –
                      Clinopiroxeno (peridotitas y piroxenitas).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UltramaficasDiagram />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tas">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Diagrama TAS (Total Alkali vs. Silica)
                    </CardTitle>
                    <CardDescription>
                      Para rocas volcánicas tan finas o vítreas que es imposible identificar sus
                      minerales al microscopio: eje X = SiO₂ (% en peso), eje Y = Na₂O + K₂O. La línea
                      punteada (de MacDonald) separa la serie alcalina de la subalcalina.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TasDiagram />
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
              </TabsContent>

              <TabsContent value="macro">
                <IdentificaIgneas />
              </TabsContent>
            </Tabs>
  )
}

export function SedimentariasContent() {
  return (
            <Tabs defaultValue="diagramas" className="w-full">
              <TabsList className="mb-4 grid h-auto w-full grid-cols-2 p-1">
                <TabsTrigger value="diagramas" className="py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-base">Clasificación en diagramas</TabsTrigger>
                <TabsTrigger value="macro" className="py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-base">Clasificación de muestra macro</TabsTrigger>
              </TabsList>

              <TabsContent value="diagramas">
            <Tabs defaultValue="detriticas" className="w-full">
              <TabsList className="mb-4 grid h-auto w-full bg-transparent gap-1 p-0 [&>button]:rounded-full [&>button]:border [&>button]:text-xs [&>button]:sm:text-sm [&>button]:data-[state=active]:border-primary/40 [&>button]:data-[state=active]:bg-primary/10 [&>button]:data-[state=active]:text-primary [&>button]:data-[state=active]:shadow-none grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="detriticas">Detríticas</TabsTrigger>
                <TabsTrigger value="carbonatadas">Carbonatadas</TabsTrigger>
                <TabsTrigger value="quimicas">Químicas</TabsTrigger>
                <TabsTrigger value="organicas">Orgánicas</TabsTrigger>
              </TabsList>

              <TabsContent value="detriticas">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Rocas detríticas (clásticas)
                    </CardTitle>
                    <CardDescription>
                      Tres criterios según el tamaño de los fragmentos o la composición mineralógica.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Escala granulométrica de Wentworth (tamaño de grano)</h4>
                      <WentworthDiagram />
                    </div>
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Diagrama QFL para areniscas</h4>
                      <QflDiagram />
                    </div>
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Diagrama de Picard (1971) para rocas de grano fino</h4>
                      <PicardDiagram />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="carbonatadas">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Rocas carbonatadas (calizas y dolomías)
                    </CardTitle>
                    <CardDescription>
                      Los dos esquemas universales, basados en los componentes texturales (fósiles,
                      fango, cemento), no en el tamaño mineral.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Clasificación de Folk</h4>
                      <FolkDiagram />
                    </div>
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Clasificación de Dunham</h4>
                      <DunhamDiagram />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quimicas">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Rocas químicas no carbonatadas (evaporitas y silíceas)
                    </CardTitle>
                    <CardDescription>
                      Clasificación composicional y mineralógica: rocas típicamente monominerales.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Secuencia de precipitación evaporítica</h4>
                      <EvaporitaDiagram />
                    </div>
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Texturas cristalinas de las sílices</h4>
                      <SiliceDiagram />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="organicas">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Rocas orgánicas (carbones)
                    </CardTitle>
                    <CardDescription>
                      Grado de carbonificación: maduración del material orgánico con la presión y la
                      temperatura.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CarbonDiagram />
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
              </TabsContent>

              <TabsContent value="macro">
                <IdentificaSedimentarias />
              </TabsContent>
            </Tabs>
  )
}

export function MetamorficasContent() {
  return (
            <Tabs defaultValue="diagramas" className="w-full">
              <TabsList className="mb-4 grid h-auto w-full grid-cols-2 p-1">
                <TabsTrigger value="diagramas" className="py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-base">Clasificación en diagramas</TabsTrigger>
                <TabsTrigger value="macro" className="py-2.5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-base">Clasificación de muestra macro</TabsTrigger>
              </TabsList>

              <TabsContent value="diagramas">
            <Tabs defaultValue="facies" className="w-full">
              <TabsList className="mb-4 grid h-auto w-full bg-transparent gap-1 p-0 [&>button]:rounded-full [&>button]:border [&>button]:text-xs [&>button]:sm:text-sm [&>button]:data-[state=active]:border-primary/40 [&>button]:data-[state=active]:bg-primary/10 [&>button]:data-[state=active]:text-primary [&>button]:data-[state=active]:shadow-none grid-cols-3">
                <TabsTrigger value="facies">Facies (P–T)</TabsTrigger>
                <TabsTrigger value="acfakf">Triángulos ACF / AKF</TabsTrigger>
                <TabsTrigger value="textural">Matriz textural (IUGS)</TabsTrigger>
              </TabsList>

              <TabsContent value="facies">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Diagrama de Facies Metamórficas (Presión vs. Temperatura)
                    </CardTitle>
                    <CardDescription>
                      El gráfico más importante de la petrología metamórfica: delimita los campos de
                      estabilidad de las facies (conjuntos de minerales que se forman bajo condiciones
                      específicas de P y T). Ceolitas y hornfels a baja P; esquistos verdes, anfibolita
                      y granulita en el metamorfismo regional; esquistos azules y eclogita en subducción.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FaciesDiagram />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="acfakf">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Triángulos de composición química (ACF y AKF)
                    </CardTitle>
                    <CardDescription>
                      Proyección de los componentes químicos de la roca (de Eskola) para saber qué
                      minerales pueden coexistir estables en una misma facies: ACF para máficas y
                      calcáreas (Al₂O₃ – CaO – FeO+MgO+MnO); AKF para pelíticas y graníticas (reemplaza
                      el CaO por K₂O). La proyección AFM de Thompson es la variación para pelíticas de
                      grado medio-alto (biotita, granate, estaurolita, cordierita).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AcfAkfDiagram />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="textural">
                <Card className="card-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mountain className="h-5 w-5 text-primary" />
                      Matriz textural de clasificación (IUGS)
                    </CardTitle>
                    <CardDescription>
                      Norma de campo y laboratorio según la IUGS: si la roca tiene foliación se clasifica
                      de menor a mayor grado (pizarra → filita → esquisto → gneis); si no tiene foliación
                      se nombra por su composición mineralógica (mármol, cuarcita, anfibolita, eclogita).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MetamorficasDiagram />
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
              </TabsContent>

              <TabsContent value="macro">
                <IdentificaMetamorficas />
              </TabsContent>
            </Tabs>
  )
}
