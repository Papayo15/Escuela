import { etiquetaGrado } from "./grado";
import type { Tema } from "./temas";
import { SECCIONES, type Seccion } from "./secciones";

function textoDeSeccion(tema: Tema, seccion: Seccion): string {
  const { idea, pizarron, truco, practica, ejercicios, reto } = tema.contenido;
  switch (seccion) {
    case "idea":
      return idea;
    case "pizarron":
      return pizarron;
    case "truco":
      return truco;
    case "practica":
      return practica.ejercicio;
    case "oral":
      return idea;
    case "reto":
      return (reto ?? []).map((p, i) => `${i + 1}. ${p.pregunta}`).join("\n");
    case "tarea":
      return ejercicios.map((e, i) => `${i + 1}. ${e.ejercicio}`).join("\n");
  }
}

/**
 * Manda solo la sección que el alumno está leyendo, para no gastar tokens en cada turno.
 * Nunca incluye las respuestas de la práctica ni de la tarea.
 */
export function contextoTema(tema: Tema, seccion: Seccion = "idea"): string {
  return `<tema_activo grado="${etiquetaGrado(tema.nivel, tema.etapa)}" materia="${tema.materia}" titulo="${tema.titulo}" seccion="${SECCIONES[seccion]}">
${textoDeSeccion(tema, seccion)}
</tema_activo>
El alumno ya leyó esta sección. Parte de ahí y no la repitas.`;
}
