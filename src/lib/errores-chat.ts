import { ASISTENTE } from "./marca";
import { ErrorOpenRouter } from "./openrouter";

export type ErrorChat = { codigo: string; mensaje: string; reintentar: boolean };

export function traducirError(error: unknown): ErrorChat {
  if (error instanceof ErrorOpenRouter) {
    const espera = error.esperar;
    if (error.estado === 402 && !espera) {
      return {
        codigo: "presupuesto",
        mensaje: `${ASISTENTE} no está disponible por ahora. La biblioteca sigue funcionando; avisa a la escuela.`,
        reintentar: false,
      };
    }
    if (error.estado === 429 || error.estado === 402) {
      return {
        codigo: "ocupado",
        mensaje: espera
          ? `Hay muchas preguntas en este momento. Intenta de nuevo en ${espera} segundos.`
          : "Hay muchas preguntas en este momento. Intenta de nuevo en unos segundos.",
        reintentar: true,
      };
    }
    if (error.estado === 403) {
      return {
        codigo: "rechazo",
        mensaje: "No pude responder eso. Prueba a escribir tu duda de otra forma.",
        reintentar: false,
      };
    }
    if (error.estado === 401) {
      return {
        codigo: "configuracion",
        mensaje: `${ASISTENTE} no está disponible por ahora. Avisa a la escuela.`,
        reintentar: false,
      };
    }
  }
  return {
    codigo: "fallo",
    mensaje: "No pudimos responder ahora. Intenta de nuevo.",
    reintentar: true,
  };
}
