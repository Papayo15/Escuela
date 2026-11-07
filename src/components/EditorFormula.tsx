"use client";

import { useEffect, useRef, useState } from "react";
import type { MathfieldElement } from "mathlive";

const BOTONES = [
  { etiqueta: "Fracción", latex: "\\frac{#@}{#?}" },
  { etiqueta: "Raíz", latex: "\\sqrt{#@}" },
  { etiqueta: "Potencia", latex: "#@^{#?}" },
  { etiqueta: "Subíndice", latex: "#@_{#?}" },
  { etiqueta: "×", latex: "\\times" },
  { etiqueta: "÷", latex: "\\div" },
  { etiqueta: "Flecha", latex: "\\rightarrow" },
];

/** Editor visual: el alumno ve la fórmula como en su cuaderno y nunca escribe código. */
export function EditorFormula({ alInsertar }: { alInsertar: (latex: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const campo = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    import("mathlive")
      .then(({ MathfieldElement }) => {
        if (!vivo || !contenedor.current) return;
        MathfieldElement.fontsDirectory = "/mathlive/fonts";
        MathfieldElement.soundsDirectory = null;
        const mf = new MathfieldElement();
        mf.setAttribute("aria-label", "Escribe tu fórmula");
        mf.className = "campo-formula";
        contenedor.current.replaceChildren(mf);
        campo.current = mf;
        mf.focus();
      })
      .catch(() => setError(true));
    return () => {
      vivo = false;
      campo.current = null;
      window.mathVirtualKeyboard?.hide();
    };
  }, [abierto]);

  if (!abierto) {
    return (
      <button type="button" className="plantilla" onClick={() => setAbierto(true)}>
        ➕ Escribir fórmula
      </button>
    );
  }

  const insertar = () => {
    const latex = campo.current?.value.trim();
    if (latex) alInsertar(latex);
    setAbierto(false);
  };

  return (
    <div className="editor-formula">
      {error ? (
        <p className="nota">No se pudo abrir el editor. Prueba otra vez o manda una foto.</p>
      ) : (
        <>
          <div className="plantillas">
            {BOTONES.map((b) => (
              <button
                key={b.etiqueta}
                type="button"
                className="plantilla"
                onClick={() => {
                  campo.current?.insert(b.latex, { selectionMode: "placeholder" });
                  campo.current?.focus();
                }}
              >
                {b.etiqueta}
              </button>
            ))}
          </div>
          <div ref={contenedor} />
        </>
      )}
      <div className="plantillas">
        <button type="button" className="boton" onClick={insertar}>Poner fórmula</button>
        <button type="button" className="boton-secundario" onClick={() => setAbierto(false)}>Cancelar</button>
      </div>
    </div>
  );
}
