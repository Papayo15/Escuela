import { z } from "zod";

const ejercicio = z.object({
  ejercicio: z.string().min(5),
  respuesta: z.string().min(1),
});

export const contenidoTema = z.object({
  idea: z.string().min(40),
  pizarron: z.string().min(40),
  truco: z.string().min(15),
  practica: ejercicio,
  analogias: z
    .array(z.object({ titulo: z.string().min(3), texto: z.string().min(20) }))
    .length(2),
  ejercicios: z.array(ejercicio).length(3),
});

export const archivoTema = z.object({
  nodo_id: z.string().min(1),
  titulo: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  palabras: z.array(z.string()).default([]),
  contenido: contenidoTema,
});

export const nodoCurricular = z.object({
  id: z.string().min(1),
  nivel: z.enum(["Primaria", "Secundaria", "Preparatoria"]),
  etapa: z.string().min(1),
  campo: z.string().min(1),
  materia: z.string().min(1),
  contenido: z.string().min(3),
  fuente: z.string().min(1),
  pagina: z.number().int().positive(),
});

export type ContenidoTema = z.infer<typeof contenidoTema>;
export type ArchivoTema = z.infer<typeof archivoTema>;
export type NodoCurricular = z.infer<typeof nodoCurricular>;
