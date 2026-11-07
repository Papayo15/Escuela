import { NextResponse, type NextRequest } from "next/server";
import { accesoActivo, COOKIE_ACCESO, planDeCookie } from "./lib/acceso";
import { ASISTENTE } from "./lib/marca";

const RUTAS_PREMIUM = ["/api/explain", "/api/vision"];

export async function proxy(request: NextRequest) {
  if (!accesoActivo()) return NextResponse.next();
  const { pathname } = request.nextUrl;
  const plan = await planDeCookie(request.cookies.get(COOKIE_ACCESO)?.value);
  if (!plan) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "Falta el código de acceso." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/acceso", request.url));
  }
  if (plan !== "premium" && RUTAS_PREMIUM.includes(pathname)) {
    return Response.json({ error: `${ASISTENTE} es del plan completo.` }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!acceso|api/acceso|_next/static|_next/image|favicon.ico).*)"],
};
