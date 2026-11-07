import { beforeEach, describe, expect, it, vi } from "vitest";
import { retoDesdeModelo, type PreguntaModelo } from "./reto";

const guardarTema = vi.fn();
const pedirJson = vi.fn();

vi.mock("./openrouter", () => ({ pedirJson: (...a: unknown[]) => pedirJson(...a) }));
vi.mock("./temas", () => ({
  aSlug: (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  existeNodo: async () => true,
  guardarTema: (...a: unknown[]) => guardarTema(...a),
  nodosCandidatos: async () => [
    { id: "n1", nivel: "Primaria", etapa: "Fase 3", materia: "Matemáticas", contenido: "Sumas" },
  ],
  obtenerTema: async () => null,
}));

const { guardarTemaVivo } = await import("./guardar-tema-vivo");

const pregunta = (n: number): PreguntaModelo => ({
  pregunta: `¿Cuánto es ${n} + ${n}?`,
  correcta: String(2 * n),
  malas: [String(2 * n + 1), String(2 * n - 1)],
  porque: `Porque ${n} y ${n} juntos son ${2 * n}.`,
});
const reto = [1, 2, 3, 4, 5].map(pregunta);

const tema = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    nodo_id: "n1",
    apto: true,
    titulo: "Sumas dobles",
    palabras: ["doble", "suma"],
    contenido: {
      idea: "Sumar un número consigo mismo es como juntar dos montones iguales de canicas.",
      pizarron: "**La regla:** el doble de un número es sumarlo dos veces: n + n = 2n. Ejemplo: 3 + 3 = 6.",
      truco: "El doble es el mismo número dos veces.",
      practica: { ejercicio: "¿Cuál es el doble de 4?", respuesta: "8" },
      analogias: [
        { titulo: "Zapatos", texto: "Cada persona tiene dos zapatos iguales, uno por pie." },
        { titulo: "Espejo", texto: "Frente al espejo ves dos manos: la tuya y la del reflejo." },
      ],
      ejercicios: [
        { ejercicio: "Doble de 5", respuesta: "10" },
        { ejercicio: "Doble de 6", respuesta: "12" },
        { ejercicio: "Doble de 7", respuesta: "14" },
      ],
      reto,
      ...extra,
    },
  });

describe("retoDesdeModelo", () => {
  it("revuelve las opciones sin perder la correcta", () => {
    const r = retoDesdeModelo("sumas", reto)!;
    expect(r).toHaveLength(5);
    r.forEach((p, i) => expect(p.opciones[p.correcta]).toBe(reto[i].correcta));
    expect(new Set(r.map((p) => p.correcta)).size).toBeGreaterThan(1);
  });
  it("rechaza si no son 5 preguntas, hay opciones repetidas o falta una mala", () => {
    expect(retoDesdeModelo("s", reto.slice(0, 4))).toBeNull();
    expect(retoDesdeModelo("s", [...reto.slice(0, 4), { ...pregunta(9), malas: ["18", "17"] }])).toBeNull();
    expect(retoDesdeModelo("s", [...reto.slice(0, 4), { ...pregunta(9), malas: ["19"] }])).toBeNull();
  });
});

describe("guardarTemaVivo", () => {
  beforeEach(() => {
    guardarTema.mockReset();
    pedirJson.mockReset();
  });

  it("guarda el tema completo, con Reto rápido", async () => {
    pedirJson.mockResolvedValue(tema());
    expect(await guardarTemaVivo("¿qué es el doble?", "explicación")).toBe("sumas-dobles");
    const guardado = guardarTema.mock.calls[0][0];
    expect(guardado.origen).toBe("vivo");
    expect(guardado.contenido.reto).toHaveLength(5);
    expect(guardado.contenido.ejercicios).toHaveLength(3);
  });

  it("no guarda un tema sin Reto rápido", async () => {
    pedirJson.mockResolvedValue(tema({ reto: [] }));
    expect(await guardarTemaVivo("¿qué es el doble?", "explicación")).toBeNull();
    expect(guardarTema).not.toHaveBeenCalled();
  });

  it("no guarda un tema marcado como no apto", async () => {
    pedirJson.mockResolvedValue(tema().replace('"apto":true', '"apto":false'));
    expect(await guardarTemaVivo("¿qué es el doble?", "explicación")).toBeNull();
    expect(guardarTema).not.toHaveBeenCalled();
  });
});
