"use client";

import { useRef, useState } from "react";
import { Mensaje } from "./Mensaje";

const SIGNOS = [
  { etiqueta: "+", texto: " + " },
  { etiqueta: "→ Produce", texto: " -> " },
  { etiqueta: "⇌ Va y regresa", texto: " <=> " },
  { etiqueta: "↑ Gas", texto: " ^ " },
  { etiqueta: "↓ Sólido", texto: " v " },
];

/** El alumno teclea normal (CaCO3 -> CaO + CO2) y mhchem pone los subíndices solo. */
export function EditorReaccion({ alInsertar }: { alInsertar: (latex: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const limpio = texto.replace(/[\\${}]/g, "").trim();

  const poner = (signo: string) => {
    const nuevo = `${texto.trimEnd()}${signo}`;
    setTexto(nuevo);
    // El cursor vuelve al final para seguir escribiendo.
    requestAnimationFrame(() => {
      campo.current?.focus();
      campo.current?.setSelectionRange(nuevo.length, nuevo.length);
    });
  };

  if (!abierto) {
    return (
      <button type="button" className="plantilla" onClick={() => setAbierto(true)}>
        ⚗️ Escribir reacción
      </button>
    );
  }

  return (
    <div className="editor-formula">
      <label>
        <span className="oculto">Escribe tu reacción</span>
        <input
          ref={campo}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={texto}
          placeholder="Ejemplo: CaCO3 -> CaO + CO2"
          onChange={(e) => setTexto(e.target.value)}
        />
      </label>
      <div className="plantillas">
        {SIGNOS.map((s) => (
          <button
            key={s.etiqueta}
            type="button"
            className="plantilla"
            onClick={() => poner(s.texto)}
          >
            {s.etiqueta}
          </button>
        ))}
      </div>
      {limpio && (
        <div className="vista-previa"><Mensaje texto={`$\\ce{${limpio}}$`} /></div>
      )}
      <div className="plantillas">
        <button
          type="button"
          className="boton"
          disabled={!limpio}
          onClick={() => {
            alInsertar(`\\ce{${limpio}}`);
            setTexto("");
            setAbierto(false);
          }}
        >
          Poner reacción
        </button>
        <button type="button" className="boton-secundario" onClick={() => setAbierto(false)}>Cancelar</button>
      </div>
    </div>
  );
}
