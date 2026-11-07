import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apodoValido,
  calcularRacha,
  calendario,
  cookieDePerfil,
  hoyEnMexico,
  perfilDeCookie,
  pinValido,
  progresoActivo,
  siguienteRepaso,
} from "./progreso";

afterEach(() => vi.unstubAllEnvs());

describe("interruptor", () => {
  it("viene apagado", () => {
    vi.stubEnv("PROGRESO_ACTIVO", "");
    vi.stubEnv("ACCESS_CODE", "a");
    vi.stubEnv("COOKIE_SECRET", "s");
    expect(progresoActivo()).toBe(false);
  });
  it("sin código de acceso no se enciende", () => {
    vi.stubEnv("PROGRESO_ACTIVO", "1");
    vi.stubEnv("ACCESS_CODE", "");
    expect(progresoActivo()).toBe(false);
  });
  it("se enciende con PROGRESO_ACTIVO=1 y acceso", () => {
    vi.stubEnv("PROGRESO_ACTIVO", "1");
    vi.stubEnv("ACCESS_CODE", "a");
    vi.stubEnv("COOKIE_SECRET", "s");
    expect(progresoActivo()).toBe(true);
  });
});

describe("apodo y PIN", () => {
  it("acepta apodos sin espacios", () => {
    expect(apodoValido("tigre_azul")).toBe(true);
    expect(apodoValido("niño7")).toBe(true);
  });
  it("rechaza nombres con espacios, muy cortos o con símbolos", () => {
    expect(apodoValido("juan perez")).toBe(false);
    expect(apodoValido("ab")).toBe(false);
    expect(apodoValido("hola@x")).toBe(false);
  });
  it("el PIN tiene 6 números", () => {
    expect(pinValido("123456")).toBe(true);
    expect(pinValido("12345")).toBe(false);
    expect(pinValido("12a456")).toBe(false);
  });
});

describe("cookie del perfil", () => {
  it("solo acepta la firma correcta", async () => {
    vi.stubEnv("COOKIE_SECRET", "secreto");
    const valor = await cookieDePerfil("abc-123");
    expect(await perfilDeCookie(valor)).toBe("abc-123");
    expect(await perfilDeCookie(valor.replace("abc", "xyz"))).toBeNull();
    expect(await perfilDeCookie("abc-123.00")).toBeNull();
  });
});

describe("racha y calendario", () => {
  const dias = new Set(["2026-11-03", "2026-11-04", "2026-11-05"]);
  it("cuenta días seguidos hasta ayer", () => {
    expect(calcularRacha(dias, "2026-11-06")).toBe(3);
  });
  it("cuenta hoy si ya practicó", () => {
    expect(calcularRacha(new Set([...dias, "2026-11-06"]), "2026-11-06")).toBe(4);
  });
  it("se rompe si faltó un día", () => {
    expect(calcularRacha(dias, "2026-11-08")).toBe(0);
  });
  it("cruza de mes", () => {
    expect(calcularRacha(new Set(["2026-10-31", "2026-11-01"]), "2026-11-01")).toBe(2);
  });
  it("arma 14 días terminando hoy", () => {
    const c = calendario(new Map([["2026-11-06", 2]]), "2026-11-06");
    expect(c).toHaveLength(14);
    expect(c[0].fecha).toBe("2026-10-24");
    expect(c.at(-1)).toEqual({ fecha: "2026-11-06", retos: 2 });
  });
  it("usa la hora de México", () => {
    expect(hoyEnMexico(new Date("2026-11-07T03:00:00Z"))).toBe("2026-11-06");
  });
});

describe("repaso espaciado", () => {
  it("si falla, vuelve mañana", () => {
    expect(siguienteRepaso(2, false, "2026-11-07")).toEqual({ nivel: 0, proximo: "2026-11-08" });
  });
  it("si acierta, se aleja: 3 días y luego una semana", () => {
    expect(siguienteRepaso(0, true, "2026-11-07")).toEqual({ nivel: 1, proximo: "2026-11-10" });
    expect(siguienteRepaso(1, true, "2026-11-07")).toEqual({ nivel: 2, proximo: "2026-11-14" });
  });
  it("tras tres aciertos ya la domina", () => {
    expect(siguienteRepaso(2, true, "2026-11-07")).toBeNull();
  });
});
