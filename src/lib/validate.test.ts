import { describe, expect, it } from "vitest";
import { separarSentencias } from "./db";
import { traducirError } from "./errores-claude";
import { aSlug } from "./temas";
import { validarSolicitud } from "./validate";

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
