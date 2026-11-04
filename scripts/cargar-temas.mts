/** Carga el temario y los temas en Neon. Requiere DATABASE_URL. */
import { leerBiblioteca, sembrar } from "../src/lib/biblioteca";
import { bd, prepararEsquema } from "../src/lib/db";

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
await prepararEsquema();
const biblioteca = await leerBiblioteca();
await sembrar(await bd(), biblioteca);
console.log(`Cargados ${biblioteca.nodos.length} nodos y ${biblioteca.temas.length} temas.`);
