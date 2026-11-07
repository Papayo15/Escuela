import { cookies } from "next/headers";
import { z } from "zod";
import { COOKIE_PERFIL, perfilDeCookie, progresoActivo, responderRepaso } from "@/lib/progreso";

const respuesta = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  pregunta: z.number().int().min(0).max(19),
  acierto: z.boolean(),
});

/** Guarda si el alumno acertó una pregunta de repaso y decide cuándo vuelve. */
export async function POST(request: Request) {
  if (!progresoActivo()) return Response.json({ error: "No disponible." }, { status: 404 });
  const id = await perfilDeCookie((await cookies()).get(COOKIE_PERFIL)?.value);
  if (!id) return Response.json({ error: "Entra a tu perfil." }, { status: 401 });
  const datos = respuesta.safeParse(await request.json().catch(() => null));
  if (!datos.success) return Response.json({ error: "Datos no válidos." }, { status: 400 });
  const { slug, pregunta, acierto } = datos.data;
  return Response.json({ guardado: await responderRepaso(id, slug, pregunta, acierto) });
}
