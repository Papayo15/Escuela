import { NextResponse } from "next/server";
import { COOKIE_ACCESO, firmaAcceso, igualesSeguro } from "@/lib/acceso";

export async function POST(request: Request) {
  const { ACCESS_CODE, COOKIE_SECRET } = process.env;
  if (!ACCESS_CODE || !COOKIE_SECRET) {
    return Response.json({ error: "Falta configurar el acceso." }, { status: 500 });
  }
  const datos = (await request.json().catch(() => null)) as { codigo?: unknown } | null;
  const codigo = typeof datos?.codigo === "string" ? datos.codigo.trim() : "";
  if (!igualesSeguro(codigo, ACCESS_CODE)) {
    return Response.json({ error: "Ese código no es correcto." }, { status: 401 });
  }
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_ACCESO, await firmaAcceso(COOKIE_SECRET), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return respuesta;
}
