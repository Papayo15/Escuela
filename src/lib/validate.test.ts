import { describe, expect, it } from "vitest";
import { separarSentencias } from "./db";
import { traducirError } from "./errores-chat";
import { aSlug } from "./temas";
import { ErrorOpenRouter } from "./openrouter";
import { MAX_IMAGEN, validarFoto, validarSolicitud } from "./validate";

const u = (content: string) => ({ role: "user", content });
const a = (content: string) => ({ role: "assistant", content });

describe("validarSolicitud", () => {
  it("acepta una conversación válida", () => {
    expect(validarSolicitud({ modo: "seguimiento", messages: [u("hola"), a("qué tal"), u("duda")] }).ok).toBe(true);
  });
  it("rechaza que termine la app", () => {
    expect(validarSolicitud({ modo: "seguimiento", messages: [u("hola"), a("qué tal")] }).ok).toBe(false);
  });
  it("rechaza turnos seguidos del mismo rol", () => {
    expect(validarSolicitud({ modo: "seguimiento", messages: [u("a"), u("b")] }).ok).toBe(false);
  });
  it("rechaza preguntas demasiado largas", () => {
    expect(validarSolicitud({ modo: "seguimiento", messages: [u("x".repeat(2001))] }).ok).toBe(false);
  });
  it("exige un solo mensaje en tema nuevo", () => {
    expect(validarSolicitud({ modo: "tema-nuevo", messages: [u("a"), a("b"), u("c")] }).ok).toBe(false);
  });
});

describe("utilidades", () => {
  it("crea slugs limpios", () => {
    expect(aSlug("Fracciones: ¿qué son? Año 2")).toBe("fracciones-que-son-ano-2");
  });
  it("separa sentencias sin romper la función con $$", () => {
    expect(separarSentencias("create x;\ncreate function f() as $$ select 1; $$;\n").length).toBe(2);
  });
  it("traduce errores desconocidos", () => {
    expect(traducirError(new Error("x")).codigo).toBe("fallo");
  });
});

describe("errores del chat", () => {
  it("avisa cuando no hay saldo y no ofrece reintentar", () => {
    const e = traducirError(new ErrorOpenRouter(402, "sin saldo"));
    expect(e.codigo).toBe("presupuesto");
    expect(e.reintentar).toBe(false);
  });
  it("respeta el tiempo de espera", () => {
    expect(traducirError(new ErrorOpenRouter(429, "x", 12)).mensaje).toContain("12 segundos");
  });
  it("trata la moderación como rechazo", () => {
    expect(traducirError(new ErrorOpenRouter(403, "x")).codigo).toBe("rechazo");
  });
});

describe("validarFoto", () => {
  const imagen = "data:image/jpeg;base64,QUJD";
  it("acepta una foto válida", () => {
    expect(validarFoto({ pregunta: "ayuda", imagen }).ok).toBe(true);
  });
  it("rechaza tipos no permitidos", () => {
    expect(validarFoto({ pregunta: "ayuda", imagen: "data:image/svg+xml;base64,QUJD" }).ok).toBe(false);
  });
  it("rechaza un data URL inválido", () => {
    expect(validarFoto({ pregunta: "ayuda", imagen: "https://sitio.mx/a.jpg" }).ok).toBe(false);
  });
  it("rechaza una foto demasiado grande", () => {
    const r = validarFoto({ pregunta: "ayuda", imagen: `data:image/jpeg;base64,${"A".repeat(MAX_IMAGEN)}` });
    expect(r.ok ? "" : r.error).toBe("La foto es demasiado grande.");
  });
});
