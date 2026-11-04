"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mensaje } from "./Mensaje";

type Turno = { role: "user" | "assistant"; content: string };
type Props = {
  modoInicial: "tema-nuevo" | "seguimiento";
  slug?: string;
  nivel?: string;
  preguntaInicial?: string;
  sugerencias?: string[];
};

export function ChatEnVivo({ modoInicial, slug, nivel, preguntaInicial, sugerencias = [] }: Props) {
  const router = useRouter();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [borrador, setBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; reintentar: boolean } | null>(null);
  const [cortado, setCortado] = useState(false);
  const [guardado, setGuardado] = useState<string | null>(null);
  const inicio = useRef(false);
  const final = useRef<HTMLDivElement>(null);

  const enviar = useCallback(
    async (historial: Turno[], modo: "tema-nuevo" | "seguimiento") => {
      setEnviando(true);
      setAviso(null);
      setCortado(false);
      setTurnos(historial);
      let acumulado = "";
      try {
        const r = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modo, slug, nivel: nivel || undefined, messages: historial }),
        });
        if ((r.headers.get("content-type") ?? "").includes("application/json")) {
          const datos = (await r.json()) as { existente?: string; error?: string };
          if (datos.existente) {
            router.replace(`/tema/${datos.existente}`);
            return;
          }
          setAviso({ texto: datos.error ?? "No pudimos responder.", reintentar: false });
          return;
        }
        if (!r.body) throw new Error("Sin respuesta");
        const lector = r.body.pipeThrough(new TextDecoderStream()).getReader();
        let resto = "";
        for (;;) {
          const { value, done } = await lector.read();
          if (done) break;
          resto += value;
          const lineas = resto.split("\n");
          resto = lineas.pop() ?? "";
          for (const linea of lineas) {
            if (!linea) continue;
            const e = JSON.parse(linea);
            if (e.tipo === "delta") {
              acumulado += e.texto;
              setTurnos([...historial, { role: "assistant", content: acumulado }]);
            } else if (e.tipo === "rechazo") {
              setTurnos(historial);
              setAviso({
                texto: "No pude responder eso. Prueba a escribir tu duda de otra forma.",
                reintentar: false,
              });
            } else if (e.tipo === "error") {
              setTurnos(historial);
              setAviso({ texto: e.mensaje, reintentar: e.reintentar });
            } else if (e.tipo === "fin") {
              setCortado(e.cortado);
              setEnviando(false);
            } else if (e.tipo === "guardado") {
              setGuardado(e.slug);
            }
          }
        }
      } catch {
        setTurnos(historial);
        setAviso({ texto: "Se perdió la conexión. Intenta de nuevo.", reintentar: true });
      } finally {
        setEnviando(false);
      }
    },
    [nivel, router, slug],
  );

  useEffect(() => {
    if (preguntaInicial && !inicio.current) {
      inicio.current = true;
      void enviar([{ role: "user", content: preguntaInicial }], modoInicial);
    }
  }, [enviar, modoInicial, preguntaInicial]);

  useEffect(() => {
    final.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turnos, enviando]);

  const mandar = (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setBorrador("");
    void enviar([...turnos, { role: "user", content: limpio }], "seguimiento");
  };

  const reintentar = () => {
    const ultimo = turnos.at(-1);
    if (ultimo?.role === "user") {
      void enviar(turnos, turnos.length === 1 ? modoInicial : "seguimiento");
    }
  };

  const hayRespuesta = turnos.some((t) => t.role === "assistant");
  const pendiente = enviando && turnos.at(-1)?.role === "user";

  return (
    <section className="chat" aria-label="Chat con Claude">
      <div aria-live="polite">
        {turnos.map((t, i) =>
          t.role === "user" ? (
            <p key={i} className="burbuja-alumno">{t.content}</p>
          ) : (
            <Mensaje key={i} texto={t.content} />
          ),
        )}
        {pendiente && <p className="pensando">Pensando…</p>}
      </div>

      {cortado && (
        <button className="boton-secundario" onClick={() => mandar("Continúa donde te quedaste.")}>
          La respuesta se cortó: continuar
        </button>
      )}
      {aviso && (
        <div className="aviso" role="alert">
          <p>{aviso.texto}</p>
          {aviso.reintentar && (
            <button className="boton-secundario" onClick={reintentar}>Reintentar</button>
          )}
        </div>
      )}
      {guardado && (
        <p className="nota">
          Este tema ya quedó en la biblioteca: <Link href={`/tema/${guardado}`}>abrir tema</Link>
        </p>
      )}

      {(modoInicial === "seguimiento" || hayRespuesta) && (
        <>
          {!enviando && sugerencias.length > 0 && (
            <div className="sugerencias">
              {sugerencias.map((s) => (
                <button key={s} className="boton-secundario" onClick={() => mandar(s)}>{s}</button>
              ))}
            </div>
          )}
          <form
            className="campo-chat"
            onSubmit={(e) => {
              e.preventDefault();
              mandar(borrador);
            }}
          >
            <label className="oculto" htmlFor="duda">Escribe tu duda</label>
            <textarea
              id="duda"
              rows={2}
              maxLength={2000}
              value={borrador}
              placeholder="Escribe tu duda aquí"
              onChange={(e) => setBorrador(e.target.value)}
            />
            <button className="boton" disabled={enviando || !borrador.trim()}>Enviar</button>
          </form>
        </>
      )}
      <div ref={final} />
    </section>
  );
}
