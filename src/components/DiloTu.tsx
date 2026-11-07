"use client";

import { useState, useSyncExternalStore } from "react";
import { escucharFrase, hablar, hayMicrofono, hayVoz, parecido, UMBRAL_BIEN, type Idioma } from "@/lib/voz";

const sinCambios = () => () => undefined;

type Estado = { escuchando?: boolean; oido?: string; bien?: boolean; error?: string };

const ERRORES: Record<string, string> = {
  "not-allowed": "Falta el permiso del micrófono. Pídele ayuda a un adulto para activarlo.",
  "no-speech": "No te escuché. Habla un poco más fuerte y cerca.",
  "audio-capture": "No encontramos un micrófono.",
};

/**
 * Inglés: repetir frases del tema. Español: leer en voz alta.
 * El navegador convierte la voz en texto; aquí solo comparamos palabras.
 */
export function DiloTu({ frases, idioma }: { frases: string[]; idioma: Idioma }) {
  const voz = useSyncExternalStore(sinCambios, hayVoz, () => false);
  const micro = useSyncExternalStore(sinCambios, hayMicrofono, () => false);
  const [estados, setEstados] = useState<Record<number, Estado>>({});
  const ingles = idioma === "en-US";

  const probar = async (i: number) => {
    setEstados((e) => ({ ...e, [i]: { escuchando: true } }));
    try {
      const oido = await escucharFrase(frases[i], idioma);
      setEstados((e) => ({ ...e, [i]: { oido, bien: parecido(frases[i], oido) >= UMBRAL_BIEN } }));
    } catch (error) {
      const clave = error instanceof Error ? error.message : "";
      setEstados((e) => ({ ...e, [i]: { error: ERRORES[clave] ?? "No se pudo escuchar. Intenta otra vez." } }));
    }
  };

  return (
    <div>
      <p className="nota">
        {ingles
          ? "Escucha la frase y después dila tú con el micrófono."
          : "Lee la frase en voz alta con el micrófono. Si quieres, primero escúchala."}
      </p>
      <ol className="dilo-tu">
        {frases.map((f, i) => {
          const e = estados[i] ?? {};
          return (
            <li key={f}>
              <span lang={ingles ? "en" : "es"}>{f}</span>
              <div className="plantillas">
                {voz && (
                  <button type="button" className="plantilla" onClick={() => hablar(f, idioma)}>
                    🔊 Escuchar
                  </button>
                )}
                {micro && (
                  <button type="button" className="plantilla" disabled={e.escuchando} onClick={() => probar(i)}>
                    {e.escuchando ? "Te escucho…" : ingles ? "🎤 Dilo tú" : "🎤 Leer"}
                  </button>
                )}
              </div>
              {e.oido !== undefined && (
                <p role="status" className={e.bien ? "dilo-bien" : "dilo-casi"}>
                  {e.bien ? "¡Muy bien! Se entendió." : "Casi. Intenta otra vez, despacio."}{" "}
                  {e.oido && <span className="nota">Escuché: “{e.oido}”</span>}
                </p>
              )}
              {e.error && <p role="status" className="dilo-casi">{e.error}</p>}
            </li>
          );
        })}
      </ol>
      {micro ? (
        <p className="nota">
          Al usar el micrófono, tu navegador envía tu voz a su servicio para convertirla en texto (por ejemplo, Google o Apple). La Escuelita no guarda tu voz.
        </p>
      ) : (
        <p className="nota">Para usar el micrófono, abre esta página en Chrome, Safari o Edge.</p>
      )}
    </div>
  );
}
