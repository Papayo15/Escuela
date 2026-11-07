/** "Secundaria" y "1.º y 2.º de primaria" ya dicen el nivel: no se repite. */
export function etiquetaGrado(nivel: string, etapa: string): string {
  return etapa.toLowerCase().includes(nivel.toLowerCase()) ? etapa : `${nivel}, ${etapa}`;
}
