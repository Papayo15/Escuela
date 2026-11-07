"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ASISTENTE } from "@/lib/marca";
import { sugerenciasDe } from "@/lib/plantillas";
import { SECCIONES, type Seccion } from "@/lib/secciones";
import { ChatEnVivo } from "./ChatEnVivo";
import { alPedirCevs, pedirCevs, type PedidoCevs } from "./pedir-cevs";
import { usePlan } from "./use-plan";

type Props = { slug: string; nivel: string; materia: string };

const LARGO_PALABRA = 40;

function palabraElegida(): string | null {
  const seleccion = window.getSelection();
  const texto = seleccion?.toString().trim() ?? "";
  if (!texto || texto.length > LARGO_PALABRA || texto.includes("\n")) return null;
  const nodo = seleccion?.anchorNode;
  const elemento = nodo instanceof Element ? nodo : nodo?.parentElement;
  return elemento?.closest("[data-seccion]") ? texto : null;
}

export function TutorFlotante({ slug, nivel, materia }: Props) {
  const plan = usePlan();
  const [abierto, setAbierto] = useState(false);
  const [usado, setUsado] = useState(false);
  const [seccion, setSeccion] = useState<Seccion>("idea");
  const [pedido, setPedido] = useState<{ id: number; texto: string }>();
  const [palabra, setPalabra] = useState<string | null>(null);

  const recibir = useCallback((p: PedidoCevs) => {
    if (p.seccion) setSeccion(p.seccion);
    setUsado(true);
    setAbierto(true);
    setPedido((anterior) => ({ id: (anterior?.id ?? 0) + 1, texto: p.texto }));
  }, []);

  useEffect(() => alPedirCevs(recibir), [recibir]);

  useEffect(() => {
    if (plan !== "activo") return;
    const revisar = () => setPalabra(palabraElegida());
    document.addEventListener("selectionchange", revisar);
    return () => document.removeEventListener("selectionchange", revisar);
  }, [plan]);

  useEffect(() => {
    // Una línea fija a 40 % de la pantalla: cuenta la sección que la está cruzando.
    const observador = new IntersectionObserver(
      (entradas) => {
        const actual = entradas.find((e) => e.isIntersecting);
        const clave = (actual?.target as HTMLElement | undefined)?.dataset.seccion;
        if (clave && clave in SECCIONES) setSeccion(clave as Seccion);
      },
      { rootMargin: "-40% 0px -60% 0px" },
    );
    document.querySelectorAll("[data-seccion]").forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, []);

  if (plan === "oculto") return null;
  if (plan === "mejorar") {
    return (
      <p className="nota sin-imprimir">
        {ASISTENTE} es parte del plan completo.{" "}
        <Link className="enlace-fuerte" href="/acceso">Tengo ese código</Link>
      </p>
    );
  }

  return (
    <>
      {palabra && (
        <button
          className="boton-secundario tutor-palabra sin-imprimir"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            pedirCevs({ texto: `¿Qué significa «${palabra}»? Explícamelo con un ejemplo de mi escuela.` });
            setPalabra(null);
          }}
        >
          ¿Qué significa «{palabra}»?
        </button>
      )}
      {!abierto && (
        <button
          className="boton tutor-boton sin-imprimir"
          onClick={() => {
            setAbierto(true);
            setUsado(true);
          }}
        >
          Preguntarle a {ASISTENTE}
        </button>
      )}
      {usado && (
        <aside className="tutor sin-imprimir" aria-label={ASISTENTE} hidden={!abierto}>
          <header className="tutor-cabeza">
            <div>
              <strong>{ASISTENTE}</strong>
              <p className="nota">Estás en: {SECCIONES[seccion]}</p>
            </div>
            <button className="boton-secundario" onClick={() => setAbierto(false)}>Cerrar</button>
          </header>
          <ChatEnVivo
            modoInicial="seguimiento"
            slug={slug}
            nivel={nivel}
            materia={materia}
            seccion={seccion}
            pedido={pedido}
            sugerencias={sugerenciasDe(seccion)}
          />
        </aside>
      )}
    </>
  );
}
