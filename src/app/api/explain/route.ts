import { cookies } from "next/headers";
import { contextoTema } from "@/lib/contexto-tema";
import { chatDisponible, COOKIE_ACCESO, planDeCookie } from "@/lib/acceso";
import { guardarTemaVivo } from "@/lib/guardar-tema-vivo";
import { ASISTENTE } from "@/lib/marca";
import { esModeloPrincipal, type MensajeChat } from "@/lib/openrouter";
import { PROMPT } from "@/lib/pedagogical-prompt";
import { respuestaEnVivo } from "@/lib/stream-chat";
import { buscarTemas, obtenerTema } from "@/lib/temas";
import { MAX_CUERPO, validarSolicitud, type Solicitud } from "@/lib/validate";

export const maxDuration = 300;

async function construirMensajes(s: Solicitud): Promise<MensajeChat[]> {
  const mensajes: MensajeChat[] = s.messages.map((m) => ({ ...m }));
  const prefijos: string[] = [];
  if (s.nivel) prefijos.push(`Nivel escolar del alumno: ${s.nivel}.`);
  const tema = s.slug ? await obtenerTema(s.slug) : null;
  if (tema) prefijos.push(contextoTema(tema, s.seccion));
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
    return Response.json({ error: `${ASISTENTE} no está activado.` }, { status: 503 });
  }
  const almacen = await cookies();
  const plan = await planDeCookie(almacen.get(COOKIE_ACCESO)?.value);
  if (!plan) return Response.json({ error: "Falta el código de acceso." }, { status: 401 });
  if (plan !== "premium") {
    return Response.json({ error: `${ASISTENTE} es del plan completo.` }, { status: 403 });
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

  return respuestaEnVivo({
    mensajes: [{ role: "system", content: PROMPT }, ...mensajes],
    signal: request.signal,
    alTerminar: async (texto, modelo, enviar) => {
      if (solicitud.modo !== "tema-nuevo" || !esModeloPrincipal(modelo)) return;
      try {
        const slug = await guardarTemaVivo(solicitud.messages[0].content, texto);
        if (slug) enviar({ tipo: "guardado", slug });
      } catch (error) {
        console.error("No se guardó el tema", error instanceof Error ? error.message : "desconocido");
      }
    },
  });
}
