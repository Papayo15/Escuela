#!/usr/bin/env python3
"""Convierte retos escritos a mano en data/retos/<archivo>.json.

Entrada: una línea `# slug` y cinco líneas `pregunta || correcta || mala || mala || porqué`.
La respuesta correcta se escribe primero; aquí se revuelve para que no siempre salga igual.
Uso: aplicar-retos.py entrada.txt salida.json
"""
import glob, hashlib, json, sys

entrada, salida = sys.argv[1], sys.argv[2]
retos, slug = {}, None
for n, linea in enumerate(open(entrada, encoding="utf8"), 1):
    linea = linea.strip()
    if not linea:
        continue
    if linea.startswith("# "):
        slug = linea[2:].strip()
        retos[slug] = []
        continue
    p = [x.strip() for x in linea.split(" || ")]
    if slug is None or len(p) not in (5, 6):
        sys.exit(f"línea {n}: formato incorrecto: {linea[:70]}")
    pregunta, correcta, malas, porque = p[0], p[1], p[2:-1], p[-1]
    # Sin ignorar mayúsculas: en ortografía esa puede ser la diferencia que se pregunta.
    if len(set(p[1:-1])) != len(p) - 2:
        sys.exit(f"línea {n}: opciones repetidas: {linea[:70]}")
    if len(pregunta) < 5 or len(porque) < 10 or not all(p[1:-1]):
        sys.exit(f"línea {n}: texto demasiado corto: {linea[:70]}")
    opciones = [correcta, *malas]
    h = hashlib.sha256(f"{slug}{pregunta}".encode()).digest()
    opciones.sort(key=lambda o: hashlib.sha256(h + o.encode()).digest())
    retos[slug].append({"pregunta": pregunta, "opciones": opciones,
                        "correcta": opciones.index(correcta), "porque": porque})
existen = set()
for f in glob.glob("data/temas/**/*.json", recursive=True):
    d = json.load(open(f, encoding="utf8"))
    existen |= {t["slug"] for t in (d if isinstance(d, list) else [d])}
for s, r in retos.items():
    if s not in existen:
        sys.exit(f"{s}: ese tema no existe; copia el slug exacto")
    if len(r) != 5:
        sys.exit(f"{s}: tiene {len(r)} preguntas, deben ser 5")
json.dump(retos, open(salida, "w", encoding="utf8"), ensure_ascii=False, indent=0)

# Nadie debe poder adivinar por el largo: cada caso debería rondar una tercera parte.
todas = [q for r in retos.values() for q in r]
larga = corta = 0
peores = []
for q in todas:
    correcta = len(q["opciones"][q["correcta"]])
    malas = [len(o) for i, o in enumerate(q["opciones"]) if i != q["correcta"]]
    if correcta > max(malas):
        larga += 1
        if correcta >= 2 * max(malas):
            peores.append(q["pregunta"])
    elif correcta < min(malas):
        corta += 1
        if 2 * correcta <= min(malas):
            peores.append(q["pregunta"])
print(f"{len(retos)} temas en {salida}")
print(f"LARGO: correcta más larga {100 * larga // len(todas)} %, más corta {100 * corta // len(todas)} %. Objetivo: 20 a 45 % cada una.")
for q in peores[:8]:
    print("  desbalanceada:", q[:80])
