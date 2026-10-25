/* Funciones de clasificación compartidas entre los diagramas y la descripción de rocas. */

/** Nombre aproximado según los campos QAPF (límites simplificados) */
export function qapfName(q: number, a: number, p: number, f: number): string {
  // Campos IUGS (Streckeisen 1976; Le Maitre 2002). Radiantes A/(A+P) = 90, 65, 35, 10.
  const ratio = a + p > 0 ? (a / (a + p)) * 100 : 50
  if (f > 0) {
    const t = a + p + f || 1
    const F = (f / t) * 100
    if (F >= 60) return 'Foidolita'
    if (F >= 10) {
      if (ratio >= 90) return 'Sienita foidítica'
      if (ratio >= 50) return 'Monzosienita foidítica'
      if (ratio >= 10) return 'Monzodiorita / Monzogabro foidítico'
      return 'Diorita / Gabro foidítico'
    }
    // F < 10: rocas «con feldespatoides» (campos 6′–10′)
    if (ratio >= 90) return 'Sienita alcalina con feldespatoides'
    if (ratio >= 65) return 'Sienita con feldespatoides'
    if (ratio >= 35) return 'Monzonita con feldespatoides'
    if (ratio >= 10) return 'Monzodiorita / Monzogabro con feldespatoides'
    return 'Diorita / Gabro con feldespatoides'
  }
  const t = q + a + p || 1
  const Q = (q / t) * 100
  if (Q >= 90) return 'Cuarzolita (silexita)'
  if (Q >= 60) return 'Granitoide rico en cuarzo'
  if (Q >= 20) {
    if (ratio >= 90) return 'Granito de feldespato alcalino'
    if (ratio >= 65) return 'Sienogranito'
    if (ratio >= 35) return 'Monzogranito'
    if (ratio >= 10) return 'Granodiorita'
    return 'Tonalita'
  }
  if (Q >= 5) {
    if (ratio >= 90) return 'Sienita alcalina de cuarzo'
    if (ratio >= 65) return 'Sienita de cuarzo'
    if (ratio >= 35) return 'Monzonita de cuarzo'
    if (ratio >= 10) return 'Monzodiorita / Monzogabro de cuarzo'
    return 'Diorita / Gabro de cuarzo'
  }
  if (ratio >= 90) return 'Sienita alcalina'
  if (ratio >= 65) return 'Sienita'
  if (ratio >= 35) return 'Monzonita'
  if (ratio >= 10) return 'Monzodiorita / Monzogabro'
  return 'Diorita / Gabro'
}

/** Equivalentes volcánicos de los nombres plutónicos (QAPF volcánico IUGS) */
export const VOLCANIC_EQ: Record<string, string> = {
  'Cuarzolita (silexita)': 'Sin equivalente volcánico',
  'Granitoide rico en cuarzo': 'Sin equivalente volcánico',
  'Granito de feldespato alcalino': 'Riolita de feldespato alcalino',
  'Sienogranito': 'Riolita',
  'Monzogranito': 'Riolita',
  'Granodiorita': 'Dacita',
  'Tonalita': 'Dacita',
  'Sienita alcalina de cuarzo': 'Traquita alcalina de cuarzo',
  'Sienita de cuarzo': 'Traquita de cuarzo',
  'Monzonita de cuarzo': 'Latita de cuarzo',
  'Monzodiorita / Monzogabro de cuarzo': 'Andesita / Basalto',
  'Diorita / Gabro de cuarzo': 'Andesita / Basalto',
  'Sienita alcalina': 'Traquita alcalina',
  'Sienita': 'Traquita',
  'Monzonita': 'Latita',
  'Monzodiorita / Monzogabro': 'Andesita / Basalto',
  'Diorita / Gabro': 'Andesita / Basalto',
  'Sienita alcalina con feldespatoides': 'Traquita alcalina con feldespatoides',
  'Sienita con feldespatoides': 'Traquita con feldespatoides',
  'Monzonita con feldespatoides': 'Latita con feldespatoides',
  'Monzodiorita / Monzogabro con feldespatoides': 'Andesita / Basalto con feldespatoides',
  'Diorita / Gabro con feldespatoides': 'Andesita / Basalto con feldespatoides',
  'Sienita foidítica': 'Fonolita',
  'Monzosienita foidítica': 'Fonolita tefrítica',
  'Monzodiorita / Monzogabro foidítico': 'Tefrita / Basanita fonolítica',
  'Diorita / Gabro foidítico': 'Tefrita / Basanita',
  'Foidolita': 'Foidita',
}

export function ultramaficaName(ol: number, opx: number, cpx: number): string {
  const t = ol + opx + cpx || 1
  const O = (ol / t) * 100
  const X = (opx / t) * 100
  const C = (cpx / t) * 100
  // IUGS: Ol 90 / 40 / 10; peridotitas separadas por Cpx = 5 y Opx = 5;
  // piroxenitas por Opx/(Opx+Cpx) = 90 % y 10 %.
  if (O >= 90) return 'Dunita'
  if (O >= 40) {
    if (C < 5) return 'Harzburgita'
    if (X < 5) return 'Wehrlita'
    return 'Lherzolita'
  }
  const px = X + C || 1
  const fracOpx = X / px
  const base = fracOpx >= 0.9 ? 'ortopiroxenita' : fracOpx <= 0.1 ? 'clinopiroxenita' : 'websterita'
  if (O >= 10) return `Olivino-${base}`
  return base.charAt(0).toUpperCase() + base.slice(1)
}

export function qflName(q: number, f: number, l: number): { name: string; interp: string } {
  const t = q + f + l || 1
  const Q = (q / t) * 100
  const F = (f / t) * 100
  const L = (l / t) * 100
  if (Q >= 90) return { name: 'Cuarzoarenita', interp: 'Fuente madura y tectónicamente estable (cratón)' }
  if (Q >= 75) {
    return F >= L
      ? { name: 'Subarcosa', interp: 'Transición hacia arcosa: relieve moderado' }
      : { name: 'Sublitarenita', interp: 'Aporte de rocas sedimentarias vecinas' }
  }
  if (F >= L) return { name: 'Arcosa (feldespatoarenita)', interp: 'Fuente granítica o gnéisica cercana, poco madurada' }
  return { name: 'Litarenita', interp: 'Fuente de rocas volcánicas, sedimentarias o metamórficas de bajo grado' }
}
