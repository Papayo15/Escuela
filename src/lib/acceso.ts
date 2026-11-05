export const COOKIE_ACCESO = "acceso_escuela";
export const DURACION_ACCESO = 60 * 60 * 24 * 35;

export type Plan = "biblioteca" | "premium";

function bytesAHex(b: ArrayBuffer): string {
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function firmar(secreto: string, plan: Plan, codigo: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign(
    "HMAC",
    clave,
    new TextEncoder().encode(`acceso-v2:${plan}:${codigo}`),
  );
  return `${plan}.${bytesAHex(firma)}`;
}

function codigoDe(plan: Plan): string | undefined {
  return plan === "premium" ? process.env.PREMIUM_CODE : process.env.ACCESS_CODE;
}

/** La biblioteca exige código en cuanto la escuela define el suyo. */
export function accesoActivo(): boolean {
  return Boolean(process.env.ACCESS_CODE && process.env.COOKIE_SECRET);
}

export function chatDisponible(): boolean {
  return Boolean(accesoActivo() && process.env.PREMIUM_CODE && process.env.OPENROUTER_API_KEY);
}

export function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export function planDeCodigo(codigo: string): Plan | null {
  const { PREMIUM_CODE, ACCESS_CODE } = process.env;
  if (PREMIUM_CODE && igualesSeguro(codigo, PREMIUM_CODE)) return "premium";
  if (ACCESS_CODE && igualesSeguro(codigo, ACCESS_CODE)) return "biblioteca";
  return null;
}

export async function cookieDePlan(plan: Plan): Promise<string | null> {
  const secreto = process.env.COOKIE_SECRET;
  const codigo = codigoDe(plan);
  return secreto && codigo ? firmar(secreto, plan, codigo) : null;
}

/** Incluir el código en la firma hace que cambiarlo cada mes expire los accesos anteriores. */
export async function planDeCookie(valor: string | undefined): Promise<Plan | null> {
  if (!valor) return null;
  const plan = valor.split(".")[0];
  if (plan !== "biblioteca" && plan !== "premium") return null;
  const esperada = await cookieDePlan(plan);
  return esperada && igualesSeguro(valor, esperada) ? plan : null;
}
