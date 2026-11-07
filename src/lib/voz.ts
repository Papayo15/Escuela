/**
 * Voz del navegador: leer en voz alta y revisar lo que dice el alumno.
 * No gasta IA. Las funciones puras se prueban sin navegador.
 */
import type { ContenidoTema } from "./schema-tema";

export type Idioma = "en-US" | "es-MX";

export const MATERIAS_ESPANOL = ["Español", "Lengua y Comunicación"];
export const esMateriaEspanol = (materia: string) => MATERIAS_ESPANOL.includes(materia);
export const esMateriaIngles = (materia: string) => materia === "Inglés";

/** Palabras muy comunes del español que no existen en inglés. */
const PALABRAS_ESPANOL = new Set(
  "el la los las de del que y en para tu tus con un una unos unas es por se lo al mi mis su sus muy letras palabra palabras".split(" "),
);

/** Inglés: sin acentos, ñ ni signos de apertura, y sin palabras típicas del español. */
export function pareceIngles(texto: string): boolean {
  if (!/[a-z]/i.test(texto) || /[áéíóúüñ¿¡]/i.test(texto) || texto.length > 200) return false;
  return !texto.toLowerCase().split(/[^a-z]+/).some((p) => PALABRAS_ESPANOL.has(p));
}

/** Quita Markdown y fórmulas para que la voz no lea asteriscos ni signos de dólar. */
export function limpiarParaVoz(markdown: string): string {
  return markdown
    .replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*\$/g, " ")
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, " ")
    .replace(/\|/g, ", ")
    .replace(/[*_#`>~]/g, "")
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/\.\s*\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Qué parte de las palabras de la frase se escuchó (0 a 1). El orden no importa. */
export function parecido(objetivo: string, oido: string): number {
  const meta = normalizar(objetivo);
  if (meta.length === 0) return 0;
  const bolsa = new Map<string, number>();
  for (const p of normalizar(oido)) bolsa.set(p, (bolsa.get(p) ?? 0) + 1);
  let aciertos = 0;
  for (const p of meta) {
    const n = bolsa.get(p) ?? 0;
    if (n > 0) {
      aciertos++;
      bolsa.set(p, n - 1);
    }
  }
  return aciertos / meta.length;
}

export const UMBRAL_BIEN = 0.8;

/** Frases en inglés del tema (las que van en cursiva), para repetirlas en voz alta. */
export function frasesIngles(c: ContenidoTema, maximo = 5): string[] {
  const texto = [c.pizarron, c.idea, c.truco].join("\n");
  const vistas = new Set<string>();
  const frases: string[] = [];
  // Solo cursivas (*así*), nunca negritas (**así**).
  for (const m of texto.matchAll(/(?<!\*)\*(?!\*)([^*\n]{3,90}?)\*(?!\*)/g)) {
    const frase = m[1].replace(/\.\.\.$|…$/, "").trim();
    if (frase.endsWith(":")) continue;
    const clave = frase.toLowerCase();
    if (!pareceIngles(frase) || frase.split(/\s+/).length < 2 || /_/.test(frase) || vistas.has(clave)) continue;
    vistas.add(clave);
    frases.push(frase);
    if (frases.length === maximo) break;
  }
  return frases;
}

/** Oraciones cortas de la explicación para leerlas en voz alta. */
export function frasesLectura(c: ContenidoTema, maximo = 3): string[] {
  const oraciones = limpiarParaVoz(`${c.idea}\n${c.truco}`)
    .split(/(?<=[.!?])\s+/)
    .map((o) => o.trim())
    .filter((o) => {
      const palabras = o.split(/\s+/).length;
      return palabras >= 4 && palabras <= 14 && !/[=+×÷<>]/.test(o);
    });
  return [...new Set(oraciones)].slice(0, maximo);
}

// ---------- Solo en el navegador ----------

export function hayVoz(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function hablar(texto: string, idioma: Idioma) {
  const voz = window.speechSynthesis;
  voz.cancel();
  const frase = new SpeechSynthesisUtterance(texto.replace(/_+/g, " ... "));
  frase.lang = idioma;
  frase.rate = idioma === "en-US" ? 0.85 : 0.95;
  frase.voice =
    voz.getVoices().find((v) => v.lang === idioma) ??
    voz.getVoices().find((v) => v.lang.startsWith(idioma.slice(0, 2))) ??
    null;
  voz.speak(frase);
}

type Reconocedor = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};
type ConstructorReconocedor = new () => Reconocedor;

function claseReconocedor(): ConstructorReconocedor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: ConstructorReconocedor; webkitSpeechRecognition?: ConstructorReconocedor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const hayMicrofono = () => Boolean(claseReconocedor());

/** Escucha una frase y devuelve lo que entendió el navegador (la mejor de varias opciones). */
export function escucharFrase(objetivo: string, idioma: Idioma): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const Clase = claseReconocedor();
    if (!Clase) return rechazar(new Error("sin-microfono"));
    const rec = new Clase();
    rec.lang = idioma;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    let listo = false;
    rec.onresult = (e) => {
      const opciones = Array.from(e.results[0] ?? []).map((a) => a.transcript);
      const mejor = opciones.sort((a, b) => parecido(objetivo, b) - parecido(objetivo, a))[0] ?? "";
      listo = true;
      resolver(mejor);
    };
    rec.onerror = (e) => {
      listo = true;
      rechazar(new Error(e.error));
    };
    rec.onend = () => {
      if (!listo) resolver("");
    };
    rec.start();
  });
}
