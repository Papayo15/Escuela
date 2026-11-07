import { ESCUELA } from "./marca";

const URL_CHAT = "https://openrouter.ai/api/v1/chat/completions";

/** Alias de OpenRouter: siempre apuntan a la versión vigente de cada familia. */
const MODELOS_BASE = [
  "~anthropic/claude-sonnet-latest",
  "~google/gemini-flash-latest",
  "~openai/gpt-mini-latest",
];

/** Dólares por millón de tokens. Evita que una versión nueva suba el costo sin avisar. */
const TOPE_PRECIO = { prompt: 3, completion: 15 };

export function modelos(): string[] {
  const lista = process.env.OPENROUTER_MODELS?.split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return lista?.length ? lista : MODELOS_BASE;
}

/** Con un alias, el modelo que responde trae otro nombre: se compara la familia. */
export function esModeloPrincipal(modelo: string | undefined): boolean {
  const familia = modelos()[0].replace(/^~/, "").replace(/-latest$/, "");
  return Boolean(modelo?.startsWith(familia));
}

export type Parte =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type MensajeChat = {
  role: "system" | "user" | "assistant";
  content: string | Parte[];
};

export class ErrorOpenRouter extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
    readonly esperar?: number,
    readonly metadata?: Record<string, unknown>,
  ) {
    super(mensaje);
    this.name = "ErrorOpenRouter";
  }
}

type ErrorApi = { code?: number | string; message?: string; metadata?: Record<string, unknown> };

function deError(error: ErrorApi, estado: number, esperar?: number): ErrorOpenRouter {
  const codigo = typeof error.code === "number" ? error.code : estado;
  return new ErrorOpenRouter(codigo, error.message ?? "Error de OpenRouter", esperar, error.metadata);
}

async function solicitar(cuerpo: object, signal?: AbortSignal): Promise<Response> {
  const respuesta = await fetch(URL_CHAT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": ESCUELA,
    },
    body: JSON.stringify(cuerpo),
    signal,
  });
  if (respuesta.ok) return respuesta;
  const datos = (await respuesta.json().catch(() => null)) as { error?: ErrorApi } | null;
  const esperar = Number(respuesta.headers.get("retry-after")) || undefined;
  throw deError(datos?.error ?? {}, respuesta.status, esperar);
}

export type EventoSSE =
  | { tipo: "delta"; texto: string }
  | { tipo: "fin"; razon: string; modelo?: string; uso?: unknown };

type Fragmento = {
  model?: string;
  usage?: unknown;
  error?: ErrorApi;
  choices?: {
    delta?: { content?: string | null };
    finish_reason?: string | null;
    native_finish_reason?: string | null;
  }[];
};

/** Lee el flujo SSE de OpenRouter. Una falla a media respuesta llega con estado 200. */
export async function* leerSSE(cuerpo: ReadableStream<Uint8Array>): AsyncGenerator<EventoSSE> {
  const lector = cuerpo.getReader();
  const decodificador = new TextDecoder();
  let resto = "";
  let razon: string | undefined;
  let modelo: string | undefined;
  let uso: unknown;
  let terminado = false;

  const procesar = (linea: string): { eventos: EventoSSE[] } => {
    const eventos: EventoSSE[] = [];
    const limpia = linea.trim();
    if (!limpia.startsWith("data:")) return { eventos };
    const dato = limpia.slice(5).trim();
    if (dato === "[DONE]") {
      terminado = true;
      return { eventos };
    }
    const f = JSON.parse(dato) as Fragmento;
    if (f.error) throw deError(f.error, 502);
    modelo = f.model ?? modelo;
    uso = f.usage ?? uso;
    const eleccion = f.choices?.[0];
    if (eleccion?.delta?.content) eventos.push({ tipo: "delta", texto: eleccion.delta.content });
    if (eleccion?.finish_reason) {
      if (eleccion.finish_reason === "error") throw new ErrorOpenRouter(502, "Falla a media respuesta");
      razon ??=
        eleccion.native_finish_reason === "refusal" ? "refusal" : eleccion.finish_reason;
    }
    return { eventos };
  };

  while (!terminado) {
    const { value, done } = await lector.read();
    if (value) resto += decodificador.decode(value, { stream: true });
    const lineas = resto.split("\n");
    resto = done ? "" : (lineas.pop() ?? "");
    for (const linea of lineas) {
      yield* procesar(linea).eventos;
      if (terminado) break;
    }
    if (done) break;
  }
  await lector.cancel().catch(() => undefined);
  if (!razon) throw new ErrorOpenRouter(502, "La respuesta se interrumpió");
  yield { tipo: "fin", razon, modelo, uso };
}

export async function* abrirStream(opciones: {
  mensajes: MensajeChat[];
  signal?: AbortSignal;
  /** Exige proveedores que no retengan datos. Se usa en toda solicitud con foto. */
  sinRetencion?: boolean;
}): AsyncGenerator<EventoSSE> {
  const respuesta = await solicitar(
    {
      models: modelos(),
      stream: true,
      max_tokens: 4000,
      messages: opciones.mensajes,
      ...(opciones.sinRetencion ? {} : { cache_control: { type: "ephemeral" } }),
      provider: { max_price: TOPE_PRECIO, ...(opciones.sinRetencion ? { zdr: true } : {}) },
    },
    opciones.signal,
  );
  if (!respuesta.body) throw new ErrorOpenRouter(502, "Respuesta vacía");
  yield* leerSSE(respuesta.body);
}

/** Pide JSON con esquema al modelo principal. Una respuesta sin razón `stop` no se usa. */
export async function pedirJson(opciones: {
  sistema: string;
  usuario: string;
  nombre: string;
  esquema: object;
}): Promise<string | null> {
  const respuesta = await solicitar({
    models: modelos(),
    max_tokens: 8000,
    messages: [
      { role: "system", content: opciones.sistema },
      { role: "user", content: opciones.usuario },
    ],
    provider: { require_parameters: true, max_price: TOPE_PRECIO },
    response_format: {
      type: "json_schema",
      json_schema: { name: opciones.nombre, strict: true, schema: opciones.esquema },
    },
  });
  const datos = (await respuesta.json()) as {
    error?: ErrorApi;
    choices?: { finish_reason?: string; message?: { content?: string | null } }[];
  };
  if (datos.error) throw deError(datos.error, 502);
  const eleccion = datos.choices?.[0];
  return eleccion?.finish_reason === "stop" ? (eleccion.message?.content ?? null) : null;
}
