import type { Metadata } from "next";
import Link from "next/link";
import { Buscador, ListaTemas } from "@/components/Biblioteca";
import { ChatEnVivo } from "@/components/ChatEnVivo";
import { ASISTENTE } from "@/lib/marca";
import { NIVELES_INFO } from "@/lib/niveles";
import { NIVELES, type Nivel } from "@/lib/pedagogical-prompt";
import { estadoMaestro } from "@/lib/plan";
import { buscarTemas } from "@/lib/temas";

export const metadata: Metadata = { title: "Buscar" };

type Props = { searchParams: Promise<{ q?: string; nivel?: string; nuevo?: string }> };

export default async function PaginaBuscar({ searchParams }: Props) {
  const parametros = await searchParams;
  const q = parametros.q?.trim().slice(0, 300) ?? "";
  const nivel = NIVELES.find((n) => n === parametros.nivel) as Nivel | undefined;
  const resultados = q ? await buscarTemas(q, nivel) : [];
  const maestro = await estadoMaestro();
  const hayChat = maestro === "activo";
  // Si el tema no está, CEVS lo explica y, si pasa la revisión, lo guarda para todos.
  const generar = Boolean(hayChat && q && parametros.nuevo === "1");
  const enlace = (extra: Record<string, string>) =>
    `/buscar?${new URLSearchParams({ q, ...(nivel ? { nivel } : {}), ...extra })}`;

  return (
    <main className="pagina">
      <nav><Link href="/">← Inicio</Link></nav>
      <h1>¿Qué quieres aprender?</h1>
      <Buscador q={q} nivel={nivel} />

      {q && (
        <nav className="filtros" aria-label="Filtrar por nivel">
          <Link className={nivel ? "filtro" : "filtro activo"} href={`/buscar?${new URLSearchParams({ q })}`}>Todos</Link>
          {NIVELES_INFO.map((n) => (
            <Link
              key={n.ruta}
              className={nivel === n.nivel ? "filtro activo" : "filtro"}
              href={`/buscar?${new URLSearchParams({ q, nivel: n.nivel })}`}
            >
              {n.nivel}
            </Link>
          ))}
        </nav>
      )}

      {q && !generar && (
        <section>
          <h2>{resultados.length ? "Encontramos esto" : "Aún no está en la biblioteca"}</h2>
          {resultados.length > 0 && <ListaTemas temas={resultados} />}
          {!resultados.length && !hayChat && (
            <p className="nota">Prueba con otras palabras o elige tu nivel desde el inicio.</p>
          )}
          {hayChat && (
            <p className="nota">
              {resultados.length ? "¿No es lo que buscas? " : ""}
              <Link className="enlace-fuerte" href={enlace({ nuevo: "1" })}>Pregúntale a {ASISTENTE}</Link>
            </p>
          )}
          {maestro === "mejorar" && !resultados.length && (
            <p className="nota">
              Con el plan completo, {ASISTENTE} te explica los temas que aún no están.{" "}
              <Link className="enlace-fuerte" href="/acceso">Tengo ese código</Link>
            </p>
          )}
        </section>
      )}

      {generar && (
        <ChatEnVivo
          key={q}
          modoInicial="tema-nuevo"
          nivel={nivel}
          preguntaInicial={q}
          sugerencias={["No entendí, explícamelo de otra forma"]}
        />
      )}
    </main>
  );
}
