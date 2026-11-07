import { neon } from "@neondatabase/serverless";

export interface Bd {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

const ESQUEMA = `
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create or replace function norm(t text) returns text
  language sql immutable parallel safe
  as $$ select lower(public.unaccent('public.unaccent'::regdictionary, t)) $$;
create table if not exists nodos (
  id text primary key,
  nivel text not null,
  etapa text not null,
  campo text not null,
  materia text not null,
  contenido text not null,
  fuente text not null,
  pagina integer not null,
  busqueda text not null
);
create table if not exists temas (
  slug text primary key,
  nodo_id text not null references nodos(id),
  titulo text not null,
  contenido jsonb not null,
  origen text not null check (origen in ('biblioteca', 'vivo')),
  estado text not null default 'publicado',
  busqueda text not null,
  creado timestamptz not null default now()
);
alter table temas add column if not exists palabras text not null default '';
create index if not exists temas_busqueda on temas using gin (busqueda gin_trgm_ops);
create index if not exists nodos_busqueda on nodos using gin (busqueda gin_trgm_ops);
`;

// En globalThis: cada ruta de Next se empaqueta aparte, y sin Neon todas deben ver la misma base en memoria.
const global = globalThis as typeof globalThis & { __bdEscuela?: Promise<Bd> };

async function abrirMemoria(): Promise<Bd> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { pg_trgm } = await import("@electric-sql/pglite/contrib/pg_trgm");
  const { unaccent } = await import("@electric-sql/pglite/contrib/unaccent");
  const pg = await PGlite.create({ extensions: { pg_trgm, unaccent } });
  await pg.exec(ESQUEMA);
  const db: Bd = {
    async query<T>(sql: string, params: unknown[] = []) {
      return (await pg.query<T>(sql, params)).rows;
    },
  };
  const { leerBiblioteca, sembrar } = await import("./biblioteca");
  await sembrar(db, await leerBiblioteca());
  return db;
}

function abrirNeon(url: string): Bd {
  const sql = neon(url);
  return {
    async query<T>(texto: string, params: unknown[] = []) {
      return (await sql.query(texto, params)) as T[];
    },
  };
}

export function bd(): Promise<Bd> {
  global.__bdEscuela ??= process.env.DATABASE_URL
    ? Promise.resolve(abrirNeon(process.env.DATABASE_URL))
    : abrirMemoria();
  return global.__bdEscuela;
}

/** Crea o actualiza las tablas en Neon. Sin Neon, la biblioteca vive en memoria. */
export async function prepararEsquema(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  // El protocolo HTTP de Neon ejecuta una sentencia por llamada.
  for (const sentencia of separarSentencias(ESQUEMA)) await sql.query(sentencia);
}

export function separarSentencias(script: string): string[] {
  const partes = script.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
  return partes.map((s) => s.replace(/;$/, ""));
}
