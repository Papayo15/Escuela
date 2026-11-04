import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { chatDisponible, COOKIE_ACCESO, cookieValida } from "@/lib/acceso";
import { traducirError } from "@/lib/errores-claude";
import { guardarTemaVivo } from "@/lib/guardar-tema-vivo";
import { PROMPT } from "@/lib/pedagogical-prompt";
import { buscarTemas, obtenerTema } from "@/lib/temas";
import { MAX_CUERPO, validarSolicitud, type Solicitud } from "@/lib/validate";

export const maxDuration = 300;

async function construirMensajes(s: Solicitud): Promise<Anthropic.MessageParam[]> {
  const mensajes: Anthropic.MessageParam[] = s.messages.map((m) => ({ ...m }));
  const prefijos: string[] = [];
  if (s.nivel) prefijos.push(`Nivel escolar del alumno: ${s.nivel}.`);
  if (s.slug) {
    const tema = await obtenerTema(s.slug);
    if (tema) {
      const { idea, pizarron, truco } = tema.contenido;
      prefijos.push(
        `<tema_de_la_biblioteca titulo="${tema.titulo}">\n${idea}\n\n${pizarron}\n\n${truco}\n</tema_de_la_biblioteca>\nEl alumno ya leyó esta explicación y necesita más ayuda.`,
      );
    }
  }
  if (prefijos.length > 0) {
    mensajes[0] = {
      role: "user",
      content: `${prefijos.join("\n\n")}\n\n${s.messages[0].content}`,
    };
  }
  return mensajes;
}

export async function POST(request: Request) {
  if (!chatDisponible()) {
    return Response.json({ error: "El chat con Claude no está activado." }, { status: 503 });
  }
  const almacen = await cookies();
  if (!(await cookieValida(almacen.get(COOKIE_ACCESO)?.value))) {
    return Response.json({ error: "Falta el código de acceso." }, { status: 401 });
  }
  const texto = await request.text();
  if (texto.length > MAX_CUERPO) {
    return Response.json({ error: "La conversación es demasiado larga." }, { status: 413 });
  }
  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const validacion = validarSolicitud(cuerpo);
  if (!validacion.ok) return Response.json({ error: validacion.error }, { status: 400 });
  const solicitud = validacion.datos;

  if (solicitud.modo === "tema-nuevo") {
    const existentes = await buscarTemas(solicitud.messages[0].content, solicitud.nivel);
    if (existentes[0]) {
      return Response.json({ existente: existentes[0].slug });
    }
  }

  const mensajes = await construirMensajes(solicitud);
  const cliente = new Anthropic();
  const codificador = new TextEncoder();

  const cuerpoStream = new ReadableStream<Uint8Array>({
    async start(controlador) {
      const enviar = (evento: object) =>
        controlador.enqueue(codificador.encode(`${JSON.stringify(evento)}\n`));
      try {
        const stream = cliente.beta.messages.stream(
          {
            model: "claude-opus-5-5",
            max_tokens: 16000,
            thinking: { type: "adaptive" },
            output_config: { effort: "medium" },
            cache_control: { type: "ephemeral" },
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system: PROMPT,
            messages: mensajes,
          } as Parameters<typeof cliente.beta.messages.stream>[0],
          { signal: request.signal },
        );
        let completo = "";
        for await (const evento of stream) {
          if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
            completo += evento.delta.text;
            enviar({ tipo: "delta", texto: evento.delta.text });
          }
        }
        const final = await stream.finalMessage();
        console.log("uso", JSON.stringify(final.usage));
        if (final.stop_reason === "refusal") {
          enviar({ tipo: "rechazo" });
        } else {
          enviar({ tipo: "fin", cortado: final.stop_reason === "max_tokens" });
          if (solicitud.modo === "tema-nuevo" && final.stop_reason === "end_turn") {
            try {
              const slug = await guardarTemaVivo(cliente, solicitud.messages[0].content, completo);
              if (slug) enviar({ tipo: "guardado", slug });
            } catch (error) {
              console.error("No se guardó el tema", error);
            }
          }
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("Error del chat", error);
          enviar({ tipo: "error", ...traducirError(error) });
        }
      } finally {
        controlador.close();
      }
    },
  });

  return new Response(cuerpoStream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
