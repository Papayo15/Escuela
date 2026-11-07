"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { reducirFoto } from "@/lib/foto";
import { ASISTENTE } from "@/lib/marca";
import { plantillasDe, usaReacciones } from "@/lib/plantillas";
import type { Seccion } from "@/lib/secciones";
import { EditorFormula } from "./EditorFormula";
import { EditorReaccion } from "./EditorReaccion";
import { Mensaje } from "./Mensaje";

type Turno = { role: "user" | "assistant"; content: string; foto?: string };
type Props = {
  modoInicial: "tema-nuevo" | "seguimiento";
  slug?: string;
  nivel?: string;
  materia?: string;
  seccion?: Seccion;
  preguntaInicial?: string;
  pedido?: { id: number; texto: string };
  sugerencias?: string[];
};

export function ChatEnVivo({
  modoInicial,
  slug,
  nivel,
  materia,
  seccion,
  preguntaInicial,
  pedido,
  sugerencias = [],
}: Props) {
  const router = useRouter();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [borrador, setBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; reintentar: boolean } | null>(null);
  const [cortado, setCortado] = useState(false);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const inicio = useRef(false);
  const final = useRef<HTMLDivElement>(null);
  const cuadro = useRef<HTMLTextAreaElement>(null);
  const seccionActual = useRef(seccion);
  const ultimoPedido = useRef(0);

  useEffect(() => {
    seccionActual.current = seccion;
  }, [seccion]);

  const enviar = useCallback(
    async (historial: Turno[], modo: "tema-nuevo" | "seguimiento") => {
      setEnviando(true);
      setAviso(null);
      setCortado(false);
      setTurnos(historial);
      let acumulado = "";
      try {
        const primero = historial[0];
        const conFoto = historial.length === 1 && primero.foto;
        const r = await fetch(conFoto ? "/api/vision" : "/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            conFoto
              ? {
                  slug,
                  seccion: seccionActual.current,
                  nivel: nivel || undefined,
                  pregunta: primero.content,
                  imagen: primero.foto,
                }
              : {
                  modo,
                  slug,
                  seccion: seccionActual.current,
                  nivel: nivel || undefined,
                  messages: historial.map(({ role, content }) => ({ role, content })),
                },
          ),
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

  useEffect(() => {
    if (!pedido || enviando || pedido.id === ultimoPedido.current) return;
    ultimoPedido.current = pedido.id;
    void enviar([...turnos, { role: "user", content: pedido.texto }], "seguimiento");
  }, [enviando, enviar, pedido, turnos]);

  const mandar = (texto: string) => {
    const limpio = texto.trim();
    if ((!limpio && !foto) || enviando) return;
    setBorrador("");
    const turno: Turno = { role: "user", content: limpio || "Ayúdame con esta tarea." };
    if (foto) turno.foto = foto;
    setFoto(null);
    void enviar([...turnos, turno], "seguimiento");
  };

  const insertar = (texto: string) => {
    const campo = cuadro.current;
    const inicioSel = campo?.selectionStart ?? borrador.length;
    const finSel = campo?.selectionEnd ?? borrador.length;
    setBorrador(`${borrador.slice(0, inicioSel)}${texto}${borrador.slice(finSel)}`);
    campo?.focus();
  };

  const ponerFormula = (latex: string) =>
    setBorrador((b) => `${b}${b && !b.endsWith(" ") ? " " : ""}$${latex}$ `);

  const elegirFoto = async (archivo: File | undefined) => {
    if (!archivo) return;
    setAviso(null);
    try {
      setFoto(await reducirFoto(archivo));
    } catch {
      setAviso({ texto: "No pudimos abrir esa foto. Prueba con otra.", reintentar: false });
    }
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
    <section className="chat" aria-label={ASISTENTE}>
      <div aria-live="polite">
        {turnos.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="burbuja-alumno">
              {/* eslint-disable-next-line @next/next/no-img-element -- la foto solo existe en el navegador */}
              {t.foto && <img className="foto-tarea" src={t.foto} alt="Foto de la tarea" />}
              <Mensaje texto={t.content} />
            </div>
          ) : (
            <Mensaje key={i} texto={t.content} escuchar={materia === "Inglés"} />
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
          {turnos.length === 0 && (
            <div className="subir-foto">
              {foto ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- la foto solo existe en el navegador */}
                  <img className="foto-tarea" src={foto} alt="Foto elegida" />
                  <button type="button" className="boton-secundario" onClick={() => setFoto(null)}>Quitar foto</button>
                </>
              ) : (
                <label className="boton-secundario">
                  Subir foto de tarea
                  <input
                    className="oculto"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      void elegirFoto(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
              <p className="nota">Fotografía solo el ejercicio, sin rostros ni nombres completos. La foto no se guarda.</p>
            </div>
          )}
          <div className="plantillas" aria-label="Plantillas para escribir tu duda">
            {plantillasDe(materia).map((p) => (
              <button key={p.etiqueta} type="button" className="plantilla" onClick={() => insertar(p.texto)}>
                {p.etiqueta}
              </button>
            ))}
            <EditorFormula alInsertar={ponerFormula} />
            {usaReacciones(materia) && <EditorReaccion alInsertar={ponerFormula} />}
          </div>
          {borrador.includes("$") && (
            <div className="vista-previa"><Mensaje texto={borrador} /></div>
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
              ref={cuadro}
              rows={2}
              maxLength={2000}
              value={borrador}
              placeholder={foto ? "Escribe qué no entiendes (opcional)" : "Escribe tu duda aquí"}
              onChange={(e) => setBorrador(e.target.value)}
            />
            <button className="boton" disabled={enviando || (!borrador.trim() && !foto)}>Enviar</button>
          </form>
        </>
      )}
      <div ref={final} />
    </section>
  );
}
