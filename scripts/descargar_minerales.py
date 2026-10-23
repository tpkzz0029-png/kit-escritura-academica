#!/usr/bin/env python3
"""Descarga fotos nítidas de minerales desde Wikimedia Commons.

Para cada mineral busca imágenes libres en Commons (dominio público / CC),
elige el primer JPG de al menos 600 px de ancho y lo guarda en
public/minerales/<slug>.jpg (redimensionado a ~900 px por el propio Commons).

Requiere conexión a internet. Uso:  python scripts/descargar_minerales.py
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "minerales")
os.makedirs(OUT, exist_ok=True)

UA = {"User-Agent": "KitEscrituraAcademica/1.0 (educativa; contacto: tpkzz0029@gmail.com)"}

# (slug del archivo, término de búsqueda en Commons en inglés)
MINERALES = [
    ("oro", "Native gold"),
    ("plata", "Native silver"),
    ("cobre-nativo", "Native copper"),
    ("platino", "Native platinum"),
    ("azufre", "Sulfur mineral"),
    ("diamante", "Diamond octahedron"),
    ("grafito", "Graphite mineral"),
    ("mercurio", "Mercury native element"),
    ("galena", "Galena"),
    ("pirita", "Pyrite"),
    ("calcopirita", "Chalcopyrite"),
    ("esfalerita", "Sphalerite"),
    ("bornita", "Bornite"),
    ("cinabrio", "Cinnabar"),
    ("molibdenita", "Molybdenite"),
    ("pirrotita", "Pyrrhotite"),
    ("calcosina", "Chalcocite"),
    ("estibinita", "Stibnite"),
    ("argentita", "Argentite"),
    ("tetraedrita", "Tetrahedrite"),
    ("hematita", "Hematite"),
    ("magnetita", "Magnetite"),
    ("limonita", "Limonite"),
    ("bauxita", "Bauxite"),
    ("corindon", "Corundum"),
    ("casiterita", "Cassiterite"),
    ("rutilo", "Rutile"),
    ("ilmenita", "Ilmenite"),
    ("pirolusita", "Pyrolusite"),
    ("cromita", "Chromite"),
    ("brucita", "Brucite"),
    ("gibbsita", "Gibbsite"),
    ("halita", "Halite"),
    ("fluorita", "Fluorite"),
    ("silvita", "Sylvite"),
    ("carnalita", "Carnallite"),
    ("criolita", "Cryolite"),
    ("atacamita", "Atacamite"),
    ("calcita", "Calcite"),
    ("aragonito", "Aragonite"),
    ("dolomita", "Dolomite mineral"),
    ("magnesita", "Magnesite"),
    ("siderita", "Siderite"),
    ("rodocrosita", "Rhodochrosite"),
    ("smithsonita", "Smithsonite"),
    ("witherita", "Witherite"),
    ("malachita", "Malachite"),
    ("azurita", "Azurite"),
    ("nitrato-sodio", "Nitratine"),
    ("borax", "Borax"),
    ("ulexita", "Ulexite"),
    ("yeso", "Gypsum"),
    ("anhidrita", "Anhydrite"),
    ("baritina", "Baryte"),
    ("celestina", "Celestine"),
    ("anglesita", "Anglesite"),
    ("alunita", "Alunite"),
    ("epsomita", "Epsomite"),
    ("crocoita", "Crocoite"),
    ("apatita", "Apatite"),
    ("turquesa", "Turquoise"),
    ("piromorfita", "Pyromorphite"),
    ("vanadinita", "Vanadinite"),
    ("wulfenita", "Wulfenite"),
    ("vivianita", "Vivianite"),
    ("monacita", "Monazite"),
    ("olivino", "Olivine"),
    ("granate", "Garnet"),
    ("circon", "Zircon"),
    ("almandino", "Almandine"),
    ("piropo", "Pyrope"),
    ("andalucita", "Andalusite"),
    ("cianita", "Kyanite"),
    ("silimanita", "Sillimanite"),
    ("estaurolita", "Staurolite"),
    ("topacio", "Topaz"),
    ("titanita", "Titanite"),
    ("epidota", "Epidote"),
    ("hemimorfita", "Hemimorphite"),
    ("lawsonita", "Lawsonite"),
    ("turmalina", "Tourmaline"),
    ("berilo", "Beryl"),
    ("cordierita", "Cordierite"),
    ("augita", "Augite"),
    ("diopsido", "Diopside"),
    ("enstatita", "Enstatite"),
    ("espodumena", "Spodumene"),
    ("hornblenda", "Hornblende"),
    ("actinolita", "Actinolite"),
    ("crisotilo", "Chrysotile"),
    ("muscovita", "Muscovite"),
    ("biotita", "Biotite"),
    ("clorita", "Chlorite mineral"),
    ("lepidolita", "Lepidolite"),
    ("talco", "Talc"),
    ("caolinita", "Kaolinite"),
    ("montmorillonita", "Montmorillonite"),
    ("cuarzo", "Quartz"),
    ("ortoclasa", "Orthoclase"),
    ("microclina", "Microcline"),
    ("plagioclasa", "Plagioclase"),
    ("nefelina", "Nepheline"),
    ("leucita", "Leucite"),
    ("sanidina", "Sanidine"),
    ("ambar", "Amber"),
    ("mellite", "Mellite mineral"),
    ("asfalto", "Bitumen asphalt"),
    ("whewellita", "Whewellite"),
]


def buscar_en_commons(termino):
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrnamespace": "6",
        "gsrsearch": f"{termino} mineral",
        "gsrlimit": "10",
        "prop": "imageinfo",
        "iiprop": "url|size|mime",
        "iiurlwidth": "900",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    paginas = (data.get("query") or {}).get("pages") or {}
    # ordenar por índice de búsqueda (relevancia)
    items = sorted(paginas.values(), key=lambda p: p.get("index", 99))
    for p in items:
        info = (p.get("imageinfo") or [{}])[0]
        mime = info.get("mime", "")
        ancho = info.get("width", 0)
        if mime in ("image/jpeg", "image/jpg") and ancho >= 600:
            return info.get("thumburl") or info.get("url")
    return None


def descargar(url, destino):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r, open(destino, "wb") as f:
        f.write(r.read())


def main():
    solo_faltantes = "--faltantes" in sys.argv
    ok, fallidos = 0, []
    for slug, termino in MINERALES:
        destino = os.path.join(OUT, slug + ".jpg")
        if solo_faltantes and os.path.exists(destino) and os.path.getsize(destino) > 5000:
            ok += 1
            continue
        try:
            img = buscar_en_commons(termino)
            if not img:
                fallidos.append((slug, termino, "sin resultados"))
                continue
            descargar(img, destino)
            kb = os.path.getsize(destino) // 1024
            print(f"OK  {slug:<18} {kb:>5} KB  <- {termino}")
            ok += 1
            time.sleep(0.4)  # cortesía con la API de Commons
        except Exception as e:
            fallidos.append((slug, termino, str(e)))
            print(f"FALLA {slug:<16} {termino}: {e}")
    print(f"\nTotal: {ok}/{len(MINERALES)} descargadas.")
    if fallidos:
        print("Faltantes:")
        for slug, termino, motivo in fallidos:
            print(f"  - {slug} ({termino}): {motivo}")


if __name__ == "__main__":
    main()
