#!/usr/bin/env python3
"""Descarga fotos de rocas (iguales a las de los identificadores) desde
Wikimedia Commons hacia public/rocas/<slug>.jpg."""
import json
import os
import time
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "rocas")
os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "GeologiaUp/1.0 (educativa; tpkzz0029@gmail.com)"}

# (slug, término de búsqueda en Commons)
ROCAS = [
    ("toba", "Tuff rock"),
    ("brecha-volcanica", "Volcanic breccia"),
    ("obsidiana", "Obsidian"),
    ("pumita", "Pumice"),
    ("granito", "Granite"),
    ("riolita", "Rhyolite"),
    ("diorita", "Diorite"),
    ("andesita", "Andesite"),
    ("gabro", "Gabbro"),
    ("basalto", "Basalt"),
    ("peridotita", "Peridotite"),
    ("komatiita", "Komatiite"),
    ("conglomerado", "Conglomerate rock"),
    ("brecha", "Sedimentary breccia rock"),
    ("cuarzoarenita", "Quartz arenite"),
    ("arcosa", "Arkose"),
    ("grauvaca", "Greywacke"),
    ("limolita", "Siltstone"),
    ("roca-arcilla", "Claystone"),
    ("lutita", "Shale rock"),
    ("turba", "Peat"),
    ("carbon-bituminoso", "Bituminous coal"),
    ("dolostona", "Dolomite rock"),
    ("calcidurita", "Calcirudite"),
    ("calcarenita", "Calcarenite"),
    ("micrita", "Micrite"),
    ("coquina", "Coquina"),
    ("tiza", "Chalk rock"),
    ("tufo", "Travertine"),
    ("caliza-olitica", "Oolitic limestone"),
    ("chert", "Chert"),
    ("sal", "Halite rock salt"),
    ("yeso", "Gypsum rock"),
    ("hierro", "Ironstone"),
    ("pizarra", "Slate rock"),
    ("filita", "Phyllite"),
    ("esquisto", "Schist"),
    ("gneis", "Gneiss"),
    ("antracita", "Anthracite"),
    ("corneana", "Hornfels"),
    ("serpentina", "Serpentinite"),
    ("esteatita", "Soapstone"),
    ("cuarcita", "Quartzite"),
    ("marmol", "Marble"),
    ("metaconglomerado", "Metaconglomerate"),
]


def buscar(termino):
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrnamespace": "6", "gsrsearch": termino, "gsrlimit": "10",
        "prop": "imageinfo", "iiprop": "url|size|mime", "iiurlwidth": "900",
    }
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    paginas = (data.get("query") or {}).get("pages") or {}
    for p in sorted(paginas.values(), key=lambda p: p.get("index", 99)):
        info = (p.get("imageinfo") or [{}])[0]
        if info.get("mime") in ("image/jpeg", "image/jpg") and info.get("width", 0) >= 600:
            return info.get("thumburl") or info.get("url")
    return None


def main():
    ok, fallidos = 0, []
    for slug, termino in ROCAS:
        destino = os.path.join(OUT, slug + ".jpg")
        try:
            img = buscar(termino)
            if not img:
                fallidos.append((slug, termino)); continue
            req = urllib.request.Request(img, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r, open(destino, "wb") as f:
                f.write(r.read())
            print(f"OK  {slug:<22} {os.path.getsize(destino)//1024:>5} KB")
            ok += 1
            time.sleep(0.4)
        except Exception as e:
            fallidos.append((slug, f"{termino}: {e}"))
            print(f"FALLA {slug}: {e}")
    print(f"\nTotal: {ok}/{len(ROCAS)}")
    for s, m in fallidos:
        print("  faltante:", s, "-", m)


if __name__ == "__main__":
    main()
