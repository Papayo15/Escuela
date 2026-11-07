import { z } from "zod";

const ejercicio = z.object({
  ejercicio: z.string().min(5),
  respuesta: z.string().min(1),
});

const preguntaReto = z
  .object({
    pregunta: z.string().min(5),
    opciones: z.array(z.string().min(1)).min(3).max(4),
    correcta: z.number().int().min(0),
    porque: z.string().min(10),
  })
  .refine((p) => p.correcta < p.opciones.length, "correcta fuera de las opciones")
  .refine((p) => new Set(p.opciones).size === p.opciones.length, "opciones repetidas");

export const contenidoTema = z.object({
  idea: z.string().min(40),
  pizarron: z.string().min(40),
  truco: z.string().min(15),
  practica: ejercicio,
  analogias: z
    .array(z.object({ titulo: z.string().min(3), texto: z.string().min(20) }))
    .length(2),
  ejercicios: z.array(ejercicio).length(3),
  /** Reto rápido: se califica en el navegador. Los temas vivos no lo traen. */
  reto: z.array(preguntaReto).length(5).optional(),
});

export const archivoRetos = z.record(z.string(), z.array(preguntaReto).length(5));

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

export type PreguntaReto = z.infer<typeof preguntaReto>;
export type ContenidoTema = z.infer<typeof contenidoTema>;
export type ArchivoTema = z.infer<typeof archivoTema>;
export type NodoCurricular = z.infer<typeof nodoCurricular>;
