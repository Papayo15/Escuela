/** Valida esquema, enlaces entre temas y nodos, fórmulas y citas literales al PDF. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import katex from "katex";
import "katex/contrib/mhchem";
import { leerBiblioteca } from "../src/lib/biblioteca";
import type { ContenidoTema } from "../src/lib/schema-tema";

const normaliza = (t: string) =>
  t
    .replace(/\s*-\s*\n\s*/g, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLowerCase()
    .trim();

function textos(c: ContenidoTema): string[] {
  return [
    c.idea, c.pizarron, c.truco, c.practica.ejercicio, c.practica.respuesta,
    ...c.analogias.map((a) => a.texto),
    ...c.ejercicios.flatMap((e) => [e.ejercicio, e.respuesta]),
    ...(c.reto ?? []).flatMap((p) => [p.pregunta, ...p.opciones, p.porque]),
  ];
}

export function erroresFormula(texto: string): string[] {
  const errores: string[] = [];
  for (const m of texto.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g)) {
    try {
      katex.renderToString(m[1] ?? m[2], { throwOnError: true, strict: "ignore" });
    } catch (e) {
      errores.push(`${(m[1] ?? m[2]).slice(0, 50)}: ${(e as Error).message.slice(0, 70)}`);
    }
  }
  return errores;
}

const raiz = process.cwd();
const { nodos, temas } = await leerBiblioteca(raiz);
const errores: string[] = [];
const cache = new Map<string, string[]>();
const ids = new Set<string>();

for (const n of nodos) {
  if (ids.has(n.id)) errores.push(`nodo duplicado ${n.id}`);
  ids.add(n.id);
  const ruta = path.join(raiz, "data/fuentes/texto", `${n.fuente}.json`);
  if (!existsSync(ruta)) { errores.push(`${n.id}: sin fuente ${n.fuente}`); continue; }
  if (!cache.has(ruta)) {
    cache.set(ruta, (JSON.parse(readFileSync(ruta, "utf8")) as string[]).map(normaliza));
  }
  if (!cache.get(ruta)![n.pagina - 1]?.includes(normaliza(n.contenido))) {
    errores.push(`${n.id}: no aparece literal en ${n.fuente} p.${n.pagina}: ${n.contenido.slice(0, 60)}`);
  }
}

const slugs = new Set<string>();
for (const t of temas) {
  if (slugs.has(t.slug)) errores.push(`slug duplicado ${t.slug}`);
  slugs.add(t.slug);
  if (!ids.has(t.nodo_id)) errores.push(`${t.slug}: nodo inexistente ${t.nodo_id}`);
  for (const x of textos(t.contenido)) {
    errores.push(...erroresFormula(x).map((e) => `${t.slug}: ${e}`));
  }
}

const retos = temas.filter((t) => t.contenido.reto).length;
console.log(`temas con reto rápido: ${retos} de ${temas.length}`);

const cubiertos = new Set(temas.map((t) => t.nodo_id));
const faltan = nodos.filter((n) => !cubiertos.has(n.id));
const porNivel = Object.groupBy(nodos, (n) => n.nivel);
console.log(`nodos ${nodos.length}, temas ${temas.length}, nodos sin tema ${faltan.length}`);
for (const [nivel, lista] of Object.entries(porNivel)) {
  console.log(`  ${nivel}: ${lista!.length} nodos, ${lista!.filter((n) => cubiertos.has(n.id)).length} con tema`);
}
const avance = Object.fromEntries(
  Object.entries(Object.groupBy(nodos, (n) => `${n.nivel} | ${n.materia}`))
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([clave, lista]) => [
      clave,
      { nodos: lista!.length, con_tema: lista!.filter((n) => cubiertos.has(n.id)).length },
    ]),
);
writeFileSync(
  path.join(raiz, "data/avance.json"),
  `${JSON.stringify({ nodos: nodos.length, temas: temas.length, faltan: faltan.length, avance }, null, 2)}\n`,
);
for (const e of errores.slice(0, 40)) console.log("ERROR", e);
if (errores.length) {
  console.log(`${errores.length} errores`);
  process.exit(1);
}
