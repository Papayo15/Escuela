import Link from "next/link";
import { redirect } from "next/navigation";
import { AyudaTema } from "@/components/AyudaTema";
import { Buscador } from "@/components/Biblioteca";
import { ASISTENTE, ESCUELA } from "@/lib/marca";
import { NIVELES_INFO, rutaDeNivel } from "@/lib/niveles";
import { estadoMaestro } from "@/lib/plan";
import { progresoActivo } from "@/lib/progreso";
import { aSlug } from "@/lib/temas";

type Props = { searchParams: Promise<{ q?: string; nivel?: string; materia?: string }> };

export default async function Inicio({ searchParams }: Props) {
  // Enlaces viejos (/?q=... o /?nivel=...&materia=...) siguen funcionando.
  const { q, nivel, materia } = await searchParams;
  if (q) redirect(`/buscar?${new URLSearchParams({ q, ...(nivel ? { nivel } : {}) })}`);
  const ruta = nivel ? rutaDeNivel(nivel) : undefined;
  if (ruta) redirect(materia ? `/nivel/${ruta}/${aSlug(materia)}` : `/nivel/${ruta}`);

  const maestro = await estadoMaestro();

  return (
    <main className="pagina">
      <header className="portada">
        <p className="marca">{ESCUELA}</p>
        {progresoActivo() && (
          <p className="sin-imprimir"><Link className="enlace-fuerte" href="/progreso">Mi progreso</Link></p>
        )}
        <h1>¿Qué quieres aprender hoy?</h1>
        <p className="nota">Escribe un tema o elige tu nivel.</p>
      </header>

      <Buscador />

      <nav className="niveles" aria-label="Niveles">
        {NIVELES_INFO.map((n) => (
          <Link key={n.ruta} href={`/nivel/${n.ruta}`} className="nivel">
            <span className="nivel-emoji" aria-hidden>{n.emoji}</span>
            <strong>{n.nivel}</strong>
            <span>{n.grados}</span>
          </Link>
        ))}
      </nav>

      {maestro !== "oculto" && (
        <section className="bloque cevs-portada sin-imprimir">
          <h2>¿Tienes una duda o una tarea?</h2>
          <p>
            {maestro === "activo"
              ? <>Pregúntale a <strong>{ASISTENTE}</strong>, el asistente de {ESCUELA}. También puedes subir una foto de tu ejercicio.</>
              : <><strong>{ASISTENTE}</strong>, el asistente de {ESCUELA}, resuelve tus dudas y revisa fotos de tu tarea.</>}
          </p>
          <AyudaTema estado={maestro} />
        </section>
      )}
    </main>
  );
}
