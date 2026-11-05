import { cookies } from "next/headers";
import { chatDisponible, COOKIE_ACCESO, planDeCookie } from "@/lib/acceso";
import { PROMPT_VISION } from "@/lib/pedagogical-prompt";
import { respuestaEnVivo } from "@/lib/stream-chat";
import { MAX_CUERPO_FOTO, validarFoto } from "@/lib/validate";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!chatDisponible()) {
    return Response.json({ error: "El Maestro en vivo no está activado." }, { status: 503 });
  }
  const almacen = await cookies();
  const plan = await planDeCookie(almacen.get(COOKIE_ACCESO)?.value);
  if (!plan) return Response.json({ error: "Falta el código de acceso." }, { status: 401 });
  if (plan !== "premium") {
    return Response.json({ error: "El Maestro en vivo es del plan completo." }, { status: 403 });
  }
  const texto = await request.text();
  if (texto.length > MAX_CUERPO_FOTO) {
    return Response.json({ error: "La foto es demasiado grande." }, { status: 413 });
  }
  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const validacion = validarFoto(cuerpo);
  if (!validacion.ok) return Response.json({ error: validacion.error }, { status: 400 });
  const { nivel, pregunta, imagen } = validacion.datos;

  return respuestaEnVivo({
    signal: request.signal,
    sinRetencion: true,
    mensajes: [
      { role: "system", content: PROMPT_VISION },
      {
        role: "user",
        content: [
          { type: "text", text: nivel ? `Nivel escolar del alumno: ${nivel}.\n\n${pregunta}` : pregunta },
          { type: "image_url", image_url: { url: imagen } },
        ],
      },
    ],
  });
}
