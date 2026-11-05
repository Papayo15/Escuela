import { traducirError } from "./errores-chat";
import { abrirStream, type MensajeChat } from "./openrouter";

export type Enviar = (evento: object) => void;

export function respuestaEnVivo(opciones: {
  mensajes: MensajeChat[];
  signal: AbortSignal;
  sinRetencion?: boolean;
  alTerminar?: (texto: string, modelo: string | undefined, enviar: Enviar) => Promise<void>;
}): Response {
  const codificador = new TextEncoder();
  const cuerpo = new ReadableStream<Uint8Array>({
    async start(controlador) {
      const enviar: Enviar = (evento) =>
        controlador.enqueue(codificador.encode(`${JSON.stringify(evento)}\n`));
      try {
        let completo = "";
        const flujo = abrirStream({
          mensajes: opciones.mensajes,
          signal: opciones.signal,
          sinRetencion: opciones.sinRetencion,
        });
        for await (const evento of flujo) {
          if (evento.tipo === "delta") {
            completo += evento.texto;
            enviar({ tipo: "delta", texto: evento.texto });
            continue;
          }
          console.log("uso", JSON.stringify({ modelo: evento.modelo, uso: evento.uso }));
          if (evento.razon === "refusal" || evento.razon === "content_filter") {
            enviar({ tipo: "rechazo" });
          } else {
            enviar({ tipo: "fin", cortado: evento.razon === "length" });
            if (evento.razon === "stop") await opciones.alTerminar?.(completo, evento.modelo, enviar);
          }
        }
      } catch (error) {
        if (!opciones.signal.aborted) {
          console.error("Error del chat", error instanceof Error ? error.message : "desconocido");
          enviar({ tipo: "error", ...traducirError(error) });
        }
      } finally {
        controlador.close();
      }
    },
  });
  return new Response(cuerpo, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
