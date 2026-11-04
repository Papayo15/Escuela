export const COOKIE_ACCESO = "acceso_escuela";

function bytesAHex(b: ArrayBuffer): string {
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function firmaAcceso(secreto: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode("acceso-v1"));
  return bytesAHex(firma);
}

/** El código solo se exige cuando el chat puede generar gasto. */
export function chatDisponible(): boolean {
  const { ANTHROPIC_API_KEY, ACCESS_CODE, COOKIE_SECRET } = process.env;
  return Boolean(ANTHROPIC_API_KEY && ACCESS_CODE && COOKIE_SECRET);
}

export function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function cookieValida(valor: string | undefined): Promise<boolean> {
  const secreto = process.env.COOKIE_SECRET;
  if (!secreto || !valor) return false;
  return igualesSeguro(valor, await firmaAcceso(secreto));
}
