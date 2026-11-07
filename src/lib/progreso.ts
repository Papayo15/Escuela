/**
 * Progreso del alumno: apagado por defecto (PROGRESO_ACTIVO=1 lo enciende).
 * Apagado no crea tablas ni guarda nada. Encendido guarda solo un apodo, un PIN cifrado
 * y, por cada Reto rápido, el tema, los aciertos y la fecha. Nunca el chat ni fotos.
 */
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { accesoActivo, igualesSeguro } from "./acceso";
import { bd } from "./db";

export const COOKIE_PERFIL = "perfil_alumno";
export const DURACION_PERFIL = 60 * 60 * 24 * 180;
const MAX_FALLOS = 5;
const MINUTOS_BLOQUEO = 15;
const ZONA = "America/Mexico_City";
const derivar = promisify(scrypt) as (pin: string, sal: Buffer, largo: number) => Promise<Buffer>;

export function progresoActivo(): boolean {
  return process.env.PROGRESO_ACTIVO === "1" && accesoActivo();
}

const ESQUEMA_PROGRESO = [
  `create table if not exists alumnos (
    id text primary key,
    apodo text not null unique,
    pin text not null,
    fallos integer not null default 0,
    bloqueado_hasta timestamptz,
    creado timestamptz not null default now()
  )`,
  `create table if not exists intentos (
    alumno_id text not null references alumnos(id) on delete cascade,
    slug text not null,
    aciertos integer not null check (aciertos >= 0),
    total integer not null check (total > 0 and aciertos <= total),
    creado timestamptz not null default now()
  )`,
  `create index if not exists intentos_alumno on intentos (alumno_id, creado)`,
];

let listo: Promise<void> | undefined;

/** Solo se llama con el progreso encendido: apagado, las tablas ni existen. */
async function preparar(): Promise<void> {
  if (!progresoActivo()) throw new Error("El progreso está apagado");
  listo ??= (async () => {
    const db = await bd();
    for (const sentencia of ESQUEMA_PROGRESO) await db.query(sentencia);
  })();
  return listo;
}

// ---------- Validación ----------

/** Un apodo, no un nombre: corto y sin espacios, para no invitar a escribir el nombre completo. */
export function apodoValido(apodo: string): boolean {
  return /^[a-z0-9ñ_]{3,20}$/.test(apodo);
}

export function pinValido(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export const normalizarApodo = (apodo: string) => apodo.trim().toLowerCase();

// ---------- PIN y cookie ----------

async function cifrarPin(pin: string): Promise<string> {
  const sal = randomBytes(16);
  return `${sal.toString("hex")}.${(await derivar(pin, sal, 32)).toString("hex")}`;
}

async function pinCorrecto(pin: string, guardado: string): Promise<boolean> {
  const [sal, hash] = guardado.split(".");
  const calculado = await derivar(pin, Buffer.from(sal, "hex"), 32);
  return timingSafeEqual(calculado, Buffer.from(hash, "hex"));
}

async function firma(id: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.COOKIE_SECRET ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(`perfil-v1:${id}`));
  return Buffer.from(bytes).toString("hex");
}

export async function cookieDePerfil(id: string): Promise<string> {
  return `${id}.${await firma(id)}`;
}

export async function perfilDeCookie(valor: string | undefined): Promise<string | null> {
  if (!valor || !process.env.COOKIE_SECRET) return null;
  const punto = valor.lastIndexOf(".");
  const id = valor.slice(0, punto);
  return punto > 0 && igualesSeguro(valor.slice(punto + 1), await firma(id)) ? id : null;
}

// ---------- Alumnos ----------

type Alumno = { id: string; apodo: string; pin: string; fallos: number; bloqueado: boolean };

export type ResultadoPerfil =
  | { ok: true; id: string; apodo: string }
  | { ok: false; error: string; estado: number };

export async function crearAlumno(apodoCrudo: string, pin: string): Promise<ResultadoPerfil> {
  await preparar();
  const apodo = normalizarApodo(apodoCrudo);
  if (!apodoValido(apodo) || !pinValido(pin)) {
    return { ok: false, estado: 400, error: "Usa un apodo de 3 a 20 letras o números, sin espacios, y un PIN de 6 números." };
  }
  const db = await bd();
  const id = randomUUID();
  const filas = await db.query<{ id: string }>(
    `insert into alumnos (id, apodo, pin) values ($1, $2, $3)
     on conflict (apodo) do nothing returning id`,
    [id, apodo, await cifrarPin(pin)],
  );
  if (filas.length === 0) return { ok: false, estado: 409, error: "Ese apodo ya existe. Elige otro." };
  return { ok: true, id, apodo };
}

