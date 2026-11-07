import Link from "next/link";
import { notFound } from "next/navigation";
import { EjercicioAbierto } from "@/components/EjercicioAbierto";
import { Imprimir } from "@/components/Imprimir";
import { Mensaje } from "@/components/Mensaje";
import { RetoRapido } from "@/components/RetoRapido";
import { etiquetaGrado } from "@/lib/grado";
import { TutorFlotante } from "@/components/TutorFlotante";
import { progresoActivo } from "@/lib/progreso";
import { obtenerTema } from "@/lib/temas";

export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

export default async function PaginaTema({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tema = await obtenerTema(slug);
  if (!tema) notFound();
  const { idea, pizarron, truco, practica, analogias, ejercicios, reto } = tema.contenido;
  const correo = process.env.CORREO_ESCUELA;
  const reporte = correo
    ? `mailto:${correo}?subject=${encodeURIComponent(`Error en el tema: ${tema.titulo}`)}`
    : null;

  return (
    <main className="pagina">
      <nav className="sin-imprimir"><Link href="/">← Biblioteca</Link></nav>
      <header className="cabecera-tema">
        <p className="marca">{tema.materia} · {etiquetaGrado(tema.nivel, tema.etapa)}</p>
        <h1>{tema.titulo}</h1>
      </header>

      <section className="bloque idea" data-seccion="idea">
        <h2>🧩 La idea en simple</h2>
        <Mensaje texto={idea} />
      </section>
      <section className="bloque pizarron" data-seccion="pizarron">
        <h2>⚙️ Cómo funciona en el pizarrón</h2>
        <Mensaje texto={pizarron} />
      </section>
      <section className="bloque truco" data-seccion="truco">
        <h2>💡 El truco de oro</h2>
        <Mensaje texto={truco} />
      </section>
      <section className="bloque" data-seccion="practica">
        <h2>📝 Práctica exprés</h2>
        <Mensaje texto={practica.ejercicio} />
        <EjercicioAbierto ejercicio={practica.ejercicio} seccion="practica" materia={tema.materia} />
        <details>
          <summary>Ver respuesta</summary>
          <Mensaje texto={practica.respuesta} />
        </details>
      </section>

      {reto && (
        <section className="bloque sin-imprimir" data-seccion="reto">
          <h2>🎯 Reto rápido</h2>
          <RetoRapido preguntas={reto} slug={tema.slug} guardar={progresoActivo()} />
        </section>
      )}

      <section className="bloque tarea" data-seccion="tarea">
        <h2>✏️ Tu tarea</h2>
        <p>Resuélvela aquí o en tu cuaderno, y después revisa cada respuesta.</p>
        <ol>
          {ejercicios.map((e, i) => (
            <li key={e.ejercicio} id={`ejercicio-${i + 1}`}>
              <Mensaje texto={e.ejercicio} />
              <EjercicioAbierto ejercicio={e.ejercicio} seccion="tarea" materia={tema.materia} />
              <details>
                <summary>Ver respuesta</summary>
                <Mensaje texto={e.respuesta} />
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section className="apoyo">
        <details>
          <summary>No entendí, explícalo de otra forma</summary>
          {analogias.map((a) => (
            <div key={a.titulo}>
              <h3>{a.titulo}</h3>
              <Mensaje texto={a.texto} />
            </div>
          ))}
        </details>
      </section>

      <div className="acciones sin-imprimir">
        <TutorFlotante slug={tema.slug} nivel={tema.nivel} materia={tema.materia} />
        <Imprimir />
        {reporte && <a className="boton-secundario" href={reporte}>Reportar error</a>}
      </div>

      <p className="fuente">
        Temario: {tema.campo}. {tema.origen === "vivo" ? "Tema agregado con ayuda de IA y revisado automáticamente." : "Explicación generada con IA y revisada automáticamente."} Fuente: {tema.fuente}, p. {tema.pagina}.
      </p>
    </main>
  );
}
