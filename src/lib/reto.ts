import { createHash } from "node:crypto";
import type { PreguntaReto } from "./schema-tema";

/** Lo que escribe el modelo: la correcta aparte, para poder revolver sin perderla. */
export type PreguntaModelo = { pregunta: string; correcta: string; malas: string[]; porque: string };

const huella = (texto: string) => createHash("sha256").update(texto).digest("hex");

/**
 * Convierte las preguntas del modelo al formato de la biblioteca.
 * Revuelve las opciones (siempre igual para la misma pregunta) para que la correcta no quede fija.
 * Devuelve null si no son exactamente 5 preguntas válidas.
 */
export function retoDesdeModelo(slug: string, preguntas: PreguntaModelo[]): PreguntaReto[] | null {
  if (preguntas.length !== 5) return null;
  const reto: PreguntaReto[] = [];
  for (const p of preguntas) {
    const correcta = p.correcta.trim();
    const malas = p.malas.map((m) => m.trim()).filter(Boolean);
    const opciones = [correcta, ...malas];
    if (
      p.pregunta.trim().length < 5 ||
      p.porque.trim().length < 10 ||
      !correcta ||
      malas.length < 2 ||
      malas.length > 3 ||
      new Set(opciones).size !== opciones.length
    ) {
      return null;
    }
    const semilla = huella(`${slug}${p.pregunta}`);
    opciones.sort((a, b) => huella(semilla + a).localeCompare(huella(semilla + b)));
    reto.push({
      pregunta: p.pregunta.trim(),
      opciones,
      correcta: opciones.indexOf(correcta),
      porque: p.porque.trim(),
    });
  }
  return new Set(reto.map((p) => p.pregunta)).size === 5 ? reto : null;
}
