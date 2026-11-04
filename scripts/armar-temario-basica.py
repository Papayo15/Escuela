"""Arma data/temario/fase-N.json desde el panorama de contenidos de cada programa sintético."""
import json, re, sys, unicodedata

CAMPOS = ["Lenguajes", "Saberes y Pensamiento Científico", "Ética, Naturaleza y Sociedades", "De lo Humano y lo Comunitario"]
ETAPA = {3: "1.º y 2.º de primaria", 4: "3.º y 4.º de primaria", 5: "5.º y 6.º de primaria", 6: "Secundaria"}
PANORAMA = {3: range(12, 17), 4: range(12, 19), 5: range(12, 18), 6: range(14, 27)}
RUIDO = ("Programa de Estudio para la Educación", "Panorama de los Contenidos", "Lenguajes", "Saberes y", "Pensamiento", "Científico", "Ética, Naturaleza", "y Sociedades", "De lo Humano y lo", "Comunitario", "■")
MATE = re.compile(r"n[uú]mero|suma|resta|multiplic|divisi[oó]n|fraccion|decimal|proporcional|geom[eé]tric|figuras|medici[oó]n|medidas|per[ií]metro|[aá]rea|volumen|[aá]ngulo|recta|[aá]lgebra|ecuacion|funciones|datos|probabil|tendencia central|circunferencia|teorema|semejanza|congruencia|ubicaci[oó]n espacial|polinomio|potencia|ra[ií]z|c[aá]lculo|informaci[oó]n", re.I)

def norm(t):
    t = re.sub(r"-\s*\n\s*", "", t)
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w]+", " ", t.lower()).strip()

def limpiar(pagina):
    lineas = [l.strip() for l in pagina.split("\n")]
    lineas = [l for l in lineas if l and not l.isdigit() and not any(l.startswith(r) for r in RUIDO)]
    t = "\n".join(lineas)
    t = re.sub(r"-\s*\n", "", t)
    t = re.sub(r"\s+", " ", t)
    return re.sub(r"(Lenguajes |Saberes y Pensamiento Científico |Ética, Naturaleza y Sociedades |De lo Humano y lo Comunitario )", "", t)

def secciones(paginas):
    rangos = {}
    for i, p in enumerate(paginas):
        for campo in CAMPOS:
            if campo in " ".join(p[:300].split()) and "Programa Sintético" in p[:300]:
                rangos.setdefault(campo, set()).add(i + 1)
    return rangos

def materia_f6(paginas, pagina):
    for i in range(pagina - 1, max(pagina - 18, 0), -1):
        m = re.search(r"\b(Español|Inglés|Artes|Matemáticas|Biología|Física|Química|Geografía|Historia|Formación Cívica y Ética|Tecnología|Educación Física|Educación Socioemocional|Tutoría|Vida Saludable|Lengua Indígena)\b", paginas[i][:420])
        if m:
            return m.group(1)
    return None


# Ajustes manuales verificados contra el PDF: contenidos partidos entre columnas y residuos.
AJUSTES = {'f3-049': ('Funciones y responsabilidades de las autoridades, de la familia, la escuela y la comunidad para la organización de la convivencia, la resolución de conflictos y el cumplimiento de acuerdos y normas de manera participativa y pacífica', 14), 'f4-059': ('Formas y procedimientos mediante las que se eligen a las autoridades de gobierno, y los cambios que han tenido a través del tiempo, en función del bienestar colectivo', 16), 'f6-062': ('La conformación de las metrópolis y los sistemas de dominación', 85), 'f6-113': ('Defensa del derecho al acceso a la protección de datos personales, a la información, la transparencia y la rendición de cuentas en un gobierno democrático', 22)}
FUERA = ['ems-142', 'ems-184', 'ems-189', 'f6-060']

