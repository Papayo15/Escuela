import { NextResponse, type NextRequest } from "next/server";
import { chatDisponible, COOKIE_ACCESO, cookieValida } from "@/lib/acceso";

export async function proxy(request: NextRequest) {
  if (!chatDisponible()) return NextResponse.next();
  if (await cookieValida(request.cookies.get(COOKIE_ACCESO)?.value)) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return Response.json({ error: "Falta el código de acceso." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/acceso", request.url));
}

export const config = {
  matcher: ["/((?!acceso|api/acceso|_next/static|_next/image|favicon.ico).*)"],
};
