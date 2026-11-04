"""Divide los nodos sin tema en tandas pequeñas: data/tandas/tNNN.json."""
import glob, json, os, sys

TAMANO = 10
PRIORIDAD = ["Matemáticas", "Ciencias Naturales", "Ciencias", "Biología", "Física", "Química", "Español", "Lengua y Comunicación", "Historia", "Geografía", "Inglés"]
NIVELES = ["Primaria", "Secundaria", "Preparatoria"]
raiz = sys.argv[1]
nodos = [n for f in sorted(glob.glob(f"{raiz}/data/temario/*.json")) for n in json.load(open(f))]
hechos = {t["nodo_id"] for f in glob.glob(f"{raiz}/data/temas/**/*.json", recursive=True) for t in json.load(open(f))}
pendientes = [n for n in nodos if n["id"] not in hechos]

def prioridad(m):
    return PRIORIDAD.index(m) if m in PRIORIDAD else len(PRIORIDAD)

grupos = {}
for n in pendientes:
    grupos.setdefault((prioridad(n["materia"]), n["materia"], NIVELES.index(n["nivel"])), []).append(n)

os.makedirs(f"{raiz}/data/tandas", exist_ok=True)
for f in glob.glob(f"{raiz}/data/tandas/t*.json"):
    os.remove(f)
i = 0
for clave in sorted(grupos):
    lista = grupos[clave]
    for k in range(0, len(lista), TAMANO):
        i += 1
        json.dump(lista[k:k + TAMANO], open(f"{raiz}/data/tandas/t{i:03d}.json", "w"), ensure_ascii=False, indent=0)
        print(f"t{i:03d}", clave[1], lista[k]["nivel"], len(lista[k:k + TAMANO]))
print("tandas", i, "nodos", len(pendientes))
