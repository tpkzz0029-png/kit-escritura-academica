import { Gem, Info, Table2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

/* ═══════════════════════════════════════════════════════════════════
   Clasificación química de minerales (por el anión dominante),
   según el esquema clásico de Strunz/Dana usado en los manuales de
   mineralogía (p. ej., Klein & Hurlbut, «Manual de Mineralogía»):
   1 Elementos nativos · 2 Sulfuros y sulfosales · 3 Óxidos e
   hidróxidos · 4 Haluros · 5 Carbonatos, nitratos y boratos ·
   6 Sulfatos · 7 Fosfatos, arseniatos y vanadatos · 8 Silicatos
   (neso/soro/ciclo/ino/filo/tecto) · 9 Minerales orgánicos.
   ═══════════════════════════════════════════════════════════════════ */

type Mineral = {
  nombre: string
  formula: string
  mohs: string
  color: string
  raya: string
  brillo: string
  exfoliacion: string
  yacimiento: string
}

type Grupo = {
  id: string
  nombre: string
  resumen: string
  minerales: Mineral[]
}

const GRUPOS: Grupo[] = [
  {
    id: 'nativos',
    nombre: 'Elementos nativos',
    resumen:
      'Elementos químicos que se encuentran en la naturaleza sin combinar: metales (oro, plata, cobre, platino), semimetales (bismuto, antimonio) y no metales (azufre, carbono).',
    minerales: [
      { nombre: 'Oro', formula: 'Au', mohs: '2,5–3', color: 'Amarillo dorado característico', raya: 'Amarillo dorada', brillo: 'Metálico', exfoliacion: 'Fractura dentada, maleable', yacimiento: 'Filones hidrotermales y placeres; joyería y reserva monetaria.' },
      { nombre: 'Plata', formula: 'Ag', mohs: '2,5–3', color: 'Blanco grisáceo brillante', raya: 'Blanca plateada', brillo: 'Metálico', exfoliacion: 'Maleable y dúctil', yacimiento: 'Venas con sulfuros (argentita); industria y joyería.' },
      { nombre: 'Cobre nativo', formula: 'Cu', mohs: '2,5–3', color: 'Rojo cobrizo, a veces con pátina verde', raya: 'Roja cobriza', brillo: 'Metálico', exfoliacion: 'Maleable; fractura dentada', yacimiento: 'Zonas de oxidación de yacimientos cupríferos; conductor eléctrico.' },
      { nombre: 'Platino', formula: 'Pt', mohs: '4–4,5', color: 'Blanco grisáceo acerado', raya: 'Gris plateada', brillo: 'Metálico', exfoliacion: 'Dúctil y maleable', yacimiento: 'Placeres asociados a ultramáficas; catalizadores y joyería.' },
      { nombre: 'Azufre', formula: 'S', mohs: '1,5–2,5', color: 'Amarillo limón a amarillo parduzco', raya: 'Blanca amarillenta', brillo: 'Resinoso a adamantino', exfoliacion: 'Fractura concoidal', yacimiento: 'Volcanes y capas sedimentarias asociadas a yeso; fertilizantes y ácido sulfúrico.' },
      { nombre: 'Diamante', formula: 'C', mohs: '10', color: 'Incoloro, amarillento o con tonos variados', raya: 'Blanca', brillo: 'Adamantino', exfoliacion: 'Perfecta {111}', yacimiento: 'Kimberlitas y placeres; gema y abrasivo (el material más duro conocido).' },
      { nombre: 'Grafito', formula: 'C', mohs: '1–2', color: 'Gris acero a negro', raya: 'Negra grasienta', brillo: 'Metálico a grasiento', exfoliacion: 'Perfecta basal, muy blando y escribe', yacimiento: 'Esquistos metamórficos y mármoles; lápices, electrodos y lubricante.' },
      { nombre: 'Mercurio', formula: 'Hg', mohs: 'Líquido', color: 'Gris plata, único metal líquido en ambiente', raya: '—', brillo: 'Metálico', exfoliacion: 'Fractura no aplicable', yacimiento: 'Asociado al cinabrio; termómetros (uso histórico) y amalgamas.' },
    ],
  },
  {
    id: 'sulfuros',
    nombre: 'Sulfuros y sulfosales',
    resumen:
      'Compuestos del anión sulfuro (S²⁻) con cationes metálicos; los sulfosales añaden un metal semimetálico (As, Sb, Bi). Minerales mena por excelencia, típicos de vetas hidrotermales.',
    minerales: [
      { nombre: 'Galena', formula: 'PbS', mohs: '2,5', color: 'Gris plomo opaco', raya: 'Gris plomo', brillo: 'Metálico', exfoliacion: 'Perfecta cúbica {100}', yacimiento: 'Venas hidrotermales; principal mena del plomo y fuente de plata.' },
      { nombre: 'Pirita', formula: 'FeS₂', mohs: '6–6,5', color: 'Amarillo latón', raya: 'Verdosa a parda negruzca', brillo: 'Metálico', exfoliacion: 'Fractura concoidal; cristales cúbicos con estrías', yacimiento: 'Muy común en vetas y rocas sedimentarias; «oro de los tontos», obtención de ácido sulfúrico.' },
      { nombre: 'Calcopirita', formula: 'CuFeS₂', mohs: '3,5–4', color: 'Amarillo latón con irisaciones', raya: 'Verdosa negruzca', brillo: 'Metálico', exfoliacion: 'Fractura irregular', yacimiento: 'Principal mena del cobre; diseminada en vetas y pórfidos.' },
      { nombre: 'Esfalerita (blenda)', formula: 'ZnS', mohs: '3,5–4', color: 'Marrón a negro (blenda negra) o amarilla', raya: 'Blanca amarillenta', brillo: 'Resinoso a adamantino', exfoliacion: 'Perfecta {110}', yacimiento: 'Con galena en vetas; principal mena del zinc.' },
      { nombre: 'Bornita', formula: 'Cu₅FeS₄', mohs: '3', color: 'Cobrizo rojizo con irisaciones pavo real', raya: 'Gris azulada', brillo: 'Metálico', exfoliacion: 'Fractura irregular', yacimiento: 'Mena de cobre en vetas y skarns.' },
      { nombre: 'Cinabrio', formula: 'HgS', mohs: '2–2,5', color: 'Rojo bermellón característico', raya: 'Roja bermellón', brillo: 'Adamantino a grasiento', exfoliacion: 'Perfecta {1010}', yacimiento: 'Mena casi exclusiva del mercurio; yacimientos asociados a volcanismo.' },
      { nombre: 'Molibdenita', formula: 'MoS₂', mohs: '1–1,5', color: 'Gris plomo', raya: 'Gris verduzca', brillo: 'Metálico', exfoliacion: 'Perfecta basal, se siente grasiento y se marca en papel', yacimiento: 'Diseminada en pórfidos cupríferos; principal mena del molibdeno.' },
      { nombre: 'Pirrotita', formula: 'Fe₁₋ₓS', mohs: '3,5–4,5', color: 'Bronce rojizo opaco', raya: 'Negra grisácea', brillo: 'Metálico', exfoliacion: 'Fractura irregular; atraída por el imán', yacimiento: 'En ultramáficas y noritas; mena de hierro-níquel.' },
      { nombre: 'Calcosina', formula: 'Cu₂S', mohs: '2,5–3', color: 'Negro azulado a plomo', raya: 'Gris negruzca', brillo: 'Metálico', exfoliacion: '—', yacimiento: 'Zona de enriquecimiento de yacimientos cupríferos.' },
      { nombre: 'Estibinita', formula: 'Sb₂S₃', mohs: '2', color: 'Gris plomo con irisaciones', raya: 'Gris', brillo: 'Metálico', exfoliacion: 'Perfecta; cristales aciculares o masivos', yacimiento: 'Principal mena del antimonio.' },
      { nombre: 'Argentita', formula: 'Ag₂S', mohs: '2–2,5', color: 'Gris plomo a negro', raya: 'Negra', brillo: 'Metálico', exfoliacion: 'Fractura dura; se ablanda con el calor', yacimiento: 'Mena de plata en vetas de baja temperatura.' },
      { nombre: 'Tetraedrita', formula: '(Cu,Fe)₁₂Sb₄S₁₃', mohs: '3–4', color: 'Gris acero a negro', raya: 'Negra a parda', brillo: 'Metálico', exfoliacion: 'Fractura irregular', yacimiento: 'Sulfosal de cobre-plata; mena en vetas de Ag y Cu.' },
    ],
  },
  {
    id: 'oxidos',
    nombre: 'Óxidos e hidróxidos',
    resumen:
      'Combinaciones del oxígeno con metales (óxidos) o con el grupo OH⁻ (hidróxidos). Incluyen muchos minerales mena de hierro, aluminio, estaño, manganeso y cromo.',
    minerales: [
      { nombre: 'Hematita', formula: 'Fe₂O₃', mohs: '5–6', color: 'Rojo oscuro a acero; variedad terrosa roja', raya: 'Roja bermellón', brillo: 'Metálico a terroso', exfoliacion: 'Fractura irregular; masiva o en rosetas', yacimiento: 'BIF, vetas y lateritas; mena principal del hierro.' },
      { nombre: 'Magnetita', formula: 'Fe₃O₄', mohs: '5,5–6,5', color: 'Negro', raya: 'Negra', brillo: 'Metálico', exfoliacion: 'Fractura irregular; FUERTEMENTE magnética', yacimiento: 'Mena de hierro en skarns, BIF y placers magnéticos.' },
      { nombre: 'Limonita (goethita)', formula: 'FeO(OH)·nH₂O', mohs: '3,5–5,5', color: 'Amarillo ocre a pardo oscuro', raya: 'Amarilla ocre', brillo: 'Terroso a sedoso', exfoliacion: 'Masiva terrosa, botroidal', yacimiento: 'Producto de oxidación de sulfuros y carbonatos de Fe; mena secundaria.' },
      { nombre: 'Bauxita', formula: 'Al₂O₃·nH₂O (mezcla)', mohs: '1–3', color: 'Blanco, gris, amarillo rojizo', raya: 'Blanca', brillo: 'Terroso', exfoliacion: 'Masiva o pisolítica', yacimiento: 'Lateritas tropicales; principal mena del aluminio.' },
      { nombre: 'Corindón', formula: 'Al₂O₃', mohs: '9', color: 'Gris, marrón; gemas: rubí (rojo) y zafiro (azul)', raya: 'Blanca', brillo: 'Adamantino a vítreo', exfoliacion: 'Ninguna; fractura concoidal', yacimiento: 'Ricas en Al metamórficas y placeres; abrasivos y gemas.' },
      { nombre: 'Casiterita', formula: 'SnO₂', mohs: '6–7', color: 'Pardo negruzco, raramente amarillo rojizo', raya: 'Blanca grisácea', brillo: 'Adamantino a grasiento', exfoliacion: 'Fractura irregular', yacimiento: 'Pegmatitas y vetas; principal mena del estaño.' },
      { nombre: 'Rutilo', formula: 'TiO₂', mohs: '6–6,5', color: 'Rojo parduzco a negro; finas agujas doradas', raya: 'Parda amarillenta', brillo: 'Adamantino a metálico', exfoliacion: 'Perfecta {110}', yacimiento: 'Placeres y rocas metamórficas; principal fuente de titanio.' },
      { nombre: 'Ilmenita', formula: 'FeTiO₃', mohs: '5–6', color: 'Negro', raya: 'Negra a parda', brillo: 'Metálico a submetálico', exfoliacion: 'Fractura irregular; débilmente magnética', yacimiento: 'Mena de titanio en placeres y noritas.' },
      { nombre: 'Pirolusita', formula: 'MnO₂', mohs: '2–6', color: 'Gris acero a negro', raya: 'Negra', brillo: 'Metálico a terroso', exfoliacion: 'Masiva o reniforme', yacimiento: 'Principal mena del manganeso.' },
      { nombre: 'Cromita', formula: 'FeCr₂O₄', mohs: '5,5', color: 'Negro parduzco', raya: 'Negra', brillo: 'Metálico', exfoliacion: 'Fractura irregular', yacimiento: 'En peridotitas; única mena comercial del cromo.' },
      { nombre: 'Brucita', formula: 'Mg(OH)₂', mohs: '2,5', color: 'Blanca a verde pálido', raya: 'Blanca', brillo: 'Vítreo a ceroso', exfoliacion: 'Perfecta basal; se siente cerosa', yacimiento: 'Mármoles alterados; mineral de Mg y materiales refractarios.' },
      { nombre: 'Gibbsita', formula: 'Al(OH)₃', mohs: '2,5–3,5', color: 'Blanca a gris verdosa', raya: 'Blanca', brillo: 'Vítreo a perlado', exfoliacion: 'Perfecta {001}', yacimiento: 'Componente mayoritario de la bauxita; mena de aluminio.' },
    ],
  },
  {
    id: 'haluros',
    nombre: 'Haluros',
    resumen:
      'Combinaciones de halógenos (F, Cl, Br, I) con metales; típicos de ambientes evaporíticos o de vulcanismo. Suave a rayar y con hábitos cúbicos característicos.',
    minerales: [
      { nombre: 'Halita (sal común)', formula: 'NaCl', mohs: '2,5', color: 'Incolora a blanca; tonos por impurezas', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta cúbica {100}; sabor salado', yacimiento: 'Sedimentos evaporíticos; sal de mesa y cloruro industrial.' },
      { nombre: 'Fluorita', formula: 'CaF₂', mohs: '4', color: 'Incolora, verde, violeta, amarilla', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta octaédrica {111}', yacimiento: 'Vetas con Pb-Zn; fluor químico y gema ornamental.' },
      { nombre: 'Silvita', formula: 'KCl', mohs: '2', color: 'Incolora a rojiza o amarillenta', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta cúbica; sabor amargo salado', yacimiento: 'Evaporitas potásicas (Polonia, Canadá); fertilizante potásico.' },
      { nombre: 'Carnalita', formula: 'KMgCl₃·6H₂O', mohs: '2,5', color: 'Incolora a roja o amarilla', raya: 'Blanca', brillo: 'Vítreo a grasiento', exfoliacion: 'Fractura concoidal; higroscópica', yacimiento: 'Evaporitas marinas; mena de potasio y magnesio.' },
      { nombre: 'Criolita', formula: 'Na₃AlF₆', mohs: '2,5', color: 'Blanca a incolora', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Fractura irregular', yacimiento: 'Rara; Greenlandia. Electrólisis del aluminio.' },
      { nombre: 'Atacamita', formula: 'Cu₂Cl(OH)₃', mohs: '3–3,5', color: 'Verde brillante característico', raya: 'Verde', brillo: 'Adamantino a vítreo', exfoliacion: '—', yacimiento: 'Zona de oxidación de yacimientos cupríferos en climas áridos.' },
    ],
  },
  {
    id: 'carbonatos',
    nombre: 'Carbonatos, nitratos y boratos',
    resumen:
      'Sales del anión carbonato (CO₃²⁻): todos efervescen con HCl (la dolomita solo en caliente). Los boratos se acumulan en lagos salinos y evaporitas.',
    minerales: [
      { nombre: 'Calcita', formula: 'CaCO₃', mohs: '3', color: 'Incolora, blanca, gris, amarillenta', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta romboédrica {1011}; efervescencia fuerte con HCl', yacimiento: 'Calizas, mármoles, vetas; cemento, cal y ácido carbónico.' },
      { nombre: 'Aragonito', formula: 'CaCO₃', mohs: '3,5–4', color: 'Blanco a incoloro', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Imperfecta; cristales aciculares', yacimiento: 'Formaciones recientes, conchas y corales; inestable frente a la calcita.' },
      { nombre: 'Dolomita', formula: 'CaMg(CO₃)₂', mohs: '3,5–4', color: 'Blanca a rosada o gris', raya: 'Blanca', brillo: 'Vítreo a perlado', exfoliacion: 'Perfecta romboédrica; efervescencia débil con HCl frío', yacimiento: 'Dolomías y mármoles; refractarios y ajuste de suelos.' },
      { nombre: 'Magnesita', formula: 'MgCO₃', mohs: '3,5–4,5', color: 'Blanca a amarillenta', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta romboédrica', yacimiento: 'Roca alterada serpentínica; fuente de magnesio y refractarios.' },
      { nombre: 'Siderita', formula: 'FeCO₃', mohs: '3,5–4', color: 'Amarillo parduzco a marrón', raya: 'Blanca', brillo: 'Vítreo a perlado', exfoliacion: 'Perfecta romboédrica', yacimiento: 'Vetas sedimentarias ferruginosas; mena de hierro.' },
      { nombre: 'Rodocrosita', formula: 'MnCO₃', mohs: '3,5–4', color: 'Rosa intenso a marrón', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta romboédrica', yacimiento: 'Vetas hidrotermales; gema y mena de manganeso.' },
      { nombre: 'Smithsonita', formula: 'ZnCO₃', mohs: '4–4,5', color: 'Gris verdoso, azulado, pardo', raya: 'Blanca', brillo: 'Vítreo a perlado', exfoliacion: 'Perfecta romboédrica', yacimiento: 'Zona de oxidación de esfalerita; mena secundaria de zinc.' },
      { nombre: 'Witherita', formula: 'BaCO₃', mohs: '3,5', color: 'Blanca a gris amarillenta', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: '—', yacimiento: 'Vetas con baritina y galena; fuente de bario.' },
      { nombre: 'Malachita', formula: 'Cu₂CO₃(OH)₂', mohs: '3,5–4', color: 'Verde intenso bandeado', raya: 'Verde clara', brillo: 'Vítreo a sedoso', exfoliacion: 'Perfecta; patina botroidal', yacimiento: 'Zona de oxidación cuprífera; gema ornamental y mena de cobre.' },
      { nombre: 'Azurita', formula: 'Cu₃(CO₃)₂(OH)₂', mohs: '3,5–4', color: 'Azul ultramar intenso', raya: 'Azul clara', brillo: 'Vítreo', exfoliacion: 'Perfecta; cristales tabulares', yacimiento: 'Con malachita en zonas de oxidación; gema y mena de cobre.' },
      { nombre: 'Nitrato de sodio (soda chilena)', formula: 'NaNO₃', mohs: '1,5–2', color: 'Blanco a incoloro; se torna amarillo a la luz', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta romboédrica', yacimiento: 'Calicheras desérticas (Chile/Perú); fertilizante y explosivos.' },
      { nombre: 'Borax', formula: 'Na₂B₄O₇·10H₂O', mohs: '2–2,5', color: 'Blanco a incoloro', raya: 'Blanca', brillo: 'Vítreo a resinoso', exfoliacion: 'Perfecta {100}; sabor dulzón', yacimiento: 'Lagos salinos evaporados (California, Turquía); bórax y detergentes.' },
      { nombre: 'Ulexita', formula: 'NaCaB₅O₆(OH)₆·5H₂O', mohs: '2,5', color: 'Blanca nacarada', raya: 'Blanca', brillo: 'Sedoso a vítreo', exfoliacion: 'Perfecta; fibrosa', yacimiento: 'Evaporitas bóricas; «piedra de televisión» por su efecto óptico.' },
    ],
  },
  {
    id: 'sulfatos',
    nombre: 'Sulfatos y cromatos',
    resumen:
      'Sales del anión sulfato (SO₄²⁻). Formados por oxidación de sulfuros o precipitación evaporítica; incluyen menas de bario, plomo y estroncio.',
    minerales: [
      { nombre: 'Yeso', formula: 'CaSO₄·2H₂O', mohs: '2', color: 'Blanco, incoloro a gris', raya: 'Blanca', brillo: 'Vítreo a sedoso', exfoliacion: 'Perfecta {010}; maclas en punta de flecha', yacimiento: 'Evaporitas y zonas de oxidación; construcción, yeso agrícola y cemento.' },
      { nombre: 'Anhidrita', formula: 'CaSO₄', mohs: '3–3,5', color: 'Blanca a gris azulada', raya: 'Blanca', brillo: 'Vítreo a perlado', exfoliacion: 'Perfecta {010} y {001}', yacimiento: 'Evaporitas profundas; cemento y sulfato de calcio.' },
      { nombre: 'Baritina', formula: 'BaSO₄', mohs: '3–3,5', color: 'Blanca a amarillenta; tonalidades variadas', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {001}; MUY denso (se siente pesada)', yacimiento: 'Vetas con Pb-Zn; principal mena del bario, lodo de perforación.' },
      { nombre: 'Celestina', formula: 'SrSO₄', mohs: '3–3,5', color: 'Blanca a celeste pálido', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {001}', yacimiento: 'Evaporitas y vetas; fuente de estroncio.' },
      { nombre: 'Anglesita', formula: 'PbSO₄', mohs: '2,5–3', color: 'Incolora a blanca, amarilla o verde', raya: 'Blanca', brillo: 'Adamantino', exfoliacion: 'Fractura concoidal', yacimiento: 'Oxidación de la galena; mena secundaria de plomo.' },
      { nombre: 'Alunita', formula: 'KAl₃(SO₄)₂(OH)₆', mohs: '3,5–4', color: 'Blanca a grisácea', raya: 'Blanca', brillo: 'Vítreo a terroso', exfoliacion: 'Fractura irregular; pseudocúbica', yacimiento: 'Zonas de alteración vulcánica; potasio y alúmina.' },
      { nombre: 'Epsomita (sal de Epsom)', formula: 'MgSO₄·7H₂O', mohs: '2–2,5', color: 'Incolora a blanca', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {010}', yacimiento: 'Eflorescencias en cuevas; sales medicinales y agricultura.' },
      { nombre: 'Crocoíta', formula: 'PbCrO₄', mohs: '2,5–3', color: 'Rojo bermellón a anaranjado hialino', raya: 'Naranja amarillenta', brillo: 'Adamantino', exfoliacion: 'Fractura concoidal', yacimiento: 'Oxidación de Pb en yacimientos de cromo; gema rara.' },
    ],
  },
  {
    id: 'fosfatos',
    nombre: 'Fosfatos, arseniatos y vanadatos',
    resumen:
      'Sales de los ácidos fosfórico, arsénico y vanádico. La apatita es el mineral fosfático más abundante; los vanadatos son indicadores de oxidación de vetas.',
    minerales: [
      { nombre: 'Apatita', formula: 'Ca₅(PO₄)₃(F,Cl,OH)', mohs: '5', color: 'Verde, parda, azulada o incolora', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Imperfecta {001}; fractura concoidal', yacimiento: 'Igneas, sedimentarias y pegmatitas; principal fuente de fósforo (fertilizantes).' },
      { nombre: 'Turquesa', formula: 'CuAl₆(PO₄)₄(OH)₈·4H₂O', mohs: '5–6', color: 'Azul celeste a verdoso', raya: 'Blanca a verde clara', brillo: 'Ceráceo', exfoliacion: 'Perfecta {001}', yacimiento: 'Zonas de alteración árida cuprífera; gema desde la antigüedad.' },
      { nombre: 'Piromorfita', formula: 'Pb₅(PO₄)₃Cl', mohs: '3,5–4', color: 'Verde a amarillo, marrón', raya: 'Blanca', brillo: 'Resinoso', exfoliacion: 'Fractura irregular', yacimiento: 'Zona de oxidación de vetas de Pb; mena secundaria.' },
      { nombre: 'Vanadinita', formula: 'Pb₅(VO₄)₃Cl', mohs: '3', color: 'Rojo bermellón a naranja o amarilla', raya: 'Blanca a amarillenta', brillo: 'Resinoso a adamantino', exfoliacion: 'Fractura irregular', yacimiento: 'Zona de oxidación de vetas de Pb; mena de vanadio y plomo.' },
      { nombre: 'Wulfenita', formula: 'PbMoO₄', mohs: '2,5–3', color: 'Naranja, amarilla, roja', raya: 'Blanca', brillo: 'Resinoso a adamantino', exfoliacion: 'Perfecta {001}; cristales tabulares', yacimiento: 'Oxidación de molibdenita con galena; gema coleccionable.' },
      { nombre: 'Vivianita', formula: 'Fe₃(PO₄)₂·8H₂O', mohs: '1,5–2', color: 'Incolora al aire, se torna azul-verdosa', raya: 'Blanca a azulada', brillo: 'Vítreo a perlado', exfoliacion: 'Perfecta {010}', yacimiento: 'Fósiles y ambientes reducidos ricos en fosfato orgánico.' },
      { nombre: 'Monacita', formula: '(Ce,La,Nd,Th)PO₄', mohs: '5–5,5', color: 'Amarillenta a parda rojiza', raya: 'Blanca', brillo: 'Resinoso', exfoliacion: 'Fractura irregular; convexa', yacimiento: 'Placeres con zircón; fuente de tierras raras y torio.' },
    ],
  },
]

/* Silicatos: la clase mayoritaria de la corteza (~80 %). Subclases según
   la disposición de los tetraedros SiO₄ (estructura de Bragg-Goldschmidt). */
const SILICATOS: { id: string; nombre: string; estructura: string; minerales: Mineral[] }[] = [
  {
    id: 'neso',
    nombre: 'Nesosilicatos',
    estructura: 'Tetraedros aislados SiO₄ (sin compartir oxígenos)',
    minerales: [
      { nombre: 'Olivino', formula: '(Mg,Fe)₂SiO₄', mohs: '6,5–7', color: 'Verde oliva a amarillento', raya: 'Incolora', brillo: 'Vítreo', exfoliacion: 'Imperfecta {010}; fractura concoidal', yacimiento: 'Ricas en Mg de manto (peridotitas, basaltos); gema peridoto.' },
      { nombre: 'Granate (almandino-piropo)', formula: '(Fe,Mg,Ca)₃Al₂Si₃O₁₂', mohs: '6,5–7,5', color: 'Rojo, rosa, verde o marrón', raya: 'Incolora', brillo: 'Vítreo a resinoso', exfoliacion: 'Ausente; fractura concoidal, cristales rombododecaédricos', yacimiento: 'Esquistos, gneises y skarns; indicador de grado metamórfico y gema.' },
      { nombre: 'Circón', formula: 'ZrSiO₄', mohs: '7,5', color: 'Marrón rojizo a incoloro', raya: 'Incolora', brillo: 'Adamantino', exfoliacion: 'Imperfecta; cristales bipiramidales', yacimiento: 'Placeres y rocas ácidas; datación geológica y gema.' },
      { nombre: 'Almandino', formula: 'Fe₃Al₂Si₃O₁₂', mohs: '7–7,5', color: 'Rojo oscuro', raya: 'Incolora', brillo: 'Vítreo', exfoliacion: 'Ausente', yacimiento: 'Esquistos micáceos; el granate más común.' },
      { nombre: 'Piropo', formula: 'Mg₃Al₂Si₃O₁₂', mohs: '7–7,5', color: 'Rojo sangre a negro', raya: 'Incolora', brillo: 'Vítreo', exfoliacion: 'Ausente', yacimiento: 'Peridotitas y eclogitas; gema de alto valor.' },
      { nombre: 'Andalucita', formula: 'Al₂SiO₅', mohs: '6,5–7,5', color: 'Rosa grisácea a parda; macula negra en cruz', raya: 'Incolora', brillo: 'Vítreo', exfoliacion: 'Perfecta {110}', yacimiento: 'Esquistos de contacto; refractarios (mullita).' },
      { nombre: 'Cianita (distaena)', formula: 'Al₂SiO₅', mohs: '4–7 (anisotropía extrema)', color: 'Azul pálido a blanco', raya: 'Incolora', brillo: 'Vítreo', exfoliacion: 'Perfecta {100}; cristales cuchillo', yacimiento: 'Esquistos de alta presión; indicador de facies.' },
      { nombre: 'Silimanita', formula: 'Al₂SiO₅', mohs: '6–7', color: 'Blanca a parda, acicular', raya: 'Incolora', brillo: 'Vítreo', exfoliacion: 'Perfecta {010}', yacimiento: 'Gneises de alto grado; fibra cerámica.' },
      { nombre: 'Estaurolita', formula: 'Fe₂Al₉(SiO₄)₄(OH)₂', mohs: '7–7,5', color: 'Pardo rojizo oscuro', raya: 'Incolora', brillo: 'Resinoso', exfoliacion: 'Subconcoidea; maclas en cruz', yacimiento: 'Esquistos de medio grado; indicador de facies.' },
      { nombre: 'Topacio', formula: 'Al₂SiO₄(F,OH)₂', mohs: '8', color: 'Amarillo, azul, incoloro, rosa', raya: 'Incolora', brillo: 'Vítreo', exfoliacion: 'Perfecta {001}', yacimiento: 'Pegmatitas y greisen; gema clásica.' },
      { nombre: 'Titanita (esfena)', formula: 'CaTiSiO₅', mohs: '5–5,5', color: 'Verde a marrón', raya: 'Blanca', brillo: 'Resinoso a adamantino', exfoliacion: 'Buena {100}; cristales en cuña', yacimiento: 'Rocas ígneas y metamórficas; datación U-Pb.' },
    ],
  },
  {
    id: 'soro',
    nombre: 'Sorosilicatos',
    estructura: 'Pares de tetraedros Si₂O₇ (comparten un oxígeno)',
    minerales: [
      { nombre: 'Epidota', formula: 'Ca₂(Al,Fe)₃(SiO₄)₃(OH)', mohs: '6–7', color: 'Verde pistacho característico', raya: 'Incolora', brillo: 'Vítreo', exfoliacion: 'Perfecta {001}; cristales alargados estriados', yacimiento: 'Skarns, esquistos verdes y vetas; indicador de alteración hidrotermal.' },
      { nombre: 'Hemimorfita', formula: 'Zn₄Si₂O₇(OH)₂·H₂O', mohs: '4,5–5', color: 'Blanca a azul verdosa', raya: 'Blanca', brillo: 'Vítreo a perlado', exfoliacion: '—', yacimiento: 'Zona de oxidación de esfalerita; mena secundaria de zinc.' },
      { nombre: 'Lawsonita', formula: 'CaAl₂(Si₂O₇)(OH)₂·H₂O', mohs: '6–7', color: 'Blanco azulado a gris', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Buena', yacimiento: 'Basaltos metamorfoseados en alto P y baja T; indicador de subducción.' },
    ],
  },
  {
    id: 'ciclo',
    nombre: 'Ciclosilicatos',
    estructura: 'Anillos cerrados Si₆O₁₈ (comparten dos oxígenos)',
    minerales: [
      { nombre: 'Turmalina', formula: '(Na,Ca)(Li,Mg,Al)₃Al₆(Si₆O₁₈)(BO₃)₃(OH)₄', mohs: '7–7,5', color: 'Negro (schorl), rosa, verde, azul', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Imperfecta {110}; cristales prismáticos triangulares', yacimiento: 'Pegmatitas y granitoides; gema y polarizador óptico.' },
      { nombre: 'Berilo', formula: 'Be₃Al₂Si₆O₁₈', mohs: '7,5–8', color: 'Verde (esmeralda), azul (aguamarina)', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Imperfecta {0001}; cristales hexagonales', yacimiento: 'Pegmatitas; esmeralda y aguamarina, y mena de berilio.' },
      { nombre: 'Cordierita', formula: 'Mg₂Al₄Si₅O₁₈', mohs: '7–7,5', color: 'Azul grisáceo a amarillento; pleocroísmo fuerte', raya: 'Incolora', brillo: 'Vítreo', exfoliacion: 'Imperfecta {010}', yacimiento: 'Esquistos de contacto de baja presión; indicador de facies.' },
    ],
  },
  {
    id: 'ino',
    nombre: 'Inosilicatos',
    estructura: 'Cadenas simples (piroxenos) o dobles (anfíboles) de tetraedros',
    minerales: [
      { nombre: 'Augita', formula: '(Ca,Na)(Mg,Fe,Al,Ti)(Si,Al)₂O₆', mohs: '5,5–6', color: 'Verde oscuro a negro', raya: 'Gris verdoso claro', brillo: 'Vítreo', exfoliacion: 'Buena {110} a ~87°', yacimiento: 'Mineral esencial de basaltos y gabros (clinopiroxeno).' },
      { nombre: 'Diópsido', formula: 'CaMgSi₂O₆', mohs: '5,5–6,5', color: 'Verde claro a incoloro', raya: 'Blanca a verde', brillo: 'Vítreo', exfoliacion: 'Buena {110}', yacimiento: 'Mármoles y skarns; gema en cristales transparentes.' },
      { nombre: 'Enstatita', formula: 'Mg₂Si₂O₆', mohs: '5,5–6', color: 'Verde parduzco a marrón', raya: 'Gris clara', brillo: 'Vítreo', exfoliacion: 'Buena {210} a ~93° (ortopiroxeno)', yacimiento: 'Peridotitas y noritas; mineral del manto.' },
      { nombre: 'Espodumena', formula: 'LiAlSi₂O₆', mohs: '6,5–7', color: 'Blanca, rosada (kunzita), verde (hiddenita)', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {110}', yacimiento: 'Pegmatitas de litio; principal mena de Li y gema.' },
      { nombre: 'Hornblenda', formula: 'Ca₂(Mg,Fe,Al)₅(Al,Si)₈O₂₂(OH)₂', mohs: '5–6', color: 'Verde oscuro a negro', raya: 'Gris verdosa', brillo: 'Vítreo', exfoliacion: 'Perfecta {110} a ~56° y 124°', yacimiento: 'El anfíbol más común en dioritas, anfibolitas y esquistos.' },
      { nombre: 'Actinolita-tremolita', formula: 'Ca₂(Mg,Fe)₅Si₈O₂₂(OH)₂', mohs: '5–6', color: 'Blanco (tremolita) a verde (actinolita)', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {110}', yacimiento: 'Metabasaltos y mármoles; fibra de asbesto y gema (nefrita).' },
      { nombre: 'Crisótilo (asbesto)', formula: 'Mg₃Si₂O₅(OH)₄', mohs: '2,5–3', color: 'Blanco verdoso, fibroso sedoso', raya: 'Blanca', brillo: 'Sedoso', exfoliacion: 'Flexible en fibras', yacimiento: 'Serpentinitas; históricamente aislante (hoy restringido por toxicidad).' },
    ],
  },
  {
    id: 'filo',
    nombre: 'Filosilicatos',
    estructura: 'Láminas Si₄O₁₀ (mica, talco, clorita, arcillas)',
    minerales: [
      { nombre: 'Muscovita', formula: 'KAl₂(AlSi₃O₁₀)(OH)₂', mohs: '2–2,5', color: 'Incolora, plateada, amarillenta', raya: 'Blanca', brillo: 'Vítreo a perlado', exfoliacion: 'Perfecta basal {001}; láminas elásticas', yacimiento: 'Granitos, esquistos y pegmatitas; aislante eléctrico.' },
      { nombre: 'Biotita', formula: 'K(Mg,Fe)₃AlSi₃O₁₀(OH)₂', mohs: '2,5–3', color: 'Negra a marrón oscuro', raya: 'Blanca a gris', brillo: 'Perlado', exfoliacion: 'Perfecta basal; láminas elásticas', yacimiento: 'Granitoides y esquistos; principal mica oscura.' },
      { nombre: 'Clorita', formula: '(Mg,Al,Fe)₆(Si,Al)₄O₁₀(OH)₈', mohs: '2–2,5', color: 'Verde (muy verde)', raya: 'Blanca', brillo: 'Perlado', exfoliacion: 'Perfecta basal; láminas no elásticas', yacimiento: 'Esquistos verdes y zonas alteradas de bajo grado.' },
      { nombre: 'Lepidolita', formula: 'K(Li,Al)₃(Si,Al)₄O₁₀(OH)₂', mohs: '2,5–4', color: 'Rosa a lila', raya: 'Blanca', brillo: 'Perlado', exfoliacion: 'Perfecta basal', yacimiento: 'Pegmatitas de litio; mena de Li, Rb y Cs.' },
      { nombre: 'Talco', formula: 'Mg₃Si₄O₁₀(OH)₂', mohs: '1', color: 'Blanco a verde pálido', raya: 'Blanca', brillo: 'Perlado a ceroso', exfoliacion: 'Perfecta basal; se siente jabonoso y rayable con la uña', yacimiento: 'Metamorfismo magnésico (esteatitas); polvos y papel.' },
      { nombre: 'Caolinita', formula: 'Al₂Si₂O₅(OH)₄', mohs: '2–2,5', color: 'Blanca, terrosa', raya: 'Blanca', brillo: 'Terroso a nacarado', exfoliacion: 'Perfecta {001}; no plástica al humedecer', yacimiento: 'Alteración de feldespatos (kaolin); porcelana y papel.' },
      { nombre: 'Montmorillonita', formula: '(Na,Ca)₀,₃(Al,Mg)₂Si₄O₁₀(OH)₂·nH₂O', mohs: '1–2', color: 'Blanca a verde pálida', raya: 'Blanca', brillo: 'Terroso', exfoliacion: 'Expandible; MUY plástica al humedecer', yacimiento: 'Arcilla de bentonita; perforación, cerámica y sellado.' },
    ],
  },
  {
    id: 'tecto',
    nombre: 'Tectosilicatos',
    estructura: 'Red tridimensional SiO₂ con Al (cuarzo, feldespatos, feldespatoides)',
    minerales: [
      { nombre: 'Cuarzo', formula: 'SiO₂', mohs: '7', color: 'Inciso a blanco (lechoso), ahumado, amatista, citrino', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Ausente; fractura concoidal', yacimiento: 'El mineral más común de la corteza continental; vidrio, relojes y gemas.' },
      { nombre: 'Ortoclasa', formula: 'KAlSi₃O₈', mohs: '6', color: 'Rosa, salmón o blanco', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {001} y {010} a 90°', yacimiento: 'Feldespato potásico de granitos y gneises; cerámica y vidrio.' },
      { nombre: 'Microclina', formula: 'KAlSi₃O₈', mohs: '6–6,5', color: 'Blanco a gris azulado; amazonita verde', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {001} y {010}; macla enrejado visible', yacimiento: 'Granitos y pegmatitas; amazonita como gema.' },
      { nombre: 'Plagioclasa (albita-anortita)', formula: 'NaAlSi₃O₈–CaAl₂Si₂O₈', mohs: '6–6,5', color: 'Blanca a gris; estrías de maclado visibles', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {001} y {010}; estrías paralelas', yacimiento: 'Feldespato de basaltos a granitos; cerámica.' },
      { nombre: 'Nefelina', formula: 'Na₃KAl₄Si₄O₁₆', mohs: '5,5–6', color: 'Blanca a gris; grasa al tacto', raya: 'Blanca', brillo: 'Vítreo a grasiento', exfoliacion: 'Pobre {001}', yacimiento: 'Sienitas nefelínicas; vidrio y cerámica, nunca con cuarzo.' },
      { nombre: 'Leucita', formula: 'KAlSi₂O₆', mohs: '5,5–6', color: 'Blanca a gris', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Pobre; trapezoedros como «gajos de naranja»', yacimiento: 'Lavas potásicas (basanitas); indicador de K alto.' },
      { nombre: 'Sanidina', formula: 'KAlSi₃O₈', mohs: '6', color: 'Incolora a blanca', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {001} y {010}', yacimiento: 'Feldespato potásico de lavas hipersólidas (riolitas).' },
    ],
  },
]

const ORGANICOS: Mineral[] = [
  { nombre: 'Ámbar', formula: 'C₁₀H₁₆O (resina fósil)', mohs: '2–2,5', color: 'Amarillo a marrón rojizo', raya: 'Blanca', brillo: 'Resinoso', exfoliacion: 'Fractura concoidal; flota en agua salada', yacimiento: 'Resinas fósiles del Eoceno (Báltico); gema con inclusiones.' },
  { nombre: 'Mellite', formula: 'Al₂C₆(COO)₆·16H₂O', mohs: '2–2,5', color: 'Amarillo a miel', raya: 'Blanca', brillo: 'Resinoso', exfoliacion: '—', yacimiento: 'Alteración de lignito en tobas; mineral raro de turberas.' },
  { nombre: 'Asfalto (bitumen)', formula: 'Mezcla de hidrocarburos', mohs: '1–2', color: 'Negro', raya: 'Marrón oscura', brillo: 'Grasiento', exfoliacion: 'Fractura concoidal; inflamable', yacimiento: 'Filtraciones petrolíferas y lagos asfálticos; pavimento.' },
  { nombre: 'Whewellita (oxalato cálcico)', formula: 'CaC₂O₄·H₂O', mohs: '2,5–3', color: 'Blanco a amarillento', raya: 'Blanca', brillo: 'Vítreo', exfoliacion: 'Perfecta {101}', yacimiento: 'Cristales en hulla y cavidades sedimentarias; raro en sedimentos.' },
]

function MineralTable({ minerales }: { minerales: Mineral[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5 font-semibold">Mineral</th>
            <th className="px-3 py-2.5 font-semibold">Fórmula</th>
            <th className="px-3 py-2.5 font-semibold">Mohs</th>
            <th className="px-3 py-2.5 font-semibold">Color</th>
            <th className="px-3 py-2.5 font-semibold">Raya</th>
            <th className="px-3 py-2.5 font-semibold">Brillo</th>
            <th className="px-3 py-2.5 font-semibold">Exfoliación / fractura</th>
            <th className="px-3 py-2.5 font-semibold">Yacimiento y usos</th>
          </tr>
        </thead>
        <tbody>
          {minerales.map((m, i) => (
            <tr key={m.nombre} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/25'}>
              <td className="px-3 py-2 font-medium">{m.nombre}</td>
              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{m.formula}</td>
              <td className="px-3 py-2">
                <Badge variant="secondary" className="font-mono text-xs">{m.mohs}</Badge>
              </td>
              <td className="px-3 py-2">{m.color}</td>
              <td className="px-3 py-2">{m.raya}</td>
              <td className="px-3 py-2">{m.brillo}</td>
              <td className="px-3 py-2">{m.exfoliacion}</td>
              <td className="px-3 py-2 text-muted-foreground">{m.yacimiento}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function MineralesPanel() {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Clasificación química de Strunz–Dana (Manual de Mineralogía, Klein & Hurlbut)</AlertTitle>
        <AlertDescription>
          Los minerales se agrupan por el <strong>anión o grupo aniónico dominante</strong>, porque los que
          comparten anión se parecen más entre sí (color, raya, brillo, yacimiento) que los que comparten
          catión. Cada ficha resume las propiedades diagnósticas de muestra de mano: fórmula, dureza Mohs,
          color, raya, brillo, exfoliación y yacimiento con sus usos.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="nativos" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:grid-cols-5">
          {GRUPOS.map((g) => (
            <TabsTrigger key={g.id} value={g.id} className="whitespace-normal px-2 py-1.5 text-xs leading-tight">
              {g.nombre}
            </TabsTrigger>
          ))}
          <TabsTrigger value="silicatos" className="whitespace-normal px-2 py-1.5 text-xs leading-tight">
            Silicatos
          </TabsTrigger>
          <TabsTrigger value="organicos" className="whitespace-normal px-2 py-1.5 text-xs leading-tight">
            Minerales orgánicos
          </TabsTrigger>
        </TabsList>

        {GRUPOS.map((g) => (
          <TabsContent key={g.id} value={g.id}>
            <Card className="card-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gem className="h-5 w-5 text-primary" />
                  {g.nombre}
                </CardTitle>
                <CardDescription>{g.resumen}</CardDescription>
              </CardHeader>
              <CardContent>
                <MineralTable minerales={g.minerales} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="silicatos">
          <Card className="card-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gem className="h-5 w-5 text-primary" />
                Silicatos
              </CardTitle>
              <CardDescription>
                La clase más abundante de la corteza terrestre (~80 % de los minerales conocidos).
                Se subdividen según la disposición estructural de los tetraedros SiO₄ (criterio de
                Bragg-Goldschmidt): aislados, en pares, en anillos, en cadenas, en láminas o en red.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="neso" className="w-full">
                <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-6">
                  {SILICATOS.map((s) => (
                    <TabsTrigger key={s.id} value={s.id} className="px-2 py-1.5 text-xs">
                      {s.nombre}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {SILICATOS.map((s) => (
                  <TabsContent key={s.id} value={s.id}>
                    <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Table2 className="h-4 w-4" /> {s.estructura}
                    </p>
                    <MineralTable minerales={s.minerales} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organicos">
          <Card className="card-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gem className="h-5 w-5 text-primary" />
                Minerales orgánicos
              </CardTitle>
              <CardDescription>
                Sustancias de origen biogénico (resinas, hidrocarburos y sales orgánicas) que cumplen la
                definición de mineral: sólidas, naturales y con composición definida.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MineralTable minerales={ORGANICOS} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
