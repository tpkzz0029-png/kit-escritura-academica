import { analyzeText, debugStats } from './src/lib/aiDetect.ts'

const geologia = `La Tierra: Un archivo vivo en constante transformación
La geología es mucho más que el estudio de las rocas y los minerales; es la ciencia que nos permite leer la biografía secreta de nuestro planeta. Bajo nuestros pies, la Tierra no es un cuerpo estático ni inerte, sino una máquina térmica colosal impulsada por el calor interno y la gravedad. Cada estrato de roca, cada cadena montañosa y cada grano de arena guarda la memoria de eventos que ocurrieron hace millones de años.

Los tres grandes pilares de la geología
Para comprender cómo funciona este sistema dinámico, los geólogos estudian tres procesos fundamentales:

La tectónica de placas: La litosfera terrestre está fragmentada en gigantescas piezas que flotan sobre el manto superior. Su lento pero implacable movimiento choca, se separa y se desliza, dando origen a la cordilleras más imponentes, a las fosas oceánicas más profundas y desencadenando la actividad volcánica y sísmica.

El ciclo de las rocas: Las rocas no son permanentes. A través de un ciclo continuo que dura millones de años, el magma se enfría para formar rocas ígneas, la erosión las desintegra y acumula en rocas sedimentarias, y el calor y la presión extrema las transforman en rocas metamórficas antes de fundirlas de nuevo.

El tiempo geológico: Para entender la Tierra es necesario expandir nuestra mente hacia la "profundidad del tiempo". La escala geológica divide los 4.540 millones de años de historia terrestre en eones, eras y periodos, donde la presencia humana apenas representa un parpadeo en el último segundo de ese gran reloj cósmico.`

const iaText = `La tecnología desempeña un papel fundamental en la sociedad actual. Es importante destacar que los avances digitales han transformado la manera en que las personas interactúan entre sí. Además, la inteligencia artificial juega un papel crucial en diversos ámbitos de la vida cotidiana. En el mundo actual, resulta esencial comprender el impacto de estos cambios en el desarrollo humano. Por lo tanto, las instituciones deben adaptarse a esta nueva realidad constante. La educación, la salud y el trabajo experimentan una transformación profunda y significativa. Cabe señalar que estos procesos ofrecen oportunidades sin precedentes para la sociedad. Sin embargo, también plantean desafíos que es necesario abordar con responsabilidad. En conclusión, la colaboración entre diferentes sectores resulta indispensable para aprovechar todo el potencial de estas herramientas innovadoras de manera efectiva y sostenible.`

const humano2 = `Cuando era niño, mi abuelo me enseñó a pescar en el río que pasaba detrás de su casa. No usábamos más que una caña vieja, unos gusanos que sacábamos de la tierra húmeda del huerto y mucha paciencia. Me decía que el pez no muerde si siente prisa en la mano que sostiene la línea, y con los años entendí que hablaba de la vida en general. Aquellas tardes de verano, con el sol cayendo detrás de los chopos, no pesaban ni un gramo en la memoria. Todavía conservo la caña, aunque ya no pesco: la tengo colgada en el despacho, y cada vez que la miro recuerdo sus manos curtidas y su manera de reírse de mis impaciencias.`

for (const [name, t] of [['GEOLOGIA(humano)', geologia], ['IA(moldes)', iaText], ['HUMANO2(narrativa)', humano2]] as const) {
  const r = analyzeText(t)
  const s = debugStats(t)
  console.log(`\n=== ${name} ===`)
  console.log('overall:', r.overallScore, '| stats:', JSON.stringify(s))
  console.log(r.metrics.map((m) => `${m.key}=${m.aiScore}`).join('  '))
}
