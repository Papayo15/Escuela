import { bd } from "./db";
import type { ContenidoTema, NodoCurricular } from "./schema-tema";

export type TemaResumen = {
  slug: string;
  titulo: string;
  nivel: string;
  etapa: string;
  materia: string;
};
export type Tema = TemaResumen & {
  contenido: ContenidoTema;
  campo: string;
  fuente: string;
  pagina: number;
  origen: "biblioteca" | "vivo";
};

const UMBRAL_TEMA = 0.45;
const COLUMNAS = "t.slug, t.titulo, n.nivel, n.etapa, n.materia";

export async function buscarTemas(q: string, nivel?: string): Promise<TemaResumen[]> {
  const db = await bd();
  return db.query<TemaResumen>(
    `select ${COLUMNAS} from temas t join nodos n on n.id = t.nodo_id
     where t.estado = 'publicado'
       and word_similarity(norm($1), t.busqueda) >= $2
       and ($3::text is null or n.nivel = $3)
     order by word_similarity(norm($1), t.busqueda) desc, t.titulo
     limit 12`,
    [q, UMBRAL_TEMA, nivel ?? null],
  );
}

export type MateriaResumen = { nivel: string; materia: string; total: number };

export async function listarMaterias(nivel?: string): Promise<MateriaResumen[]> {
  const db = await bd();
  return db.query<MateriaResumen>(
    `select n.nivel, n.materia, count(*)::int as total
     from temas t join nodos n on n.id = t.nodo_id
     where t.estado = 'publicado' and ($1::text is null or n.nivel = $1)
     group by n.nivel, n.materia
     order by n.nivel, n.materia`,
    [nivel ?? null],
  );
}

export async function listarTemas(nivel: string, materia: string): Promise<TemaResumen[]> {
  const db = await bd();
  return db.query<TemaResumen>(
    `select ${COLUMNAS} from temas t join nodos n on n.id = t.nodo_id
     where t.estado = 'publicado' and n.nivel = $1 and n.materia = $2
     order by n.etapa, t.titulo`,
    [nivel, materia],
  );
}

export async function obtenerTema(slug: string): Promise<Tema | null> {
  const db = await bd();
  const filas = await db.query<Tema>(
    `select ${COLUMNAS}, n.campo, n.fuente, n.pagina, t.contenido, t.origen
     from temas t join nodos n on n.id = t.nodo_id
     where t.slug = $1 and t.estado = 'publicado'`,
    [slug],
  );
  return filas[0] ?? null;
}

export async function nodosCandidatos(q: string, limite = 25): Promise<NodoCurricular[]> {
  const db = await bd();
  return db.query<NodoCurricular>(
    `select id, nivel, etapa, campo, materia, contenido, fuente, pagina from nodos
     order by word_similarity(norm($1), busqueda) desc limit $2`,
    [q, limite],
  );
}

export async function existeNodo(id: string): Promise<boolean> {
  const db = await bd();
  return (await db.query(`select 1 from nodos where id = $1`, [id])).length === 1;
}

export async function guardarTema(t: {
  slug: string;
  nodo_id: string;
  titulo: string;
  contenido: ContenidoTema;
  origen: "biblioteca" | "vivo";
  palabras: string[];
}): Promise<void> {
  const db = await bd();
  await db.query(
    `insert into temas (slug, nodo_id, titulo, contenido, origen, palabras, busqueda)
     values ($1,$2,$3,$4::jsonb,$5,$6, norm($3 || ' ' || $6))
     on conflict (slug) do update set nodo_id=$2, titulo=$3, contenido=$4::jsonb,
       origen=$5, palabras=$6, busqueda=norm($3 || ' ' || $6)`,
    [t.slug, t.nodo_id, t.titulo, JSON.stringify(t.contenido), t.origen, t.palabras.join(" ")],
  );
}

export function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
