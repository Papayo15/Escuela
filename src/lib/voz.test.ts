import { describe, expect, it } from "vitest";
import type { ContenidoTema } from "./schema-tema";
import { frasesIngles, frasesLectura, limpiarParaVoz, pareceIngles, parecido, UMBRAL_BIEN } from "./voz";

const base = {
  practica: { ejercicio: "x", respuesta: "y" },
  analogias: [],
  ejercicios: [],
};

describe("parecido", () => {
  it("acepta la frase dicha igual, sin importar mayúsculas ni signos", () => {
    expect(parecido("I am wearing a blue shirt", "i am wearing a blue shirt.")).toBe(1);
  });
  it("una palabra de más o el orden no la tumban", () => {
    expect(parecido("I like apples", "yes I like apples")).toBe(1);
  });
  it("si faltan palabras, baja de lo necesario", () => {
    expect(parecido("I am wearing a blue shirt", "I am blue")).toBeLessThan(UMBRAL_BIEN);
  });
  it("ignora acentos al leer en español", () => {
    expect(parecido("El niño comió pan", "el nino comio pan")).toBe(1);
  });
});

describe("frases para practicar", () => {
  it("toma las frases en inglés en cursiva, sin repetir ni espacios en blanco", () => {
    const c = {
      ...base,
      idea: "Hola",
      // Límite conocido: el español sin acentos ("camisa azul") parece inglés; en Inglés casi no se usa en cursiva.
      pizarron: "Se dice *I am wearing...* y *I am wearing a blue shirt*. Palabra sola: *shirt*. Hueco: *I ___ a cap*. Español: *¿qué traes?*. Otra vez *I am wearing a blue shirt*.",
      truco: "*Good morning, teacher*",
    } as ContenidoTema;
    expect(frasesIngles(c)).toEqual(["I am wearing", "I am wearing a blue shirt", "Good morning, teacher"]);
  });
  it("toma oraciones cortas para leer en voz alta", () => {
    const c = {
      ...base,
      idea: "Una carta lleva saludo. Imagina que le escribes a tu abuela para contarle algo bonito. Sí.",
      pizarron: "",
      truco: "**Recuerda:** escribe con letra clara y firma al final.",
    } as ContenidoTema;
    expect(frasesLectura(c)).toEqual([
      "Una carta lleva saludo.",
      "Imagina que le escribes a tu abuela para contarle algo bonito.",
      "Recuerda: escribe con letra clara y firma al final.",
    ]);
  });
});

describe("voz", () => {
  it("quita marcas y fórmulas antes de leer", () => {
    expect(limpiarParaVoz("**Qué es:** una *carta* con $x^2$.")).toBe("Qué es: una carta con .");
  });
  it("distingue inglés de español", () => {
    expect(pareceIngles("I am wearing")).toBe(true);
    expect(pareceIngles("¿Cómo estás?")).toBe(false);
    expect(pareceIngles("26 letras")).toBe(false);
    expect(pareceIngles("camisa de la escuela")).toBe(false);
  });
  it("no toma las negritas como frases", () => {
    const c = { ...base, idea: "", truco: "", pizarron: "**La regla:** se dice *Good morning*. **Para tu escuela:** saluda." } as ContenidoTema;
    expect(frasesIngles(c)).toEqual(["Good morning"]);
  });
});
