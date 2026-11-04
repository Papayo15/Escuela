"use client";

export function Imprimir() {
  return (
    <button className="boton-secundario" onClick={() => window.print()}>
      Imprimir
    </button>
  );
}
