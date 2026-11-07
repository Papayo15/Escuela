"use client";

import { useState } from "react";
import { ASISTENTE } from "@/lib/marca";
import { usaReacciones } from "@/lib/plantillas";
import type { Seccion } from "@/lib/secciones";
import { EditorFormula } from "./EditorFormula";
import { EditorReaccion } from "./EditorReaccion";
import { Mensaje } from "./Mensaje";
import { pedirCevs } from "./pedir-cevs";
import { usePlan } from "./use-plan";

type Props = { ejercicio: string; seccion: Seccion; materia: string };

export function EjercicioAbierto({ ejercicio, seccion, materia }: Props) {
  const plan = usePlan();
  const [texto, setTexto] = useState("");
  const limpio = texto.trim();

  const poner = (latex: string) =>
    setTexto((t) => `${t}${t && !t.endsWith(" ") ? " " : ""}$${latex}$ `);

  const preguntar = () =>
    pedirCevs({
      seccion,
      texto: limpio
        ? `Ejercicio: ${ejercicio}\n\nMi respuesta: ${limpio}\n\n¿Voy bien?`
        : `Ejercicio: ${ejercicio}\n\nNo sé cómo empezar. Dame una pista.`,
    });

  return (
    <div className="respuesta-alumno sin-imprimir">
      <label>
        <span className="oculto">Tu respuesta</span>
        <textarea
          rows={2}
          maxLength={1000}
          value={texto}
          placeholder="Escribe aquí tu respuesta"
          onChange={(e) => setTexto(e.target.value)}
        />
      </label>
      {limpio.includes("$") && (
        <div className="vista-previa"><Mensaje texto={limpio} /></div>
      )}
      <div className="plantillas">
        <EditorFormula alInsertar={poner} />
        {usaReacciones(materia) && <EditorReaccion alInsertar={poner} />}
        {plan === "activo" && (
          <button type="button" className="plantilla" onClick={preguntar}>
            {limpio ? `¿Voy bien? Pregúntale a ${ASISTENTE}` : `Pedirle una pista a ${ASISTENTE}`}
          </button>
        )}
      </div>
    </div>
  );
}
