"use client";

import Link from "next/link";
import { useState } from "react";
import type { Repaso } from "@/lib/progreso";
import { Mensaje } from "./Mensaje";

/** Las preguntas que el alumno falló antes, para que no se le olviden. */
export function RepasoHoy({ repasos }: { repasos: Repaso[] }) {
  const [elegidas, setElegidas] = useState<Record<number, number>>({});

  if (repasos.length === 0) {
    return <p className="nota">Hoy no tienes nada pendiente. Cuando falles una pregunta del Reto rápido, aquí volverá para que la repases.</p>;
  }

  const elegir = (i: number, j: number) => {
    const r = repasos[i];
    setElegidas((e) => ({ ...e, [i]: j }));
    void fetch("/api/progreso/repaso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: r.slug, pregunta: r.pregunta, acierto: j === r.datos.correcta }),
    }).catch(() => undefined);
  };

  return (
    <div>
      {repasos.map((r, i) => {
        const elegida = elegidas[i];
        const lista = elegida !== undefined;
        const ingles = r.materia === "Inglés";
        return (
          <fieldset key={`${r.slug}-${r.pregunta}`} className="reto-pregunta">
            <legend className="nota">
              <Link href={`/tema/${r.slug}`}>{r.titulo}</Link> · {r.materia}
            </legend>
            <Mensaje texto={r.datos.pregunta} escuchar={ingles} />
            {r.datos.opciones.map((o, j) => {
              const clase = !lista ? "" : j === r.datos.correcta ? " bien" : j === elegida ? " mal" : "";
              return (
                <button
                  key={o}
                  type="button"
                  className={`reto-opcion${clase}`}
                  disabled={lista}
                  onClick={() => elegir(i, j)}
                >
                  <Mensaje texto={o} />
                </button>
              );
            })}
            {lista && (
              <div role="status" className="reto-porque">
                <strong>
                  {elegida === r.datos.correcta ? "¡Bien! Volverá más adelante para que no se te olvide." : "Casi. Mañana la vuelves a ver."}
                </strong>
                <Mensaje texto={r.datos.porque} escuchar={ingles} />
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
