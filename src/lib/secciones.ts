export const SECCIONES = {
  idea: "La idea en simple",
  pizarron: "Cómo funciona en el pizarrón",
  truco: "El truco de oro",
  practica: "Práctica exprés",
  reto: "Reto rápido",
  oral: "Dilo tú",
  tarea: "Tu tarea",
} as const;

export type Seccion = keyof typeof SECCIONES;

export const CLAVES_SECCION = Object.keys(SECCIONES) as [Seccion, ...Seccion[]];
