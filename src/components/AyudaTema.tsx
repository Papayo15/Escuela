"use client";

import Link from "next/link";
import { useState } from "react";
import { ASISTENTE } from "@/lib/marca";
import { sugerenciasDe } from "@/lib/plantillas";
import { ChatEnVivo } from "./ChatEnVivo";
import { usePlan, type EstadoAsistente } from "./use-plan";

export function AyudaTema({ nivel, estado }: { nivel?: string; estado?: EstadoAsistente }) {
  const plan = usePlan(estado);
  const [abierto, setAbierto] = useState(false);

  if (plan === "oculto") return null;
  if (plan === "mejorar") {
    return (
      <p className="nota">
        {ASISTENTE} es parte del plan completo.{" "}
        <Link className="enlace-fuerte" href="/acceso">Tengo ese código</Link>
      </p>
    );
  }
  if (!abierto) {
    return (
      <button className="boton" onClick={() => setAbierto(true)}>Preguntarle a {ASISTENTE}</button>
    );
  }
  return <ChatEnVivo modoInicial="seguimiento" nivel={nivel} sugerencias={sugerenciasDe("idea")} />;
}
