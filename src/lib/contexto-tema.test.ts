import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contextoTema } from "./contexto-tema";
import { etiquetaGrado } from "./grado";
import { GRUPO_DE_MATERIA, plantillasDe, sugerenciasDe } from "./plantillas";
import { CLAVES_SECCION } from "./secciones";
import type { Tema } from "./temas";
import { validarFoto, validarSolicitud } from "./validate";

const tema = {
  nivel: "Primaria",
  etapa: "Fase 3",
  materia: "Matemáticas",
  titulo: "Sumas",
  contenido: {
    idea: "IDEA-TEXTO",
    pizarron: "PIZARRON-TEXTO",
    truco: "TRUCO-TEXTO",
    practica: { ejercicio: "PRACTICA-TEXTO", respuesta: "RESPUESTA-SECRETA" },
    analogias: [],
    ejercicios: [{ ejercicio: "TAREA-TEXTO", respuesta: "RESPUESTA-SECRETA" }],
  },
} as unknown as Tema;

describe("contextoTema", () => {
  it("manda grado, materia, título y solo la sección activa", () => {
    const c = contextoTema(tema, "truco");
    expect(c).toContain('grado="Primaria, Fase 3"');
    expect(c).toContain('materia="Matemáticas"');
    expect(c).toContain('titulo="Sumas"');
    expect(c).toContain("TRUCO-TEXTO");
    expect(c).not.toContain("IDEA-TEXTO");
    expect(c).not.toContain("PIZARRON-TEXTO");
  });
  it("nunca incluye una respuesta", () => {
    for (const s of CLAVES_SECCION) expect(contextoTema(tema, s)).not.toContain("RESPUESTA-SECRETA");
  });
  it("incluye el ejercicio de la tarea", () => {
    expect(contextoTema(tema, "tarea")).toContain("TAREA-TEXTO");
  });
});

describe("sección en las solicitudes", () => {
  const messages = [{ role: "user", content: "hola" }];
  it("acepta una sección válida", () => {
    expect(validarSolicitud({ modo: "seguimiento", seccion: "truco", messages }).ok).toBe(true);
  });
  it("rechaza una sección inventada", () => {
    expect(validarSolicitud({ modo: "seguimiento", seccion: "otra", messages }).ok).toBe(false);
    expect(validarFoto({ pregunta: "a", imagen: "data:image/jpeg;base64,QUJD", seccion: "otra" }).ok).toBe(false);
  });
});

describe("plantillas", () => {
  it("cada materia de la biblioteca tiene grupo", () => {
    const materias = new Set<string>();
    for (const a of readdirSync("data/temario")) {
      if (!a.endsWith(".json")) continue;
      const d = JSON.parse(readFileSync(`data/temario/${a}`, "utf8"));
      for (const n of Array.isArray(d) ? d : d.nodos) materias.add(n.materia);
    }
    for (const m of materias) expect(GRUPO_DE_MATERIA[m], m).toBeDefined();
  });
  it("una materia desconocida usa las plantillas generales", () => {
    expect(plantillasDe("Otra").length).toBeGreaterThan(0);
  });
  it("hay sugerencias para cada sección", () => {
    for (const s of CLAVES_SECCION) expect(sugerenciasDe(s).length).toBe(2);
  });
});

describe("etiquetaGrado", () => {
  it("no repite el nivel", () => {
    expect(etiquetaGrado("Secundaria", "Secundaria")).toBe("Secundaria");
    expect(etiquetaGrado("Primaria", "1.º y 2.º de primaria")).toBe("1.º y 2.º de primaria");
  });
  it("conserva el nivel cuando la etapa no lo dice", () => {
    expect(etiquetaGrado("Preparatoria", "Primer semestre")).toBe("Preparatoria, Primer semestre");
  });
});
