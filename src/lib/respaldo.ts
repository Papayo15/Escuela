import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Bd } from "./db";
import { archivoTema, type ArchivoTema } from "./schema-tema";

type Fila = {
  slug: string;
  nodo_id: string;
  titulo: string;
  palabras: string;
  contenido: unknown;
  creado: string;
  nivel: string;
  etapa: string;
  materia: string;
};

/**
 * Copia los temas que creó CEVS a `carpeta`:
 * - temas-cevs.json: copia completa; `npm run cargar` la restaura si Neon se borra.
 * - REVISION.md: los mismos temas en texto, para que un maestro los revise.
 * No borra nada de la base.
 */
export async function respaldarVivos(db: Bd, carpeta: string) {
  const filas = await db.query<Fila>(
    `select t.slug, t.nodo_id, t.titulo, t.palabras, t.contenido, t.creado::text as creado,
            n.nivel, n.etapa, n.materia
     from temas t join nodos n on n.id = t.nodo_id
     where t.origen = 'vivo' order by t.creado, t.slug`,
  );

  const temas: ArchivoTema[] = [];
  const descartados: string[] = [];
  for (const f of filas) {
    const tema = archivoTema.safeParse({
      nodo_id: f.nodo_id,
      titulo: f.titulo,
      slug: f.slug,
      palabras: f.palabras.split(" ").filter(Boolean),
      contenido: f.contenido,
    });
    if (tema.success) temas.push(tema.data);
    else descartados.push(f.slug);
  }

  mkdirSync(carpeta, { recursive: true });
  writeFileSync(path.join(carpeta, "temas-cevs.json"), `${JSON.stringify(temas, null, 1)}\n`);
  writeFileSync(path.join(carpeta, "REVISION.md"), hojaDeRevision(temas, new Map(filas.map((f) => [f.slug, f]))));
  return { respaldados: temas.length, descartados };
}

function hojaDeRevision(temas: ArchivoTema[], filas: Map<string, Fila>): string {
  const hoja = [
    "# Temas creados por CEVS: revisión del maestro",
    "",
    `Respaldo del ${new Date().toISOString().slice(0, 10)}. Total: ${temas.length} temas.`,
    "",
    "Para cada tema, revisa que la explicación sea correcta y sencilla, y que cada respuesta esté bien. Anota aquí mismo lo que haya que corregir.",
    "",
  ];
  for (const t of temas) {
    const f = filas.get(t.slug)!;
    const c = t.contenido;
    hoja.push(
      "---",
      "",
      `## ${t.titulo}`,
      "",
      `${f.materia} · ${f.nivel}, ${f.etapa} · creado ${f.creado.slice(0, 10)} · \`${t.slug}\``,
      "",
      "- [ ] Revisado    Correcciones: ______________________",
      "",
      `**🧩 La idea en simple:** ${c.idea}`,
      "",
      "**⚙️ Pizarrón:**",
      "",
      c.pizarron,
      "",
      `**💡 Truco de oro:** ${c.truco}`,
      "",
      `**📝 Práctica exprés:** ${c.practica.ejercicio}`,
      `  - Respuesta: ${c.practica.respuesta}`,
      "",
      "**✏️ Tarea:**",
      ...c.ejercicios.map((e, i) => `${i + 1}. ${e.ejercicio}\n   - Respuesta: ${e.respuesta}`),
      "",
      "**🎯 Reto rápido:**",
      ...(c.reto ?? []).map(
        (p, i) =>
          `${i + 1}. ${p.pregunta}\n${p.opciones
            .map((o, j) => `   - ${j === p.correcta ? "✔" : "✘"} ${o}`)
            .join("\n")}\n   - Por qué: ${p.porque}`,
      ),
      "",
    );
  }
  return `${hoja.join("\n")}\n`;
}
