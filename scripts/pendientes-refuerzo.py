"""Lista los temas de data/plan-subtemas.txt que aún no están escritos. Uso: pendientes-refuerzo.py [cuántos]"""
import glob, json, re, sys, unicodedata

def plano(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", plano(s).replace("²", "2")).strip("-")

nodos = {}
for f in glob.glob("data/temario/*.json"):
    d = json.load(open(f, encoding="utf8"))
    for n in d if isinstance(d, list) else d.get("nodos", []):
        nodos[n["id"]] = n
hechos, usados = set(), set()
for f in glob.glob("data/temas/**/*.json", recursive=True):
    d = json.load(open(f, encoding="utf8"))
    for t in d if isinstance(d, list) else [d]:
        hechos.add((t["nodo_id"], plano(t["titulo"])))
        usados.add(t["slug"])

sufijo = {"Primaria": "primaria", "Secundaria": "secundaria", "Preparatoria": "prepa"}
pend, total, grupo = [], 0, ""
for l in open("data/plan-subtemas.txt", encoding="utf8"):
    l = l.strip()
    if l.startswith("## "):
        grupo = l[3:]
    elif l and not l.startswith("#"):
        i, r = l.split(":", 1)
        i = i.strip()
        for t in filter(None, map(str.strip, r.split(";"))):
            total += 1
            if (i, plano(t)) not in hechos:
                s = f"{slug(t)}-{sufijo[nodos[i]['nivel']]}"
                pend.append((grupo, i, nodos[i]["etapa"], t, s + "-2" if s in usados else s))

print(f"escritos {total - len(pend)} de {total}; faltan {len(pend)}")
for g, i, e, t, s in pend[: int(sys.argv[1]) if len(sys.argv) > 1 else 15]:
    print(f"{i} | {e} | {t} | {s} | {g}")
