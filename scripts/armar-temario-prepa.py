"""Arma data/temario/preparatoria.json desde las tablas de propósitos y contenidos formativos."""
import json, re, sys

DOCS = {
    "MCC_PENSAMIENTO_MATEMATICO": ("Pensamiento Matemático", "Matemáticas"),
    "2025_MCC_CIENCIAS-NATURALES_BN": ("Ciencias Naturales, Experimentales y Tecnología", "Ciencias"),
    "MCC_LENGUA_Y_COMUNICACION": ("Lengua y Comunicación", "Lengua y Comunicación"),
    "MCC_CIENCIAS_SOCIALES_2da": ("Ciencias Sociales", "Ciencias Sociales"),
    "MCC_CONCIENCIA_HISTORICA-": ("Conciencia Histórica", "Historia"),
    "MCC_CULTURA-DIGITAL_09": ("Cultura Digital", "Cultura Digital"),
    "MCC_INGLES": ("Inglés", "Inglés"),
    "MCC_PENSAMIENTO_FILOSOFICO-2": ("Pensamiento Filosófico y Humanidades", "Filosofía y Humanidades"),
}
SEM = "Primer|Segundo|Tercer|Cuarto|Quinto|Sexto"

raiz = sys.argv[1]
nodos = []
for fuente, (campo, materia) in DOCS.items():
    paginas = json.load(open(f"{raiz}/data/fuentes/texto/{fuente}.json"))
    asignatura, semestre = None, None
    cuenta = 0
    for i, pagina in enumerate(paginas):
        if not re.search(r"[Cc]ontenidos\s+formativos", pagina):
            continue
        m = re.search(r"Nombre de la\s+asignatura\s*\n?\s*([^\n]+)", pagina)
        if m:
            asignatura = m.group(1).strip()
        m = re.search(rf"\b({SEM})\s+semestre", pagina)
        if m:
            semestre = m.group(1)
        if not asignatura or not semestre:
            continue
        for p in re.finditer(r"(?m)^\s*(\d{1,2})\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:[^\n]|\n(?!\s*\d{1,2}\s+[A-Z]))*?\.)", pagina):
            texto = re.sub(r"\s+", " ", re.sub(r"-\s*\n", "", p.group(2))).strip()
            if not 30 <= len(texto) <= 420:
                continue
            cuenta += 1
            nodos.append({
                "id": f"ems-{len(nodos)+1:03d}",
                "nivel": "Preparatoria",
                "etapa": f"{semestre} semestre",
                "campo": campo,
                "materia": materia,
                "contenido": f"{asignatura}: {texto}" if False else texto,
                "fuente": fuente,
                "pagina": i + 1,
                "_asignatura": asignatura,
            })
    print(fuente, cuenta)
vistos, final = set(), []
for n in nodos:
    clave = n["contenido"].lower()
    if clave not in vistos:
        vistos.add(clave)
        n.pop("_asignatura")
        final.append(n)
final = [n for n in final if not n["contenido"].startswith("|") and "práctica docente" not in n["contenido"] and "Como se ha mostrado" not in n["contenido"] and n["id"] not in {"ems-142", "ems-184", "ems-189"}]
json.dump(final, open(f"{raiz}/data/temario/preparatoria.json", "w"), ensure_ascii=False, indent=1)
print("total", len(final))
