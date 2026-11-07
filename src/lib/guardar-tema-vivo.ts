import { pedirJson } from "./openrouter";
import { aSlug, existeNodo, guardarTema, nodosCandidatos, obtenerTema } from "./temas";
import { contenidoTema } from "./schema-tema";

const ejercicio = {
  type: "object",
  properties: { ejercicio: { type: "string" }, respuesta: { type: "string" } },
  required: ["ejercicio", "respuesta"],
  additionalProperties: false,
};

function esquema(ids: string[]) {
  return {
    type: "object",
    properties: {
      nodo_id: { type: "string", enum: ["ninguno", ...ids] },
      apto: { type: "boolean" },
      titulo: { type: "string" },
      palabras: { type: "array", items: { type: "string" } },
      contenido: {
        type: "object",
        properties: {
          idea: { type: "string" },
          pizarron: { type: "string" },
          truco: { type: "string" },
          practica: ejercicio,
          analogias: {
            type: "array",
            items: {
              type: "object",
              properties: { titulo: { type: "string" }, texto: { type: "string" } },
              required: ["titulo", "texto"],
              additionalProperties: false,
            },
          },
          ejercicios: { type: "array", items: ejercicio },
        },
        required: ["idea", "pizarron", "truco", "practica", "analogias", "ejercicios"],
        additionalProperties: false,
      },
    },
    required: ["nodo_id", "apto", "titulo", "palabras", "contenido"],
    additionalProperties: false,
  };
}

const INSTRUCCIONES = `Revisas una explicación generada para un alumno antes de agregarla a una biblioteca escolar basada en el temario oficial de la SEP.

Decide con criterio estricto:
- nodo_id: elige solo un nodo de la lista si la explicación desarrolla ese contenido o un subtema directo de él. Si no corresponde claramente, usa "ninguno".
- apto: true solo si es un tema académico general, no contiene datos personales ni anécdotas del alumno, y los cálculos, respuestas y afirmaciones son correctos y adecuados al nivel.
- titulo: título académico breve y neutro. No copies la pregunta del alumno.
- contenido: reorganiza la explicación en el formato pedido. analogias lleva exactamente dos analogías distintas de la principal; ejercicios lleva exactamente tres ejercicios con respuesta. La explicación no trae la respuesta de la práctica: calcúlala y verifícala tú. Usa Markdown y LaTeX ($...$, \\ce{...}).`;

export async function guardarTemaVivo(pregunta: string, explicacion: string): Promise<string | null> {
  const candidatos = await nodosCandidatos(`${pregunta} ${explicacion.slice(0, 300)}`);
  if (candidatos.length === 0) return null;

  const texto = await pedirJson({
    sistema: INSTRUCCIONES,
    nombre: "tema_revisado",
    esquema: esquema(candidatos.map((n) => n.id)),
    usuario: `<nodos>\n${candidatos
      .map((n) => `${n.id} | ${n.nivel} ${n.etapa} | ${n.materia} | ${n.contenido}`)
      .join("\n")}\n</nodos>\n\n<pregunta_del_alumno>\n${pregunta}\n</pregunta_del_alumno>\n\n<explicacion>\n${explicacion}\n</explicacion>`,
  });
  if (!texto) return null;

  const r = JSON.parse(texto) as {
    nodo_id: string;
    apto: boolean;
    titulo: string;
    palabras: string[];
    contenido: unknown;
  };
  if (!r.apto || r.nodo_id === "ninguno" || !(await existeNodo(r.nodo_id))) return null;

  const contenido = contenidoTema.safeParse(r.contenido);
  const slug = aSlug(r.titulo);
  if (!contenido.success || !slug || (await obtenerTema(slug))) return null;

  await guardarTema({
    slug,
    nodo_id: r.nodo_id,
    titulo: r.titulo,
    contenido: contenido.data,
    origen: "vivo",
    palabras: r.palabras,
  });
  return slug;
}
