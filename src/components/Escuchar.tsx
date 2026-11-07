"use client";

import { isValidElement, useSyncExternalStore, type ReactNode } from "react";
import { hablar, hayVoz, limpiarParaVoz, pareceIngles } from "@/lib/voz";

const sinCambios = () => () => undefined;

/** Saca el texto de lo que va en cursiva, aunque traiga negritas u otras marcas adentro. */
export function textoPlano(nodo: ReactNode): string {
  if (typeof nodo === "string" || typeof nodo === "number") return String(nodo);
  if (Array.isArray(nodo)) return nodo.map(textoPlano).join("");
  if (isValidElement<{ children?: ReactNode }>(nodo)) return textoPlano(nodo.props.children);
  return "";
}

const useHayVoz = () => useSyncExternalStore(sinCambios, hayVoz, () => false);

/** Cursiva con un botón 🔊 si es inglés y el aparato tiene voz. No gasta IA: usa la voz del sistema. */
export function EnIngles({ children }: { children?: ReactNode }) {
  const puede = useHayVoz();
  const texto = textoPlano(children).trim();
  return (
    <em>
      {children}
      {puede && pareceIngles(texto) && (
        <button
          type="button"
          className="escuchar sin-imprimir"
          aria-label={`Escuchar: ${texto}`}
          title="Escuchar"
          onClick={() => hablar(texto, "en-US")}
        >
          🔊
        </button>
      )}
    </em>
  );
}

/** Lee en español una sección completa, para niños que aún leen despacio. */
export function LeerSeccion({ texto }: { texto: string }) {
  const puede = useHayVoz();
  if (!puede) return null;
  return (
    <button
      type="button"
      className="escuchar-seccion sin-imprimir"
      onClick={() => hablar(limpiarParaVoz(texto), "es-MX")}
    >
      🔊 Escuchar
    </button>
  );
}
