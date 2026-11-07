import type { Seccion } from "./secciones";

export type Plantilla = { etiqueta: string; texto: string };

const BASE: Plantilla[] = [
  { etiqueta: "No entiendo un paso", texto: "No entiendo este paso: ___" },
  { etiqueta: "Yo pienso que", texto: "Yo pienso que ___ porque ___" },
  { etiqueta: "Ya lo intenté", texto: "Intenté ___ y me salió ___" },
];

const POR_GRUPO = {
  general: [],
  matematicas: [
    { etiqueta: "Pitágoras", texto: "$a^2 + b^2 = c^2$" },
    { etiqueta: "Fracción", texto: "$\\frac{a}{b}$" },
    { etiqueta: "Mi resultado", texto: "Me dio $x = $ ___, ¿voy bien?" },
  ],
  ciencias: [
    { etiqueta: "Fuerza", texto: "$F = m \\times a$" },
    { etiqueta: "Agua", texto: "$\\ce{H2O}$" },
    { etiqueta: "Reacción", texto: "$\\ce{A + B -> C}$" },
  ],
  lengua: [
    { etiqueta: "Idea principal", texto: "La idea principal es ___" },
    { etiqueta: "Lo que opino", texto: "Opino que ___ porque ___" },
  ],
  ingles: [
    { etiqueta: "I think", texto: "I think ___ because ___" },
    { etiqueta: "Cómo se dice", texto: "¿Cómo se dice ___ en inglés?" },
  ],
  sociales: [
    { etiqueta: "La causa", texto: "Esto pasó porque ___" },
    { etiqueta: "La consecuencia", texto: "Por eso, después ___" },
  ],
} satisfies Record<string, Plantilla[]>;

export const GRUPO_DE_MATERIA: Record<string, keyof typeof POR_GRUPO> = {
  "Matemáticas": "matematicas",
  "Ciencias": "ciencias",
  "Ciencias Naturales": "ciencias",
  "Física": "ciencias",
  "Química": "ciencias",
  "Biología": "ciencias",
  "Español": "lengua",
  "Lengua y Comunicación": "lengua",
  "Inglés": "ingles",
  "Historia": "sociales",
  "Geografía": "sociales",
  "Formación Cívica y Ética": "sociales",
  "Ciencias Sociales": "sociales",
  "Filosofía y Humanidades": "sociales",
  "Ética, Naturaleza y Sociedades": "sociales",
  "De lo Humano y lo Comunitario": "general",
  "Cultura Digital": "general",
  "Artes": "general",
  "Educación Socioemocional": "general",
  "Tecnología": "general",
  "Educación Física": "general",
};

/** Sin materia (chat de inicio) también se ofrece: la duda puede ser de ciencias. */
export function usaReacciones(materia?: string): boolean {
  return !materia || GRUPO_DE_MATERIA[materia] === "ciencias";
}

export function plantillasDe(materia?: string): Plantilla[] {
  const grupo = (materia && GRUPO_DE_MATERIA[materia]) || "general";
  return [...POR_GRUPO[grupo], ...BASE];
}

const SUGERENCIAS: Record<Seccion, string> = {
  idea: "Explícamelo con otro ejemplo",
  pizarron: "No entendí, explícamelo de otra forma",
  truco: "¿Cómo lo uso en mi escuela?",
  practica: "Dame una pista",
  reto: "No entendí esta pregunta",
  tarea: "Dame una pista, no la respuesta",
};

export function sugerenciasDe(seccion: Seccion): string[] {
  return [SUGERENCIAS[seccion], "Ya entendí, ponme un reto"];
}
