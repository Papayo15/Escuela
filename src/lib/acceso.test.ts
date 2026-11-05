import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "../proxy";
import { COOKIE_ACCESO, cookieDePlan, planDeCodigo, planDeCookie } from "./acceso";

beforeEach(() => {
  vi.stubEnv("COOKIE_SECRET", "secreto");
  vi.stubEnv("ACCESS_CODE", "LIBROS");
  vi.stubEnv("PREMIUM_CODE", "TODO");
});

const pedir = (ruta: string, cookie?: string | null) =>
  proxy(
    new NextRequest(`https://sitio.mx${ruta}`, {
      headers: cookie ? { cookie: `${COOKIE_ACCESO}=${cookie}` } : {},
    }),
  );

describe("planes", () => {
  it("cada código abre su plan", () => {
    expect(planDeCodigo("LIBROS")).toBe("biblioteca");
    expect(planDeCodigo("TODO")).toBe("premium");
    expect(planDeCodigo("otro")).toBeNull();
  });
  it("cambiar el código expira la cookie anterior", async () => {
    const anterior = (await cookieDePlan("premium")) ?? undefined;
    expect(await planDeCookie(anterior)).toBe("premium");
    vi.stubEnv("PREMIUM_CODE", "NOVIEMBRE");
    expect(await planDeCookie(anterior)).toBeNull();
  });
  it("no acepta una cookie alterada", async () => {
    const c = await cookieDePlan("biblioteca");
    expect(await planDeCookie(c?.replace("biblioteca", "premium"))).toBeNull();
  });
});

describe("proxy", () => {
  it("sin código redirige a /acceso", async () => {
    const r = await pedir("/");
    expect(r.headers.get("location")).toBe("https://sitio.mx/acceso");
  });
  it("sin código rechaza la API", async () => {
    expect((await pedir("/api/plan")).status).toBe(401);
  });
  it("el plan biblioteca lee pero no usa el maestro", async () => {
    const c = await cookieDePlan("biblioteca");
    expect((await pedir("/", c)).status).toBe(200);
    expect((await pedir("/api/explain", c)).status).toBe(403);
    expect((await pedir("/api/vision", c)).status).toBe(403);
  });
  it("el plan completo entra a todo", async () => {
    const c = await cookieDePlan("premium");
    expect((await pedir("/api/vision", c)).status).toBe(200);
  });
  it("sin códigos configurados el sitio sigue abierto", async () => {
    vi.stubEnv("ACCESS_CODE", "");
    expect((await pedir("/")).status).toBe(200);
  });
});
