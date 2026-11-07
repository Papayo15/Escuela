import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioPerfil, SalirPerfil } from "@/components/FormularioPerfil";
import { COOKIE_PERFIL, perfilDeCookie, progresoActivo, resumenAlumno } from "@/lib/progreso";

export const metadata: Metadata = { title: "Mi progreso" };

const DIAS = ["D", "L", "M", "M", "J", "V", "S"];

export default async function PaginaProgreso() {
  // Leer la cookie primero hace la página dinámica: el interruptor se revisa en cada visita.
  const galleta = (await cookies()).get(COOKIE_PERFIL)?.value;
  if (!progresoActivo()) notFound();
  const id = await perfilDeCookie(galleta);
  const resumen = id ? await resumenAlumno(id) : null;

  return (
    <main className="pagina">
      <nav><Link href="/">← Biblioteca</Link></nav>
      <h1>Mi progreso</h1>
      {!resumen ? (
        <FormularioPerfil />
      ) : (
        <>
          <p>Hola, <strong>{resumen.apodo}</strong>.</p>
          <div className="cifras">
            <div className="cifra"><strong>{resumen.racha}</strong><span>{resumen.racha === 1 ? "día seguido" : "días seguidos"}</span></div>
            <div className="cifra"><strong>{resumen.temas}</strong><span>{resumen.temas === 1 ? "tema practicado" : "temas practicados"}</span></div>
            <div className="cifra"><strong>{resumen.promedio ?? "—"}{resumen.promedio !== null && "%"}</strong><span>aciertos</span></div>
          </div>

          <section className="bloque">
            <h2>Últimos 14 días</h2>
            <ol className="calendario">
              {resumen.calendario.map((d) => (
                <li
                  key={d.fecha}
                  className={d.retos ? "con-reto" : ""}
                  title={`${d.fecha}: ${d.retos} ${d.retos === 1 ? "reto" : "retos"}`}
                >
                  <span>{DIAS[new Date(`${d.fecha}T12:00:00Z`).getUTCDay()]}</span>
                  <strong>{d.retos || ""}</strong>
                </li>
              ))}
            </ol>
          </section>

          {resumen.materias.length > 0 && (
            <section className="bloque">
              <h2>Por materia</h2>
              <ul className="materias-progreso">
                {resumen.materias.map((m) => (
                  <li key={m.materia}>
                    <span>{m.materia} · {m.temas} {m.temas === 1 ? "tema" : "temas"}</span>
                    <meter min={0} max={100} value={m.promedio} aria-label={`${m.promedio}% de aciertos`} />
                    <strong>{m.promedio}%</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="bloque">
            <h2>Tus últimos retos</h2>
            {resumen.recientes.length === 0 ? (
              <p className="nota">Todavía no haces ningún Reto rápido. Abre un tema y contesta el reto.</p>
            ) : (
              <ul>
                {resumen.recientes.map((r, i) => (
                  <li key={`${r.slug}-${i}`}>
                    <Link href={`/tema/${r.slug}`}>{r.titulo}</Link>: {r.aciertos} de {r.total} · {r.fecha}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <SalirPerfil />
        </>
      )}
    </main>
  );
}
