import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  borrarAlumno,
  COOKIE_PERFIL,
  cookieDePerfil,
  crearAlumno,
  DURACION_PERFIL,
  entrarAlumno,
  perfilDeCookie,
  progresoActivo,
} from "@/lib/progreso";

const apagado = () => Response.json({ error: "No disponible." }, { status: 404 });

/** Crea un perfil o entra a uno. Solo pide apodo y PIN. */
export async function POST(request: Request) {
  if (!progresoActivo()) return apagado();
  const datos = (await request.json().catch(() => null)) as
    | { accion?: unknown; apodo?: unknown; pin?: unknown }
    | null;
  const apodo = typeof datos?.apodo === "string" ? datos.apodo : "";
  const pin = typeof datos?.pin === "string" ? datos.pin : "";
  const resultado =
    datos?.accion === "crear" ? await crearAlumno(apodo, pin) : await entrarAlumno(apodo, pin);
  if (!resultado.ok) return Response.json({ error: resultado.error }, { status: resultado.estado });
  const respuesta = NextResponse.json({ ok: true, apodo: resultado.apodo });
  respuesta.cookies.set(COOKIE_PERFIL, await cookieDePerfil(resultado.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_PERFIL,
  });
  return respuesta;
}

/** Salir del perfil; con ?borrar=1 también borra el perfil y todo su progreso. */
export async function DELETE(request: Request) {
  if (!progresoActivo()) return apagado();
  const id = await perfilDeCookie((await cookies()).get(COOKIE_PERFIL)?.value);
  if (id && new URL(request.url).searchParams.get("borrar") === "1") await borrarAlumno(id);
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.delete(COOKIE_PERFIL);
  return respuesta;
}
