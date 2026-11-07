#!/usr/bin/env python3
"""Lista los temas que aún no tienen reto rápido, para escribirlos por tandas.

Uso: pendientes-retos.py [cuántos] [materia]
"""
import glob, json, re, sys

cuantos = int(sys.argv[1]) if len(sys.argv) > 1 else 15
materia = sys.argv[2] if len(sys.argv) > 2 else None

nodos = {}
for f in glob.glob("data/temario/**/*.json", recursive=True):
    for n in json.load(open(f, encoding="utf8")):
        nodos[n["id"]] = n
hechos = set()
for f in glob.glob("data/retos/*.json"):
    hechos |= set(json.load(open(f, encoding="utf8")))
temas = []
for f in glob.glob("data/temas/**/*.json", recursive=True):
    d = json.load(open(f, encoding="utf8"))
    temas += d if isinstance(d, list) else [d]

PRIORIDAD = ["Matemáticas", "Español", "Lengua y Comunicación", "Ciencias Naturales", "Ciencias"]
NIVEL = {"Primaria": 0, "Secundaria": 1, "Preparatoria": 2}


def orden(t):
    n = nodos[t["nodo_id"]]
    m = PRIORIDAD.index(n["materia"]) if n["materia"] in PRIORIDAD else len(PRIORIDAD)
    return (NIVEL[n["nivel"]], m, n["materia"], n["etapa"], t["slug"])


faltan = sorted((t for t in temas if t["slug"] not in hechos), key=orden)
if materia:
    faltan = [t for t in faltan if nodos[t["nodo_id"]]["materia"] == materia]
print(f"faltan {len(faltan)} de {len(temas)}")
for t in faltan[:cuantos]:
    n = nodos[t["nodo_id"]]
    c = t["contenido"]
    texto = re.sub(r"\s+", " ", c["pizarron"])[:420]
    tarea = " / ".join(e["ejercicio"][:60] for e in [c["practica"], *c["ejercicios"]])
    print(f"# {t['slug']}\n{n['materia']} {n['etapa']} | {t['titulo']}\n{texto}\nYA USADO: {re.sub(chr(10), ' ', tarea)}\n")
