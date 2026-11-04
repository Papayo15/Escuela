/**
 * Revisa cada mes los portales oficiales y compara sus PDF con data/fuentes/manifest.json.
 * Solo reporta: nunca modifica la biblioteca. `--actualizar` reescribe el manifiesto.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const RUTA = "data/fuentes/manifest.json";
const PORTALES = [
  "https://educacionbasica.sep.gob.mx/programas-de-estudio-para-la-educacion-preescolar-primaria-y-secundaria-programas-sinteticos-de-las-fases-2-a-6/",
  "https://educacionbasica.sep.gob.mx/plan-y-programas-de-estudio-2022-para-la-educacion-preescolar-primaria-y-secundaria/",
  "https://educacionmediasuperior.sep.gob.mx/modeloeducativo2025.html",
];

type Manifiesto = { portales: Record<string, string[]>; documentos: Record<string, string> };
const UA = { "User-Agent": "EscuelaRegularizacion-vigilancia/1.0" };

const sha = (d: ArrayBuffer | string) =>
  createHash("sha256").update(typeof d === "string" ? d : new Uint8Array(d)).digest("hex");

async function enlacesPdf(portal: string): Promise<string[]> {
  const html = await (await fetch(portal, { headers: UA })).text();
  const enlaces = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"']+\.pdf)["']/gi)) {
    enlaces.add(encodeURI(decodeURI(new URL(m[1], portal).href)));
  }
  return [...enlaces].sort();
}

const previo: Manifiesto = existsSync(RUTA)
  ? JSON.parse(readFileSync(RUTA, "utf8"))
  : { portales: {}, documentos: {} };
const actual: Manifiesto = { portales: {}, documentos: {} };
const cambios: string[] = [];
const fallos: string[] = [];

for (const portal of PORTALES) {
  try {
    actual.portales[portal] = await enlacesPdf(portal);
  } catch (e) {
    actual.portales[portal] = previo.portales[portal] ?? [];
    fallos.push(`No se pudo leer ${portal}: ${(e as Error).message}`);
  }
}

for (const url of new Set(Object.values(actual.portales).flat())) {
  try {
    const r = await fetch(url, { headers: UA });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    actual.documentos[url] = sha(await r.arrayBuffer());
    const antes = previo.documentos[url];
    if (!antes) cambios.push(`NUEVO: ${url}`);
    else if (antes !== actual.documentos[url]) cambios.push(`MODIFICADO: ${url}`);
  } catch (e) {
    actual.documentos[url] = previo.documentos[url] ?? "";
    fallos.push(`No se pudo descargar ${url}: ${(e as Error).message}`);
  }
}
for (const url of Object.keys(previo.documentos)) {
  if (!(url in actual.documentos)) cambios.push(`YA NO APARECE: ${url}`);
}

const informe = [
  cambios.length ? `Cambios en documentos oficiales (${cambios.length}):` : "Sin cambios en los documentos oficiales.",
  ...cambios,
  ...(fallos.length ? ["", "Avisos:", ...fallos] : []),
].join("\n");
console.log(informe);
writeFileSync("informe-fuentes.txt", informe);
if (process.argv.includes("--actualizar")) {
  writeFileSync(RUTA, `${JSON.stringify(actual, null, 2)}\n`);
}
process.exit(cambios.length ? 2 : 0);
