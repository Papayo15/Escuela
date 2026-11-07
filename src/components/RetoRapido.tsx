"use client";

import { useState } from "react";
import type { PreguntaReto } from "@/lib/schema-tema";
import { Mensaje } from "./Mensaje";

/** Se califica en el navegador: no gasta IA y funciona en los dos planes. */
type Props = { preguntas: PreguntaReto[]; slug: string; guardar: boolean };

export function RetoRapido({ preguntas, slug, guardar }: Props) {
  const [elegidas, setElegidas] = useState<Record<number, number>>({});
  const contestadas = Object.keys(elegidas).length;
  const aciertos = preguntas.filter((p, i) => elegidas[i] === p.correcta).length;

  const elegir = (i: number, j: number) => {
    const nuevas = { ...elegidas, [i]: j };
    setElegidas(nuevas);
    // Con el progreso encendido, al terminar se guarda el resultado (si el alumno entró a su perfil).
    if (guardar && Object.keys(nuevas).length === preguntas.length) {
      const total = preguntas.filter((p, k) => nuevas[k] === p.correcta).length;
      void fetch("/api/progreso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, aciertos: total, total: preguntas.length }),
      }).catch(() => undefined);
    }
  };

  return (
    <div>
      {preguntas.map((p, i) => {
        const elegida = elegidas[i];
        const lista = elegida !== undefined;
        return (
          <fieldset key={p.pregunta} className="reto-pregunta">
            <legend className="oculto">Pregunta {i + 1}</legend>
            <Mensaje texto={`${i + 1}. ${p.pregunta}`} />
            {p.opciones.map((o, j) => {
              const clase = !lista ? "" : j === p.correcta ? " bien" : j === elegida ? " mal" : "";
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
                <strong>{elegida === p.correcta ? "¡Bien!" : "Casi."}</strong>
                <Mensaje texto={p.porque} />
              </div>
            )}
          </fieldset>
        );
      })}
      {contestadas === preguntas.length && (
        <p className="reto-total" role="status">
          Sacaste {aciertos} de {preguntas.length}.{" "}
          <button type="button" className="boton-secundario" onClick={() => setElegidas({})}>
            Intentar otra vez
          </button>
        </p>
      )}
    </div>
  );
}
