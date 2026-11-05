import { NextResponse } from "next/server";
import {
  accesoActivo,
  COOKIE_ACCESO,
  cookieDePlan,
  DURACION_ACCESO,
  planDeCodigo,
} from "@/lib/acceso";

export async function POST(request: Request) {
  if (!accesoActivo()) {
    return Response.json({ error: "Falta configurar el acceso." }, { status: 500 });
  }
  const datos = (await request.json().catch(() => null)) as { codigo?: unknown } | null;
  const codigo = typeof datos?.codigo === "string" ? datos.codigo.trim() : "";
  const plan = planDeCodigo(codigo);
  const valor = plan && (await cookieDePlan(plan));
  if (!valor) {
    return Response.json({ error: "Ese código no es correcto." }, { status: 401 });
  }
  const respuesta = NextResponse.json({ ok: true, plan });
  respuesta.cookies.set(COOKIE_ACCESO, valor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_ACCESO,
  });
  return respuesta;
}
