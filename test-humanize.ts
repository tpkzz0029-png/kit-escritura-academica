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

for (const [name, t] of [['GEOLOGIA', geologia], ['IA', iaText]] as const) {
  const before = analyzeText(t)
  const hum = humanizeText(t, { varyRhythm: true })
  const after = analyzeText(hum)
  console.log(`\n=== ${name}: ${before.overallScore}% -> ${after.overallScore}% ===`)
  console.log('ANTES :', before.metrics.map((m) => `${m.key}=${m.aiScore}`).join('  '))
  console.log('DESPUÉS:', after.metrics.map((m) => `${m.key}=${m.aiScore}`).join('  '))
  console.log('TEXTO HUMANIZADO (primeros 400):', hum.slice(0, 400))
}
