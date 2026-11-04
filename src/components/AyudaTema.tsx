"use client";

import { useState } from "react";
import { ChatEnVivo } from "./ChatEnVivo";

export function AyudaTema({ slug, nivel }: { slug: string; nivel: string }) {
  const [abierto, setAbierto] = useState(false);
  if (!abierto) {
    return (
      <button className="boton" onClick={() => setAbierto(true)}>Preguntarle a Claude</button>
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
