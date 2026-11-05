import Link from "next/link";
import { notFound } from "next/navigation";
import { AyudaTema } from "@/components/AyudaTema";
import { Imprimir } from "@/components/Imprimir";
import { Mensaje } from "@/components/Mensaje";
import { obtenerTema } from "@/lib/temas";

export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

export default async function PaginaTema({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tema = await obtenerTema(slug);
  if (!tema) notFound();
  const { idea, pizarron, truco, practica, analogias, ejercicios } = tema.contenido;
  const correo = process.env.CORREO_ESCUELA;
  const reporte = correo
    ? `mailto:${correo}?subject=${encodeURIComponent(`Error en el tema: ${tema.titulo}`)}`
    : null;

  return (
    <main className="pagina">
      <nav className="sin-imprimir"><Link href="/">← Biblioteca</Link></nav>
      <header className="cabecera-tema">
        <p className="marca">{tema.materia} · {tema.nivel}, {tema.etapa}</p>
        <h1>{tema.titulo}</h1>
      </header>

      <section className="bloque idea">
        <h2>🧩 La idea en simple</h2>
        <Mensaje texto={idea} />
      </section>
      <section className="bloque pizarron">
        <h2>⚙️ Cómo funciona en el pizarrón</h2>
        <Mensaje texto={pizarron} />
      </section>
      <section className="bloque truco">
        <h2>💡 El truco de oro</h2>
        <Mensaje texto={truco} />
      </section>
      <section className="bloque">
        <h2>📝 Práctica exprés</h2>
        <Mensaje texto={practica.ejercicio} />
        <details>
          <summary>Ver respuesta</summary>
          <Mensaje texto={practica.respuesta} />
        </details>
      </section>

      <section className="bloque tarea">
        <h2>✏️ Tu tarea</h2>
        <p>Resuélvela en tu cuaderno y después revisa cada respuesta.</p>
        <ol>
          {ejercicios.map((e) => (
            <li key={e.ejercicio}>
              <Mensaje texto={e.ejercicio} />
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
        <AyudaTema slug={tema.slug} nivel={tema.nivel} />
        <Imprimir />
        {reporte && <a className="boton-secundario" href={reporte}>Reportar error</a>}
      </div>

      <p className="fuente">
        Temario: {tema.campo}. {tema.origen === "vivo" ? "Tema agregado con ayuda de IA y revisado automáticamente." : "Explicación generada con IA y revisada automáticamente."} Fuente: {tema.fuente}, p. {tema.pagina}.
      </p>
    </main>
  );
}
