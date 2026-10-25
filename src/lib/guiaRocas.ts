/* Fichas de referencia de cada roca (identificación y ambiente de formación).
   Redacción propia, basada en la «Guía de rocas 1: conocimientos básicos»
   (archivo GUIAROCAS_1_conocimientos_basicos). */

export type FichaRoca = {
  id: string
  nombre: string
  clase: string
  identificacion: string
  ambiente: string
}

export const GUIA: Record<string, FichaRoca> = {
  granito: {
    id: 'granito',
    nombre: 'Granito',
    clase: 'Roca ígnea plutónica granítica',
    identificacion:
      'Es una roca masiva, leucocrática y de textura granular, formada esencialmente por cuarzo (entre 20 y 60 %), feldespato alcalino y plagioclasa. Como accesorios aparecen micas (moscovita y biotita) y, con menor frecuencia, anfíboles como la hornblenda.',
    ambiente:
      'Se origina por el enfriamiento lento y la consolidación en profundidad de magmas ricos en sílice; esa lentitud permite que los cristales crezcan hasta hacerse visibles. Las variaciones entre granitos reflejan diferencias en la composición del magma original. Es la roca plutónica más abundante de la corteza continental.',
  },
  'granito-alcalino': {
    id: 'granito-alcalino',
    nombre: 'Granito de feldespato alcalino',
    clase: 'Roca ígnea plutónica granítica',
    identificacion:
      'Roca masiva de textura granular con cristales visibles a simple vista, dominada por feldespato alcalino (40–80 %) y cuarzo (20–60 %), con menos de un 10 % de plagioclasa. Su tono rosado a rojizo procede del feldespato potásico, mientras que el cuarzo se distingue por su color grisáceo y brillo vítreo. Al tener menos de un 35 % de minerales oscuros se considera leucocrática.',
    ambiente:
      'Cristaliza lentamente en profundidad a partir de magmas ricos en volátiles. Suele ocupar las zonas laterales y apicales (cúpulas) de los complejos graníticos.',
  },
  sienita: {
    id: 'sienita',
    nombre: 'Sienita',
    clase: 'Roca ígnea plutónica sienítica',
    identificacion:
      'Roca granular de grano visible compuesta esencialmente por feldespato alcalino, con plagioclasa subordinada y muy poco o ningún cuarzo. Puede llevar feldespatoides (nefelina), piroxeno, anfíbol, micas y, ocasionalmente, olivino.',
    ambiente:
      'Se forma como el granito, por cristalización lenta de un magma en profundidad, pero a partir de magmas más pobres en sílice, por lo que apenas cristaliza cuarzo.',
  },
  granodiorita: {
    id: 'granodiorita',
    nombre: 'Granodiorita',
    clase: 'Roca ígnea plutónica granítica',
    identificacion:
      'Roca masiva granular con cristales visibles de tamaño variable (aproximadamente de 2 a 30 mm). Contiene cuarzo (20–60 %) y alrededor del doble de plagioclasa que de feldespato alcalino, con una presencia notable de máficos como biotita, anfíbol y piroxeno.',
    ambiente:
      'Procede de la cristalización lenta en profundidad de magmas hidratados y relativamente ricos en sílice. Es típica de cinturones orogénicos, donde la corteza ha sido deformada y fracturada.',
  },
  anortosita: {
    id: 'anortosita',
    nombre: 'Anortosita',
    clase: 'Roca ígnea plutónica anortosítica',
    identificacion:
      'Roca granular de grano visible formada por más de un 90 % de plagioclasa, predominantemente cálcica, que le da un tono blanquecino a grisáceo. Es leucocrática (menos del 10 % de minerales oscuros) y suele aparecer asociada a gabros y dioritas.',
    ambiente:
      'Cristaliza en profundidad a partir de magmas ricos en plagioclasa, a menudo en forma de niveles estratificados dentro de grandes intrusiones, y es frecuente en zonas orogénicas antiguas.',
  },
  gabro: {
    id: 'gabro',
    nombre: 'Gabro',
    clase: 'Roca ígnea plutónica gabroica',
    identificacion:
      'Roca plutónica masiva y granular, melanocrática, compuesta por plagioclasa cálcica y piroxeno, con olivino y anfíbol en cantidades variables. Como accesorios puede tener magnetita, ilmenita y apatito.',
    ambiente:
      'Es el equivalente plutónico del basalto: cristaliza en cámaras magmáticas a partir de magmas máficos. Aparece en dorsales y rifts oceánicos, rifts continentales, islas oceánicas y zonas de subducción.',
  },
  diorita: {
    id: 'diorita',
    nombre: 'Diorita',
    clase: 'Roca ígnea plutónica intermedia',
    identificacion:
      'Roca granular de grano visible y aspecto moteado en blanco y negro, formada por plagioclasa sódico-cálcica con anfíbol, biotita y piroxeno; el cuarzo es escaso o ausente. Es mesocrática.',
    ambiente:
      'Cristaliza lentamente en profundidad a partir de magmas intermedios, típicos de arcos magmáticos asociados a zonas de subducción.',
  },
  peridotita: {
    id: 'peridotita',
    nombre: 'Peridotita',
    clase: 'Roca ígnea plutónica ultramáfica',
    identificacion:
      'Roca densa, melanocrática y granular, con más de un 90 % de minerales máficos; el olivino supera la mitad de la roca y se acompaña de piroxenos y/o anfíboles. Puede contener espinela, cromita, granate o magnetita.',
    ambiente:
      'Es la roca principal del manto superior. Aflora en macizos ofiolíticos o como xenolitos arrastrados por magmas, y también puede formarse por acumulación de olivino y piroxeno en cámaras magmáticas. Su fusión parcial genera los magmas basálticos primarios.',
  },
  porfido: {
    id: 'porfido',
    nombre: 'Pórfido',
    clase: 'Roca ígnea subvolcánica (hipabisal)',
    identificacion:
      'Roca masiva de textura porfídica: fenocristales dispersos en una matriz microcristalina o vítrea. Su color depende sobre todo de la matriz, y toma el nombre de su equivalente plutónico (pórfido granítico, pórfido sienítico, etc.).',
    ambiente:
      'Resulta de una cristalización en dos etapas: primero lenta en profundidad, cuando crecen los fenocristales, y después rápida al ascender el magma por fracturas hacia niveles someros, cuando se forma la matriz. Es habitual en regiones con magmatismo abundante, como los márgenes convergentes.',
  },
  basalto: {
    id: 'basalto',
    nombre: 'Basalto',
    clase: 'Roca ígnea volcánica (lava)',
    identificacion:
      'Roca gris oscura a negra en fresco, microcristalina, masiva y rugosa al tacto. Puede mostrar fenocristales de olivino (verdes) y piroxeno (negros), y vesículas dejadas por los gases, vacías o rellenas de minerales secundarios (amígdalas).',
    ambiente:
      'Se forma cuando un magma máfico, pobre en sílice y generado por fusión del manto superior, alcanza la superficie a unos 1100–1250 °C y se enfría con rapidez. Es característico de dorsales oceánicas y de puntos calientes oceánicos o continentales.',
  },
  'lava-cordada': {
    id: 'lava-cordada',
    nombre: 'Lava cordada',
    clase: 'Roca ígnea volcánica (lava)',
    identificacion:
      'Lava de composición generalmente basáltica, oscura y de grano fino (afanítica), con superficie en cuerdas y abundantes vesículas alargadas. El interior es oscuro y la costra externa rojiza por oxidación del hierro.',
    ambiente:
      'Se forma a partir de coladas basálticas muy fluidas que avanzan en pequeños lóbulos; al arrugarse la costra todavía plástica se generan las estructuras cordadas.',
  },
  andesita: {
    id: 'andesita',
    nombre: 'Andesita',
    clase: 'Roca ígnea volcánica intermedia',
    identificacion:
      'Lava de color gris medio, afanítica y frecuentemente porfídica, con fenocristales de plagioclasa, anfíbol o piroxeno en una matriz fina.',
    ambiente:
      'Es la lava típica de los estratovolcanes de arcos magmáticos, generada por magmas intermedios en zonas de subducción.',
  },
  riolita: {
    id: 'riolita',
    nombre: 'Riolita',
    clase: 'Roca ígnea volcánica félsica',
    identificacion:
      'Roca masiva y clara (félsica), con tonos rosados, amarillentos, grisáceos o verdosos según su mineralogía. Es afanítica, con cristales menores de 1 mm, y si presenta fenocristales en una matriz vítrea o microcristalina su textura es porfídica.',
    ambiente:
      'Procede de magmas félsicos con más de un 63 % de SiO₂ y temperaturas de 700–850 °C. En erupciones efusivas la lava, muy viscosa, se enfría rápido sin desplazarse mucho; en erupciones explosivas da lugar a piroclastos.',
  },
  obsidiana: {
    id: 'obsidiana',
    nombre: 'Obsidiana',
    clase: 'Roca ígnea volcánica vítrea',
    identificacion:
      'Roca negra en fresco, de textura vítrea y fractura concoidea. No está formada por minerales sino por vidrio volcánico amorfo, aunque puede incluir algún cristal; es dura y raya el vidrio.',
    ambiente:
      'Se forma cuando una lava, normalmente félsica y rica en sílice, se enfría tan deprisa al llegar a la superficie que sus componentes no tienen tiempo de cristalizar.',
  },
  piroclastos: {
    id: 'piroclastos',
    nombre: 'Piroclastos (tefra)',
    clase: 'Roca ígnea volcánica fragmentaria',
    identificacion:
      'Fragmentos expulsados en erupciones explosivas, de color oscuro a pardo rojizo por alteración, textura afanítica o vítrea, aspecto rugoso y alta porosidad. Se clasifican por tamaño en ceniza (< 2 mm), lapilli (2–64 mm) y bombas o bloques (> 64 mm), y pueden ser juveniles o líticos.',
    ambiente:
      'Un magma rico en gases se fragmenta en la erupción y sale como material suelto. Las cenizas pueden viajar grandes distancias con el viento, mientras que los fragmentos mayores se acumulan cerca del cráter construyendo el cono volcánico.',
  },
  pumicita: {
    id: 'pumicita',
    nombre: 'Pumicita (pómez)',
    clase: 'Roca ígnea volcánica vítrea vesicular',
    identificacion:
      'Piroclasto claro, de aspecto espumoso o fibroso y brillo sedoso, con textura vítrea y vesicular. Su composición suele ser riolítica y su porosidad, superior al 90 %, hace que flote en el agua.',
    ambiente:
      'Se origina en erupciones explosivas de magmas félsicos y viscosos: la parte externa del magma se enfría bruscamente mientras libera sus gases, dejando vesículas separadas por finas paredes de vidrio.',
  },
  conglomerado: {
    id: 'conglomerado',
    nombre: 'Conglomerado',
    clase: 'Roca sedimentaria detrítica siliciclástica',
    identificacion:
      'Roca formada por clastos de tamaño grava (> 2 mm) cementados, que puede incluir arena, limo y arcilla. Es monomíctico si los clastos proceden de un solo tipo de roca y polimíctico si son de varias; puede estar soportado por clastos o por matriz.',
    ambiente:
      'Los clastos se generan por meteorización y erosión, y se redondean más cuanto mayor es el transporte. Se acumulan en abanicos aluviales, ramblas, cauces fluviales y zonas litorales de alta energía, y después se compactan y cementan.',
  },
  brecha: {
    id: 'brecha',
    nombre: 'Brecha',
    clase: 'Roca sedimentaria detrítica siliciclástica',
    identificacion:
      'Roca detrítica de clastos tamaño grava (> 2 mm) angulosos, cementados en una matriz más fina.',
    ambiente:
      'La angulosidad indica un transporte muy corto: se forma cerca del área fuente, en taludes, depósitos de ladera, zonas de falla o derrumbes.',
  },
  arenisca: {
    id: 'arenisca',
    nombre: 'Arenisca',
    clase: 'Roca sedimentaria detrítica siliciclástica',
    identificacion:
      'Roca compacta y áspera al tacto, formada por granos tamaño arena (entre 1/16 y 2 mm), mayoritariamente de cuarzo, unidos por cemento y a veces con matriz de limo y arcilla. Su color es muy variable y puede mostrar laminación.',
    ambiente:
      'Las arenas se acumulan en abanicos aluviales, ríos, lagos, playas, plataformas marinas o desiertos, y se compactan y cementan durante la diagénesis. La composición y la madurez de los granos informan sobre el área fuente y la energía del transporte.',
  },
  lutita: {
    id: 'lutita',
    nombre: 'Lutita',
    clase: 'Roca sedimentaria detrítica siliciclástica',
    identificacion:
      'Roca de tacto fino a muy fino que puede manchar los dedos, formada por partículas menores de 1/16 mm, sobre todo filosilicatos del grupo de las arcillas. Su color es variable y puede presentar laminación.',
    ambiente:
      'Se deposita en ambientes de baja energía donde decantan limos y arcillas: fondos marinos y lacustres o zonas distales de abanicos aluviales.',
  },
  marga: {
    id: 'marga',
    nombre: 'Marga',
    clase: 'Roca sedimentaria mixta detrítica-carbonatada',
    identificacion:
      'Roca mixta entre caliza y lutita, con aproximadamente un 35–65 % de calcita y el resto arcillas. Es de grano fino, masiva y de aspecto terroso, se erosiona con facilidad, reacciona con el HCl y puede contener fósiles.',
    ambiente:
      'Se forma en aguas tranquilas, marinas o lacustres, de clima cálido, donde el aporte de arcillas coincide con la producción de carbonato. Puede contener foraminíferos, ostrácodos, gasterópodos o carófitas según el medio.',
  },
  caliza: {
    id: 'caliza',
    nombre: 'Caliza',
    clase: 'Roca sedimentaria carbonatada (biogénica-bioquímica)',
    identificacion:
      'Roca con más de un 50 % de carbonato cálcico, esencialmente calcita, que reacciona con el HCl. Puede tener fracción detrítica y fósiles, y se clasifica según la relación entre granos y matriz (Dunham) o por sus componentes (Folk).',
    ambiente:
      'Se origina por acumulación de restos carbonatados de organismos, por precipitación de carbonato inducida biológicamente o por precipitación química cuando el agua pierde CO₂.',
  },
  'caliza-fosilifera': {
    id: 'caliza-fosilifera',
    nombre: 'Caliza fosilífera',
    clase: 'Roca sedimentaria carbonatada (biogénica)',
    identificacion:
      'Caliza con abundantes restos de organismos de esqueleto carbonatado (bivalvos, nummulites, corales…) en una matriz micrítica con cemento y porosidad. Es de color beige a gris, reacciona con el HCl y puede contener fósiles guía.',
    ambiente:
      'Se forma en mares cálidos y poco profundos, donde los organismos fijan carbonato cálcico en sus esqueletos y, al morir, se acumulan en el fondo de la cuenca.',
  },
  dolomia: {
    id: 'dolomia',
    nombre: 'Dolomía',
    clase: 'Roca sedimentaria carbonatada',
    identificacion:
      'Roca carbonatada formada mayoritariamente por dolomita; reacciona débilmente con el HCl en frío, sobre todo cuando se raspa o se pulveriza.',
    ambiente:
      'Suele formarse por dolomitización de calizas previas, cuando fluidos ricos en magnesio reemplazan la calcita durante la diagénesis.',
  },
  espeleotema: {
    id: 'espeleotema',
    nombre: 'Espeleotema',
    clase: 'Roca sedimentaria química carbonatada',
    identificacion:
      'Depósito de carbonato cálcico precipitado en cavidades, con crecimiento en bandas concéntricas: estalactitas, estalagmitas, columnas, coraloides o banderolas.',
    ambiente:
      'El agua cargada de calcio se infiltra por las fisuras y, al gotear en la cueva, pierde CO₂ y precipita calcita en el techo o en el suelo.',
  },
  travertino: {
    id: 'travertino',
    nombre: 'Travertino / toba calcárea',
    clase: 'Roca sedimentaria química-bioquímica carbonatada',
    identificacion:
      'Roca carbonatada concrecionada, blanca, amarillenta o gris, porosa y de estructura esponjosa, que a menudo conserva moldes de tallos, hojas y troncos.',
    ambiente:
      'Precipita en manantiales, fuentes termales y cascadas de zonas kársticas, donde el agua pierde CO₂ bruscamente; la vegetación favorece el proceso y deja poros al descomponerse.',
  },
  yeso: {
    id: 'yeso',
    nombre: 'Roca de yeso',
    clase: 'Roca sedimentaria química (evaporita)',
    identificacion:
      'Evaporita con más de un 50 % de yeso, blanda (se raya con la uña). Con cristales grandes y transparentes se llama selenita; compacta y de grano microscópico, alabastro. Su color depende de las impurezas.',
    ambiente:
      'Se forma en ambientes áridos por evaporación de aguas marinas aisladas o de lagos salinos, que precipitan sulfatos y cloruros.',
  },
  sal: {
    id: 'sal',
    nombre: 'Roca de sal',
    clase: 'Roca sedimentaria química (evaporita)',
    identificacion:
      'Evaporita formada por cloruros solubles (halita, silvita, carnalita), de tacto graso y sabor salado, en capas alternantes con lutitas o anhidrita o en bancos homogéneos. Su color varía con el cloruro dominante y las impurezas.',
    ambiente:
      'Precipita por evaporación intensa en cuencas marinas restringidas o lagunas salinas. Por su baja densidad y plasticidad puede ascender a través de otras rocas formando domos y diapiros salinos.',
  },
  carbon: {
    id: 'carbon',
    nombre: 'Carbón',
    clase: 'Roca sedimentaria orgánica',
    identificacion:
      'Roca negra y carbonosa formada por restos vegetales. Según su contenido en carbono se distingue turba (< 55 %, restos vegetales visibles), lignito (55–75 %, se disgrega y mancha), hulla y antracita (la de mayor rango).',
    ambiente:
      'Requiere acumulación de grandes cantidades de materia vegetal, sobre todo en zonas pantanosas, seguida de enterramiento, compactación y aumento de temperatura durante largo tiempo; el rango aumenta con la profundidad.',
  },
  bauxita: {
    id: 'bauxita',
    nombre: 'Bauxita',
    clase: 'Roca residual (superficial)',
    identificacion:
      'Roca residual de óxidos e hidróxidos de aluminio (> 40 % de Al₂O₃), blanda, ligera y friable, a menudo con pisolitos de menos de 5 mm. Su color varía de blanco a rojo según las impurezas de hierro.',
    ambiente:
      'Se forma por meteorización química intensa de rocas con aluminio en climas tropicales cálidos y húmedos, que lixivian los elementos solubles y concentran el aluminio.',
  },
  pizarra: {
    id: 'pizarra',
    nombre: 'Pizarra',
    clase: 'Roca metamórfica foliada afanítica',
    identificacion:
      'Roca homogénea de grano muy fino, brillo mate y textura lepidoblástica, que se divide en láminas planas gracias a su clivaje pizarroso. Está formada por cuarzo, moscovita, clorita y sericita, y puede tener materia orgánica, grafito u óxidos de hierro.',
    ambiente:
      'Resulta del metamorfismo regional de grado muy bajo de rocas arcillosas en bordes de placas convergentes, ligados a cordilleras con actividad sísmica y volcánica.',
  },
  filita: {
    id: 'filita',
    nombre: 'Filita',
    clase: 'Roca metamórfica foliada afanítica',
    identificacion:
      'Roca foliada de grano fino, intermedia entre pizarra y esquisto, que se distingue por su brillo satinado. Sus minerales son algo mayores que en la pizarra, pero aún no se reconocen a simple vista; la textura es lepidoblástica.',
    ambiente:
      'Se forma por metamorfismo regional de grado bajo a medio de sedimentos arcillosos, asociada a pizarras y esquistos en orógenos de bordes convergentes.',
  },
  'filita-moteada': {
    id: 'filita-moteada',
    nombre: 'Filita moteada',
    clase: 'Roca metamórfica foliada (contacto)',
    identificacion:
      'Filita con abundantes porfiroblastos milimétricos de andalucita, cordierita o biotita que le dan aspecto moteado, conservando la foliación y el grano fino de la roca original.',
    ambiente:
      'Se forma por metamorfismo de contacto: el calor de una intrusión ígnea cercana recristaliza una filita dentro de la aureola metamórfica.',
  },
  esquisto: {
    id: 'esquisto',
    nombre: 'Esquisto',
    clase: 'Roca metamórfica foliada fanerítica',
    identificacion:
      'Roca de grado medio con esquistosidad: los minerales, visibles a simple vista, se orientan en escamas y láminas paralelas por la presión tectónica. Contiene cuarzo, moscovita, biotita y feldespatos, y puede tener granate, estaurolita, cianita, andalucita o silimanita.',
    ambiente:
      'Procede del metamorfismo regional de grado medio en orógenos de bordes convergentes. La mayoría deriva de lutitas, aunque también puede formarse a partir de basaltos.',
  },
  gneis: {
    id: 'gneis',
    nombre: 'Gneis',
    clase: 'Roca metamórfica foliada fanerítica',
    identificacion:
      'Roca de grado alto con foliación irregular y ondulada en bandas alternantes de minerales claros (cuarzo, feldespatos) y oscuros (biotita), de grano visible. Algunos tienen grandes cristales de feldespato o cuarzo (gneis glandular).',
    ambiente:
      'Se forma por metamorfismo regional de alto grado en bordes de placas convergentes. La mayoría procede de rocas ígneas (ortogneis), aunque también puede derivar de sedimentarias (paragneis).',
  },
  corneana: {
    id: 'corneana',
    nombre: 'Corneana',
    clase: 'Roca metamórfica granoblástica poliminerálica',
    identificacion:
      'Roca masiva, densa y dura, de brillo mate, cuyos cristales no muestran orientación preferente (textura en mosaico, decusada). Puede tener porfiroblastos y su mineralogía depende del protolito.',
    ambiente:
      'Se forma por metamorfismo de contacto, por el calentamiento que produce una intrusión ígnea en las rocas encajantes.',
  },
  eclogita: {
    id: 'eclogita',
    nombre: 'Eclogita',
    clase: 'Roca metamórfica granoblástica poliminerálica',
    identificacion:
      'Roca masiva, densa y granoblástica, formada por granate rojo y piroxeno sódico verde (onfacita); a veces muestra una ligera foliación o bandeado con cianita y micas blancas.',
    ambiente:
      'Es la roca metamórfica de mayor presión: se forma en zonas de subducción a partir de rocas de la corteza oceánica (basaltos y gabros).',
  },
  anfibolita: {
    id: 'anfibolita',
    nombre: 'Anfibolita',
    clase: 'Roca metamórfica de grado medio-alto',
    identificacion:
      'Roca oscura compuesta esencialmente por anfíbol (hornblenda) y plagioclasa, a menudo con granate; puede ser masiva o mostrar una lineación marcada.',
    ambiente:
      'Se forma por metamorfismo regional de grado medio a alto de rocas máficas como basaltos y gabros, en la facies de anfibolita.',
  },
  marmol: {
    id: 'marmol',
    nombre: 'Mármol',
    clase: 'Roca metamórfica granoblástica monominerálica',
    identificacion:
      'Roca de textura granoblástica en mosaico derivada de una caliza o dolomía, con más de un 90 % de calcita o dolomita; cuanto más puro, más blanco. Los accesorios indican el grado: talco (bajo), piroxeno, anfíbol u olivino (medio) y wollastonita (alto).',
    ambiente:
      'Se forma por metamorfismo, regional o de contacto, de cualquier grado sobre calizas o dolomías.',
  },
  cuarcita: {
    id: 'cuarcita',
    nombre: 'Cuarcita',
    clase: 'Roca metamórfica granoblástica monominerálica',
    identificacion:
      'Roca dura, resistente y de color claro homogéneo, formada por recristalización de una arenisca o roca muy rica en cuarzo (> 80 %; la mayoría supera el 90 %). Según el accesorio dominante puede ser moscovítica, biotítica o feldespática.',
    ambiente:
      'Se forma por metamorfismo regional o de contacto, generalmente de grado medio, sobre areniscas cuarzosas.',
  },
}

/** Ambientes genéricos cuando la roca calculada no tiene ficha propia en la guía */
export const AMBIENTE_GENERICO = {
  plutonica:
    'Como toda roca plutónica, se formó por el enfriamiento lento y la consolidación de un magma en profundidad, lo que permitió el desarrollo de cristales visibles.',
  volcanica:
    'Como roca volcánica, se formó por el enfriamiento rápido de una lava en superficie o a poca profundidad, lo que impidió el crecimiento de cristales grandes.',
  sedimentaria:
    'Se formó por la acumulación, compactación y cementación (diagénesis) de sedimentos en una cuenca sedimentaria.',
  metamorfica:
    'Se formó por la transformación en estado sólido de una roca previa sometida a cambios de presión y temperatura.',
}
