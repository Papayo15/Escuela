import Link from "next/link";
import { notFound } from "next/navigation";
import { DiloTu } from "@/components/DiloTu";
import { EjercicioAbierto } from "@/components/EjercicioAbierto";
import { LeerSeccion } from "@/components/Escuchar";
import { Imprimir } from "@/components/Imprimir";
import { Mensaje } from "@/components/Mensaje";
import { RetoRapido } from "@/components/RetoRapido";
import { etiquetaGrado } from "@/lib/grado";
import { TutorFlotante } from "@/components/TutorFlotante";
import { progresoActivo } from "@/lib/progreso";
import { esMateriaEspanol, esMateriaIngles, frasesIngles, frasesLectura } from "@/lib/voz";
import { rutaDeNivel } from "@/lib/niveles";
import { aSlug, obtenerTema } from "@/lib/temas";

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
  const ingles = esMateriaIngles(tema.materia);
  const espanol = esMateriaEspanol(tema.materia);
  const frasesOrales = ingles ? frasesIngles(tema.contenido) : espanol ? frasesLectura(tema.contenido) : [];
  // En Español, cada sección se puede escuchar completa: ayuda a quien aún lee despacio.
  const leer = (texto: string) => (espanol ? <LeerSeccion texto={texto} /> : null);
  const reporte = correo
    ? `mailto:${correo}?subject=${encodeURIComponent(`Error en el tema: ${tema.titulo}`)}`
    : null;

  return (
    <main className="pagina">
      <nav className="sin-imprimir"><Link href={`/nivel/${rutaDeNivel(tema.nivel)}/${aSlug(tema.materia)}`}>← {tema.materia}</Link></nav>
      <header className="cabecera-tema">
        <p className="marca">{tema.materia} · {etiquetaGrado(tema.nivel, tema.etapa)}</p>
        <h1>{tema.titulo}</h1>
      </header>

      <section className="bloque idea" data-seccion="idea">
        <h2>🧩 La idea en simple {leer(idea)}</h2>
        <Mensaje texto={idea} escuchar={ingles} />
      </section>
      <section className="bloque pizarron" data-seccion="pizarron">
        <h2>⚙️ Cómo funciona en el pizarrón {leer(pizarron)}</h2>
        <Mensaje texto={pizarron} escuchar={ingles} />
      </section>
      <section className="bloque truco" data-seccion="truco">
        <h2>💡 El truco de oro {leer(truco)}</h2>
        <Mensaje texto={truco} escuchar={ingles} />
      </section>
      <section className="bloque" data-seccion="practica">
        <h2>📝 Práctica exprés {leer(practica.ejercicio)}</h2>
        <Mensaje texto={practica.ejercicio} escuchar={ingles} />
        <EjercicioAbierto ejercicio={practica.ejercicio} seccion="practica" materia={tema.materia} />
        <details>
          <summary>Ver respuesta</summary>
          <Mensaje texto={practica.respuesta} escuchar={ingles} />
        </details>
      </section>

      {reto && (
        <section className="bloque sin-imprimir" data-seccion="reto">
          <h2>🎯 Reto rápido</h2>
          <RetoRapido preguntas={reto} slug={tema.slug} guardar={progresoActivo()} escuchar={ingles} />
        </section>
      )}

      {frasesOrales.length > 0 && (
        <section className="bloque sin-imprimir" data-seccion="oral">
          <h2>{ingles ? "🎤 Dilo tú" : "🎤 Lee en voz alta"}</h2>
          <DiloTu frases={frasesOrales} idioma={ingles ? "en-US" : "es-MX"} />
        </section>
      )}

      <section className="bloque tarea" data-seccion="tarea">
        <h2>✏️ Tu tarea {leer(ejercicios.map((e, i) => `${i + 1}. ${e.ejercicio}`).join("\n"))}</h2>
        <p>Resuélvela aquí o en tu cuaderno, y después revisa cada respuesta.</p>
        <ol>
          {ejercicios.map((e, i) => (
            <li key={e.ejercicio} id={`ejercicio-${i + 1}`}>
              <Mensaje texto={e.ejercicio} escuchar={ingles} />
              <EjercicioAbierto ejercicio={e.ejercicio} seccion="tarea" materia={tema.materia} />
              <details>
                <summary>Ver respuesta</summary>
                <Mensaje texto={e.respuesta} escuchar={ingles} />
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
              <Mensaje texto={a.texto} escuchar={ingles} />
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
