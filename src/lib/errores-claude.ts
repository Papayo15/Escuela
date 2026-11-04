import Anthropic from "@anthropic-ai/sdk";

export type ErrorChat = { codigo: string; mensaje: string; reintentar: boolean };

const PRESUPUESTO: ErrorChat = {
  codigo: "presupuesto",
  mensaje: "El chat se agotó este mes. La biblioteca sigue disponible; avisa a la escuela.",
  reintentar: false,
};

export function traducirError(error: unknown): ErrorChat {
  if (error instanceof Anthropic.APIError) {
    const texto = error.message ?? "";
    if (error.status === 429 && texto.includes("enforced_spend_limit_reached")) return PRESUPUESTO;
    if (error.status === 400 && texto.includes("specified") && texto.includes("usage limits")) {
      return PRESUPUESTO;
    }
    if (error.status === 429) {
      return {
        codigo: "ocupado",
        mensaje: "Hay muchas preguntas en este momento. Intenta de nuevo en unos segundos.",
        reintentar: true,
      };
    }
  }
  return {
    codigo: "fallo",
    mensaje: "No pudimos responder ahora. Intenta de nuevo.",
    reintentar: true,
  };
}
