import { afterEach, describe, expect, it, vi } from "vitest";
import { abrirStream, ErrorOpenRouter, esModeloPrincipal, leerSSE, modelos, type EventoSSE } from "./openrouter";

function flujo(...trozos: string[]): ReadableStream<Uint8Array> {
  const c = new TextEncoder();
  return new ReadableStream({
    start(ctrl) {
      trozos.forEach((t) => ctrl.enqueue(c.encode(t)));
      ctrl.close();
    },
  });
}

async function leer(s: ReadableStream<Uint8Array>) {
  const r: EventoSSE[] = [];
  for await (const e of leerSSE(s)) r.push(e);
  return r;
}

const dato = (o: object) => `data: ${JSON.stringify(o)}\n\n`;
const texto = (t: string) => dato({ model: "m", choices: [{ delta: { content: t } }] });

describe("leerSSE", () => {
  it("ignora comentarios y une trozos cortados a la mitad", async () => {
    const d = texto("hola");
    const r = await leer(
      flujo(": OPENROUTER PROCESSING\n\n", d.slice(0, 12), d.slice(12),
        dato({ model: "m", choices: [{ delta: {}, finish_reason: "stop" }] }), "data: [DONE]\n\n"),
    );
    expect(r).toEqual([{ tipo: "delta", texto: "hola" }, { tipo: "fin", razon: "stop", modelo: "m", uso: undefined }]);
  });
  it("no toma el fragmento de usage como segundo final", async () => {
    const r = await leer(
      flujo(dato({ model: "m", choices: [{ delta: { content: "a" }, finish_reason: "length" }] }),
        dato({ choices: [{ delta: { content: "" }, finish_reason: "length" }], usage: { total_tokens: 5 } }),
        "data: [DONE]\n\n"),
    );
    expect(r.filter((e) => e.tipo === "fin")).toEqual([
      { tipo: "fin", razon: "length", modelo: "m", uso: { total_tokens: 5 } },
    ]);
  });
  it("trata un error a media respuesta como falla", async () => {
    await expect(
      leer(flujo(texto("a"), dato({ error: { code: 502, message: "caído" }, choices: [{ delta: {}, finish_reason: "error" }] }))),
    ).rejects.toBeInstanceOf(ErrorOpenRouter);
  });
  it("no acepta una respuesta interrumpida", async () => {
    await expect(leer(flujo(texto("a")))).rejects.toThrow("interrumpió");
  });
  it("detecta el rechazo del modelo", async () => {
    const r = await leer(flujo(dato({ choices: [{ delta: {}, finish_reason: "stop", native_finish_reason: "refusal" }] }), "data: [DONE]\n\n"));
    expect(r).toEqual([{ tipo: "fin", razon: "refusal", modelo: undefined, uso: undefined }]);
  });
});

describe("modelos", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("usa la lista de respaldo por defecto", () => {
    vi.stubEnv("OPENROUTER_MODELS", "");
    expect(modelos()).toHaveLength(3);
  });
  it("reconoce la versión real detrás del alias", () => {
    vi.stubEnv("OPENROUTER_MODELS", "");
    expect(esModeloPrincipal("anthropic/claude-sonnet-6")).toBe(true);
    expect(esModeloPrincipal("google/gemini-3.8-flash")).toBe(false);
    expect(esModeloPrincipal(undefined)).toBe(false);
  });
  it("permite cambiar el orden", () => {
    vi.stubEnv("OPENROUTER_MODELS", "a/b, c/d");
    expect(modelos()).toEqual(["a/b", "c/d"]);
  });
});

describe("abrirStream: retención de datos", () => {
  const cuerpoEnviado = async (sinRetencion: boolean) => {
    const espia = vi.fn(async () => new Response('data: {"choices":[{"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n'));
    vi.stubGlobal("fetch", espia);
    for await (const evento of abrirStream({
      mensajes: [{ role: "user", content: "hola" }],
      sinRetencion,
    })) {
      void evento;
    }
    vi.unstubAllGlobals();
    const [, init] = espia.mock.calls[0] as unknown as [string, RequestInit];
    return JSON.parse(init.body as string);
  };

  it("una foto va con zdr y sin caché", async () => {
    const cuerpo = await cuerpoEnviado(true);
    expect(cuerpo.provider.zdr).toBe(true);
    expect(cuerpo.cache_control).toBeUndefined();
  });

  it("el texto usa caché y no exige zdr", async () => {
    const cuerpo = await cuerpoEnviado(false);
    expect(cuerpo.provider.zdr).toBeUndefined();
    expect(cuerpo.cache_control).toEqual({ type: "ephemeral" });
  });
});
