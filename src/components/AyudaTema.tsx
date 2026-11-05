"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChatEnVivo } from "./ChatEnVivo";

type Estado = "activo" | "mejorar" | "oculto";

/** Las páginas de tema se guardan en caché: el plan del alumno se consulta en el navegador. */
export function AyudaTema({ slug, nivel, estado }: { slug?: string; nivel?: string; estado?: Estado }) {
  const [plan, setPlan] = useState<Estado>(estado ?? "oculto");
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (estado) return;
    fetch("/api/plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { maestro?: Estado } | null) => {
        if (d?.maestro) setPlan(d.maestro);
      })
      .catch(() => undefined);
  }, [estado]);

  if (plan === "oculto") return null;
  if (plan === "mejorar") {
    return (
      <p className="nota">
        El Maestro en vivo es parte del plan completo.{" "}
        <Link className="enlace-fuerte" href="/acceso">Tengo ese código</Link>
      </p>
    );
  }
  if (!abierto) {
    return (
      <button className="boton" onClick={() => setAbierto(true)}>Preguntarle al maestro</button>
    );
  }
  return (
    <ChatEnVivo
      modoInicial="seguimiento"
      slug={slug}
      nivel={nivel}
      sugerencias={["No entendí, explícamelo de otra forma", "Ya entendí, ponme un reto"]}
    />
  );
}
