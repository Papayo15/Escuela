import type { Nivel } from "./pedagogical-prompt";

/** Siempre en este orden: primaria, secundaria y preparatoria. */
export const NIVELES_INFO: { nivel: Nivel; ruta: string; emoji: string; grados: string }[] = [
  { nivel: "Primaria", ruta: "primaria", emoji: "🎒", grados: "1.º a 6.º grado" },
  { nivel: "Secundaria", ruta: "secundaria", emoji: "📘", grados: "1.º a 3.º grado" },
  { nivel: "Preparatoria", ruta: "preparatoria", emoji: "🎓", grados: "1.º a 6.º semestre" },
];

export const nivelDeRuta = (ruta: string) => NIVELES_INFO.find((n) => n.ruta === ruta);
export const rutaDeNivel = (nivel: string) => NIVELES_INFO.find((n) => n.nivel === nivel)?.ruta;
export const ordenNivel = (nivel: string) => NIVELES_INFO.findIndex((n) => n.nivel === nivel);

const ORDEN_ETAPAS = [
  "1.º y 2.º de primaria",
  "3.º y 4.º de primaria",
  "5.º y 6.º de primaria",
  "Secundaria",
  "Primer semestre",
  "Segundo semestre",
  "Tercer semestre",
  "Cuarto semestre",
  "Quinto semestre",
  "Sexto semestre",
];

/** Grados en orden escolar, no por abecedario ("Cuarto" no va antes que "Primer"). */
export function ordenEtapa(etapa: string): number {
  const i = ORDEN_ETAPAS.indexOf(etapa);
  return i === -1 ? ORDEN_ETAPAS.length : i;
}
