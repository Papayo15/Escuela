import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Bd } from "./db";
import {
  archivoRetos,
  archivoTema,
  nodoCurricular,
  type ArchivoTema,
  type NodoCurricular,
} from "./schema-tema";

export type Biblioteca = { nodos: NodoCurricular[]; temas: ArchivoTema[] };

async function jsonEn(directorio: string): Promise<string[]> {
  const entradas = await readdir(directorio, { withFileTypes: true }).catch(() => []);
  const listas = await Promise.all(
    entradas.map((e) => {
      const ruta = path.join(directorio, e.name);
      if (e.isDirectory()) return jsonEn(ruta);
      return Promise.resolve(e.name.endsWith(".json") ? [ruta] : []);
    }),
  );
  return listas.flat().sort();
}

export async function leerBiblioteca(raiz = process.cwd()): Promise<Biblioteca> {
  const datos = path.join(raiz, "data");
  const nodos: NodoCurricular[] = [];
  for (const ruta of await jsonEn(path.join(datos, "temario"))) {
    nodos.push(...nodoCurricular.array().parse(JSON.parse(await readFile(ruta, "utf8"))));
  }
  const temas: ArchivoTema[] = [];
  for (const ruta of await jsonEn(path.join(datos, "temas"))) {
    temas.push(...archivoTema.array().parse(JSON.parse(await readFile(ruta, "utf8"))));
  }
  const retos: Record<string, ArchivoTema["contenido"]["reto"]> = {};
  for (const ruta of await jsonEn(path.join(datos, "retos"))) {
    Object.assign(retos, archivoRetos.parse(JSON.parse(await readFile(ruta, "utf8"))));
  }
  const conReto = temas.map((t) =>
    retos[t.slug] ? { ...t, contenido: { ...t.contenido, reto: retos[t.slug] } } : t,
  );
  const sobran = Object.keys(retos).filter((s) => !temas.some((t) => t.slug === s));
  if (sobran.length) throw new Error(`Retos sin tema: ${sobran.slice(0, 5).join(", ")}`);
  return { nodos, temas: conReto };
}

export async function sembrar(db: Bd, { nodos, temas }: Biblioteca): Promise<void> {
  await db.query(
    `insert into nodos (id, nivel, etapa, campo, materia, contenido, fuente, pagina, busqueda)
     select id, nivel, etapa, campo, materia, contenido, fuente, pagina,
            norm(materia || ' ' || contenido)
     from json_to_recordset($1::json) as x(id text, nivel text, etapa text, campo text,
       materia text, contenido text, fuente text, pagina int)
     on conflict (id) do update set nivel = excluded.nivel, etapa = excluded.etapa,
       campo = excluded.campo, materia = excluded.materia, contenido = excluded.contenido,
       fuente = excluded.fuente, pagina = excluded.pagina, busqueda = excluded.busqueda`,
    [JSON.stringify(nodos)],
  );
  const filas = temas.map((t) => ({ ...t, palabras: t.palabras.join(" ") }));
  await db.query(
    `insert into temas (slug, nodo_id, titulo, contenido, origen, busqueda)
     select slug, nodo_id, titulo, contenido, 'biblioteca', norm(titulo || ' ' || palabras)
     from json_to_recordset($1::json) as x(slug text, nodo_id text, titulo text,
       contenido jsonb, palabras text)
     on conflict (slug) do update set nodo_id = excluded.nodo_id, titulo = excluded.titulo,
       contenido = excluded.contenido, busqueda = excluded.busqueda`,
    [JSON.stringify(filas)],
  );
}