raiz = sys.argv[1]
total = 0
for fase, pags in PANORAMA.items():
    fuente = f"programa-sintetico-fase-{fase}"
    paginas = json.load(open(f"{raiz}/data/fuentes/texto/{fuente}.json"))
    bruto = " ".join(limpiar(paginas[n - 1]) for n in pags)
    bruto = re.sub(r"\b(Español|Matemáticas|Geografía|Tecnología|Inglés|Artes|Historia|Biología|Física|Química|Formación Cívica y Ética|Primer grado|Segundo grado|Tercer grado|Educación Física|Educación Socioemocional|Tutoría|Vida Saludable)\b(?=\s+[A-ZÁÉÍÓÚ])", lambda m: m.group(0) if False else m.group(0) + "§", bruto)
    candidatos = [c.strip(" §") for c in re.split(r"(?<=[.)])\s+(?=[A-ZÁÉÍÓÚ¿])|§", bruto)]
    candidatos = [c for c in candidatos if len(c) >= 6]
    rangos = secciones(paginas)
    normal = [norm(p) for p in paginas]
    nodos, vistos, perdidos = [], set(), []
    for c in candidatos:
        n = norm(c)
        if n in vistos:
            continue
        hallado = None
        if len(c) < 25:
            # Un título corto se busca primero como línea propia, para no confundirlo con una frase.
            patron = rf"(?m)^\s*{re.escape(c.rstrip('.'))}\.?\s*$"
            for campo, ps in rangos.items():
                pg = next((x for x in sorted(ps) if x not in pags and re.search(patron, paginas[x - 1])), None)
                if pg:
                    hallado = (campo, pg)
                    break
        if not hallado:
            for campo, ps in rangos.items():
                pg = next((x for x in sorted(ps) if x not in pags and n in normal[x - 1]), None)
                if pg:
                    hallado = (campo, pg)
                    break
        if not hallado and not c.startswith(("Esta ", "Este ", "La Fase", "Lengua indígena")):
            # El PDF parte contenidos largos entre columnas: se conserva el tramo literal inicial.
            corto = re.split(r":", c)[0] if ":" in c[:90] else " ".join(c.split()[:9])
            if len(corto) >= 18:
                nc = norm(corto)
                if nc not in vistos:
                    for campo, ps in rangos.items():
                        pg = next((x for x in sorted(ps) if x not in pags and nc in normal[x - 1]), None)
                        if pg:
                            hallado, c, n = (campo, pg), corto, nc
                            break
        if not hallado:
            perdidos.append(c)
            continue
        vistos.add(n)
        campo, pg = hallado
        if fase == 6:
            materia = materia_f6(paginas, pg) or campo
        elif campo == "Saberes y Pensamiento Científico":
            materia = "Matemáticas" if MATE.search(c) and not c.startswith(("Alimentación", "Funciones vitales")) else "Ciencias Naturales"
        elif campo == "Lenguajes":
            materia = "Español"
        else:
            materia = campo
        if materia == "Lengua Indígena":
            continue
        nivel = "Secundaria" if fase == 6 else "Primaria"
        nodos.append({"id": f"f{fase}-{len(nodos)+1:03d}", "nivel": nivel, "etapa": ETAPA[fase], "campo": campo, "materia": materia, "contenido": c.rstrip("."), "fuente": fuente, "pagina": pg})
    MATERIAS = {"Español", "Matemáticas", "Geografía", "Tecnología", "Inglés", "Artes", "Historia", "Biología", "Física", "Química"}
    nodos = [x for x in nodos if x["contenido"] not in MATERIAS]
    for x in nodos:
        if fase == 6 and x["contenido"] == "Funciones":
            x.update(campo="Saberes y Pensamiento Científico", materia="Matemáticas", pagina=59)
    nodos = [x for x in nodos if x["id"] not in FUERA]
    for x in nodos:
        if x["id"] in AJUSTES:
            x["contenido"], x["pagina"] = AJUSTES[x["id"]]
    json.dump(nodos, open(f"{raiz}/data/temario/fase-{fase}.json", "w"), ensure_ascii=False, indent=1)
    total += len(nodos)
    cuenta = {}
    for x in nodos:
        cuenta[x["materia"]] = cuenta.get(x["materia"], 0) + 1
    print(f"fase {fase}: {len(nodos)} nodos; sin localizar {len(perdidos)}; {cuenta}")
    for c in perdidos[:6]:
        print("   ?", c[:110])
print("total", total)
