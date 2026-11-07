/**
 * Respalda los temas que creó CEVS en Neon (data/vivos) y prepara la hoja de revisión del maestro.
 * Requiere DATABASE_URL. No borra nada de Neon.
 */
import path from "node:path";
import { bd, prepararEsquema } from "../src/lib/db";
import { respaldarVivos } from "../src/lib/respaldo";

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
await prepararEsquema();
const { respaldados, descartados } = await respaldarVivos(await bd(), path.join(process.cwd(), "data/vivos"));
console.log(`Respaldados ${respaldados} temas de CEVS en data/vivos.`);
if (descartados.length) {
  console.log(`No se pudieron respaldar ${descartados.length} (formato incompleto): ${descartados.join(", ")}`);
}
