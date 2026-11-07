import { cookies } from "next/headers";
import { z } from "zod";
import { COOKIE_PERFIL, perfilDeCookie, progresoActivo, registrarIntento } from "@/lib/progreso";

const intento = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
    aciertos: z.number().int().min(0).max(20),
    total: z.number().int().min(1).max(20),
  })
  .refine((d) => d.aciertos <= d.total);

/** Guarda el resultado de un Reto rápido, solo si el alumno entró a su perfil. */
export async function POST(request: Request) {
  if (!progresoActivo()) return Response.json({ error: "No disponible." }, { status: 404 });
  const id = await perfilDeCookie((await cookies()).get(COOKIE_PERFIL)?.value);
  if (!id) return Response.json({ guardado: false });
  const datos = intento.safeParse(await request.json().catch(() => null));
  if (!datos.success) return Response.json({ error: "Datos no válidos." }, { status: 400 });
  const { slug, aciertos, total } = datos.data;
  return Response.json({ guardado: await registrarIntento(id, slug, aciertos, total) });
}
