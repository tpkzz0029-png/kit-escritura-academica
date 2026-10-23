import { analyzeText } from './src/lib/aiDetect.ts'
import { humanizeText } from './src/lib/humanize.ts'

const geologia = `La Tierra: Un archivo vivo en constante transformación
La geología es mucho más que el estudio de las rocas y los minerales; es la ciencia que nos permite leer la biografía secreta de nuestro planeta. Bajo nuestros pies, la Tierra no es un cuerpo estático ni inerte, sino una máquina térmica colosal impulsada por el calor interno y la gravedad. Cada estrato de roca, cada cadena montañosa y cada grano de arena guarda la memoria de eventos que ocurrieron hace millones de años.

Los tres grandes pilares de la geología
Para comprender cómo funciona este sistema dinámico, los geólogos estudian tres procesos fundamentales:

La tectónica de placas: La litosfera terrestre está fragmentada en gigantescas piezas que flotan sobre el manto superior. Su lento pero implacable movimiento choca, se separa y se desliza, dando origen a la cordilleras más imponentes, a las fosas oceánicas más profundas y desencadenando la actividad volcánica y sísmica.

El ciclo de las rocas: Las rocas no son permanentes. A través de un ciclo continuo que dura millones de años, el magma se enfría para formar rocas ígneas, la erosión las desintegra y acumula en rocas sedimentarias, y el calor y la presión extrema las transforman en rocas metamórficas antes de fundirlas de nuevo.

El tiempo geológico: Para entender la Tierra es necesario expandir nuestra mente hacia la "profundidad del tiempo". La escala geológica divide los 4.540 millones de años de historia terrestre en eones, eras y periodos, donde la presencia humana apenas representa un parpadeo en el último segundo de ese gran reloj cósmico.`

const iaText = `La tecnología desempeña un papel fundamental en la sociedad actual. Es importante destacar que los avances digitales han transformado la manera en que las personas interactúan entre sí. Además, la inteligencia artificial juega un papel crucial en diversos ámbitos de la vida cotidiana. En el mundo actual, resulta esencial comprender el impacto de estos cambios en el desarrollo humano. Por lo tanto, las instituciones deben adaptarse a esta nueva realidad constante. La educación, la salud y el trabajo experimentan una transformación profunda y significativa. Cabe señalar que estos procesos ofrecen oportunidades sin precedentes para la sociedad. Sin embargo, también plantean desafíos que es necesario abordar con responsabilidad. En conclusión, la colaboración entre diferentes sectores resulta indispensable para aprovechar todo el potencial de estas herramientas innovadoras de manera efectiva y sostenible.`

const show = (r: ReturnType<typeof analyzeText>) =>
  r.metrics.map((m) => `${m.key}=${m.aiScore}`).join('  ')

const before = analyzeText(geologia)
console.log('GEOLOGIA (motor estricto):', before.overallScore + '% |', show(before))

const fixedMR = humanizeText(geologia, { varyRhythm: true, fix: { metaphors: true } })
const afterMR = analyzeText(fixedMR)
console.log(' -> acomodando metáforas + ritmo:', afterMR.overallScore + '% |', show(afterMR))

const fixedM = humanizeText(geologia, { varyRhythm: false, fix: { metaphors: true } })
const afterM = analyzeText(fixedM)
console.log(' -> solo metáforas:', afterM.overallScore + '% |', show(afterM))

const beforeIA = analyzeText(iaText)
console.log('IA PLANTILLA (estricto):', beforeIA.overallScore + '% |', show(beforeIA))
const fixedIA = humanizeText(iaText, {
  varyRhythm: true,
  fix: { phrases: true, connectors: true, repetition: true, metaphors: true },
})
const afterIA = analyzeText(fixedIA)
console.log(' -> acomodado completo:', afterIA.overallScore + '% |', show(afterIA))

const prueba = 'El agua del planeta es vida. La mano del hombre construye. Es un problema del sistema y del programa actual.'
const out = humanizeText(prueba, { varyRhythm: false, fix: { repetition: true } })
console.log('\nPrueba concordancia (debe quedar idéntico):')
console.log('  in :', prueba)
console.log('  out:', out)