export async function entrarAlumno(apodoCrudo: string, pin: string): Promise<ResultadoPerfil> {
  await preparar();
  const apodo = normalizarApodo(apodoCrudo);
  const incorrecto = { ok: false as const, estado: 401, error: "El apodo o el PIN no son correctos." };
  if (!apodoValido(apodo) || !pinValido(pin)) return incorrecto;
  const db = await bd();
  const [alumno] = await db.query<Alumno>(
    `select id, apodo, pin, fallos, coalesce(bloqueado_hasta > now(), false) as bloqueado
     from alumnos where apodo = $1`,
    [apodo],
  );
  if (!alumno) return incorrecto;
  if (alumno.bloqueado) {
    return { ok: false, estado: 429, error: `Muchos intentos. Espera ${MINUTOS_BLOQUEO} minutos.` };
  }
  if (!(await pinCorrecto(pin, alumno.pin))) {
    await db.query(
      `update alumnos set fallos = fallos + 1,
         bloqueado_hasta = case when fallos + 1 >= $2 then now() + make_interval(mins => $3) end
       where id = $1`,
      [alumno.id, MAX_FALLOS, MINUTOS_BLOQUEO],
    );
    return incorrecto;
  }
  await db.query(`update alumnos set fallos = 0, bloqueado_hasta = null where id = $1`, [alumno.id]);
  return { ok: true, id: alumno.id, apodo: alumno.apodo };
}

/** Borra el perfil y todo su progreso. */
export async function borrarAlumno(id: string): Promise<void> {
  await preparar();
  await (await bd()).query(`delete from alumnos where id = $1`, [id]);
}

// ---------- Intentos y resumen ----------

export async function registrarIntento(id: string, slug: string, aciertos: number, total: number) {
  await preparar();
  const db = await bd();
  const [tema] = await db.query(`select 1 from temas where slug = $1`, [slug]);
  if (!tema) return false;
  await db.query(
    `insert into intentos (alumno_id, slug, aciertos, total) values ($1, $2, $3, $4)`,
    [id, slug, aciertos, total],
  );
  return true;
}

const dia = (fecha: Date) => fecha.toISOString().slice(0, 10);

function restarDias(fechaIso: string, dias: number): string {
  const f = new Date(`${fechaIso}T12:00:00Z`);
  f.setUTCDate(f.getUTCDate() - dias);
  return dia(f);
}

/** Días seguidos con práctica, contando hasta hoy o hasta ayer (el día de hoy aún no termina). */
export function calcularRacha(dias: Set<string>, hoy: string): number {
  let inicio = dias.has(hoy) ? hoy : restarDias(hoy, 1);
  let racha = 0;
  while (dias.has(inicio)) {
    racha++;
    inicio = restarDias(inicio, 1);
  }
  return racha;
}

/** Los últimos 14 días, del más viejo a hoy, con cuántos retos hizo cada día. */
export function calendario(porDia: Map<string, number>, hoy: string, largo = 14) {
  return Array.from({ length: largo }, (_, i) => {
    const fecha = restarDias(hoy, largo - 1 - i);
    return { fecha, retos: porDia.get(fecha) ?? 0 };
  });
}

export function hoyEnMexico(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(ahora);
}

export type Resumen = {
  apodo: string;
  racha: number;
  calendario: { fecha: string; retos: number }[];
  temas: number;
  promedio: number | null;
  materias: { materia: string; temas: number; promedio: number }[];
  recientes: { slug: string; titulo: string; aciertos: number; total: number; fecha: string }[];
};

export async function resumenAlumno(id: string): Promise<Resumen | null> {
  await preparar();
  const db = await bd();
  const [alumno] = await db.query<{ apodo: string }>(`select apodo from alumnos where id = $1`, [id]);
  if (!alumno) return null;
  const local = `to_char((i.creado at time zone '${ZONA}')::date, 'YYYY-MM-DD')`;
  const dias = await db.query<{ fecha: string; retos: number }>(
    `select ${local} as fecha, count(*)::int as retos from intentos i
     where i.alumno_id = $1 and i.creado > now() - interval '400 days'
     group by 1`,
    [id],
  );
  const materias = await db.query<{ materia: string; temas: number; promedio: number }>(
    `select n.materia, count(distinct i.slug)::int as temas,
            round(avg(100.0 * i.aciertos / i.total))::int as promedio
     from intentos i join temas t on t.slug = i.slug join nodos n on n.id = t.nodo_id
     where i.alumno_id = $1 group by n.materia order by temas desc, n.materia`,
    [id],
  );
  const recientes = await db.query<Resumen["recientes"][number]>(
    `select i.slug, t.titulo, i.aciertos, i.total, ${local} as fecha
     from intentos i join temas t on t.slug = i.slug
     where i.alumno_id = $1 order by i.creado desc limit 10`,
    [id],
  );
  const [global] = await db.query<{ temas: number; promedio: number | null }>(
    `select count(distinct slug)::int as temas,
            round(avg(100.0 * aciertos / total))::int as promedio
     from intentos where alumno_id = $1`,
    [id],
  );
  const hoy = hoyEnMexico();
  const porDia = new Map(dias.map((d) => [d.fecha, d.retos]));
  return {
    apodo: alumno.apodo,
    racha: calcularRacha(new Set(porDia.keys()), hoy),
    calendario: calendario(porDia, hoy),
    temas: global?.temas ?? 0,
    promedio: global?.promedio ?? null,
    materias,
    recientes,
  };
}
