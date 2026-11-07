import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { leerBiblioteca, sembrar } from "./biblioteca";
import { bd } from "./db";
import { respaldarVivos } from "./respaldo";
import { archivoTema } from "./schema-tema";
import { guardarTema, obtenerTema } from "./temas";

vi.stubEnv("DATABASE_URL", "");

describe("respaldo de temas de CEVS", () => {
  it("respalda un tema nuevo completo y lo restaura con el mismo contenido", async () => {
    const db = await bd();
    const { temas } = await leerBiblioteca();
    const base = temas.find((t) => t.contenido.reto)!;
    const nuevo = { ...base, slug: "tema-de-prueba-cevs", titulo: "Tema de prueba de CEVS", palabras: ["prueba", "cevs"] };
    await guardarTema({ ...nuevo, origen: "vivo" });

    const carpeta = mkdtempSync(path.join(tmpdir(), "vivos-"));
    const resultado = await respaldarVivos(db, carpeta);
    expect(resultado).toEqual({ respaldados: 1, descartados: [] });

    const respaldo = archivoTema.array().parse(JSON.parse(readFileSync(path.join(carpeta, "temas-cevs.json"), "utf8")));
    expect(respaldo[0].slug).toBe("tema-de-prueba-cevs");
    expect(respaldo[0].palabras).toEqual(["prueba", "cevs"]);
    expect(respaldo[0].contenido.reto).toHaveLength(5);
    const hoja = readFileSync(path.join(carpeta, "REVISION.md"), "utf8");
    expect(hoja).toContain("## Tema de prueba de CEVS");
    expect(hoja).toContain("🎯 Reto rápido");

    // Si la base se perdiera, cargar el respaldo lo devuelve como tema de CEVS.
    await db.query(`delete from temas where slug = $1`, ["tema-de-prueba-cevs"]);
    expect(await obtenerTema("tema-de-prueba-cevs")).toBeNull();
    await sembrar(db, { nodos: [], temas: [], vivos: respaldo });
    const restaurado = await obtenerTema("tema-de-prueba-cevs");
    expect(restaurado?.origen).toBe("vivo");
    expect(restaurado?.contenido).toEqual(respaldo[0].contenido);
  }, 60_000);
});
