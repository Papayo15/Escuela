#!/usr/bin/env python3
"""Reemplaza preguntas sueltas del Reto rápido sin tocar las demás.

Entrada: líneas `archivo || slug || número (1-5) || pregunta || correcta || mala || mala || por qué`.
La correcta va primero; aquí se revuelve igual que en aplicar-retos.py.
Uso: reparar-retos.py entrada.txt
"""
import hashlib, json, sys

cambios = {}
for n, linea in enumerate(open(sys.argv[1], encoding="utf8"), 1):
    linea = linea.strip()
    if not linea or linea.startswith("#"):
        continue
    p = [x.strip() for x in linea.split(" || ")]
    # archivo, slug, número, pregunta, correcta, 2 o 3 malas, por qué.
    if len(p) not in (8, 9):
        sys.exit(f"línea {n}: formato incorrecto: {linea[:70]}")
    archivo, slug, num, pregunta, correcta, *malas, porque = p
    opciones = [correcta, *malas]
    if len(set(opciones)) != len(opciones) or len(pregunta) < 5 or len(porque) < 10:
        sys.exit(f"línea {n}: opciones repetidas o texto corto: {linea[:70]}")
    h = hashlib.sha256(f"{slug}{pregunta}".encode()).digest()
    opciones.sort(key=lambda o: hashlib.sha256(h + o.encode()).digest())
    cambios.setdefault(archivo, []).append((n, slug, int(num), {
        "pregunta": pregunta, "opciones": opciones,
        "correcta": opciones.index(correcta), "porque": porque}))

total = 0
for archivo, lista in cambios.items():
    ruta = f"data/retos/{archivo}"
    datos = json.load(open(ruta, encoding="utf8"))
    for n, slug, num, nueva in lista:
        if slug not in datos or not 1 <= num <= 5:
            sys.exit(f"línea {n}: no existe {slug} pregunta {num} en {archivo}")
        datos[slug][num - 1] = nueva
        total += 1
    json.dump(datos, open(ruta, "w", encoding="utf8"), ensure_ascii=False, indent=0)
print(f"{total} preguntas reemplazadas")
