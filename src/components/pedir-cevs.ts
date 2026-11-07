import type { Seccion } from "@/lib/secciones";

export type PedidoCevs = { texto: string; seccion?: Seccion };

const EVENTO = "pedir-cevs";

/** Abre el panel de CEVS y le manda un mensaje desde cualquier parte de la página. */
export function pedirCevs(pedido: PedidoCevs) {
  window.dispatchEvent(new CustomEvent<PedidoCevs>(EVENTO, { detail: pedido }));
}

export function alPedirCevs(fn: (pedido: PedidoCevs) => void): () => void {
  const oyente = (e: Event) => fn((e as CustomEvent<PedidoCevs>).detail);
  window.addEventListener(EVENTO, oyente);
  return () => window.removeEventListener(EVENTO, oyente);
}
