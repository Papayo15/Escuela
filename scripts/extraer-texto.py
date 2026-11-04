"""Extrae el texto de cada PDF oficial a data/fuentes/texto/<nombre>.json (una entrada por página)."""
import glob, json, logging, os, sys
from pypdf import PdfReader

logging.disable(logging.WARNING)
raiz = sys.argv[1]
salida = os.path.join(raiz, "texto")
for pdf in sorted(glob.glob(os.path.join(raiz, "*", "*.pdf"))):
    lector = PdfReader(pdf)
    paginas = [p.extract_text() or "" for p in lector.pages]
    nombre = os.path.splitext(os.path.basename(pdf))[0]
    with open(os.path.join(salida, nombre + ".json"), "w", encoding="utf-8") as f:
        json.dump(paginas, f, ensure_ascii=False)
    print(nombre, len(paginas), "pags", sum(map(len, paginas)), "caracteres")
