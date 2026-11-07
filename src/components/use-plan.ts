"use client";

import { useEffect, useState } from "react";

export type EstadoAsistente = "activo" | "mejorar" | "oculto";

let consulta: Promise<EstadoAsistente> | null = null;

function consultarPlan(): Promise<EstadoAsistente> {
  consulta ??= fetch("/api/plan")
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { maestro?: EstadoAsistente } | null) => d?.maestro ?? "oculto")
    .catch(() => "oculto" as const);
  return consulta;
}

/** Las páginas de tema se guardan en caché: el plan se consulta una sola vez en el navegador. */
export function usePlan(inicial?: EstadoAsistente): EstadoAsistente {
  const [plan, setPlan] = useState<EstadoAsistente>(inicial ?? "oculto");
  useEffect(() => {
    if (!inicial) void consultarPlan().then(setPlan);
  }, [inicial]);
  return plan;
}
