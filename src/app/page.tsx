import Link from "next/link";
import { ChatEnVivo } from "@/components/ChatEnVivo";
import { chatDisponible } from "@/lib/acceso";
import { NIVELES, type Nivel } from "@/lib/pedagogical-prompt";
import { buscarTemas, listarTemas, type TemaResumen } from "@/lib/temas";

type Props = { searchParams: Promise<{ q?: string; nivel?: string; nuevo?: string }> };

function Lista({ temas }: { temas: TemaResumen[] }) {
  return (
    <ul className="temas">
      {temas.map((t) => (
        <li key={t.slug}>
          <Link href={`/tema/${t.slug}`}>
            <strong>{t.titulo}</strong>
            <span>{t.materia} · {t.nivel}, {t.etapa}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function Inicio({ searchParams }: Props) {
  const parametros = await searchParams;
  const q = parametros.q?.trim().slice(0, 300) ?? "";
  const nivel = NIVELES.find((n) => n === parametros.nivel) as Nivel | undefined;
  const resultados = q ? await buscarTemas(q, nivel) : [];
  const hayChat = chatDisponible();
  const generar = Boolean(hayChat && q && parametros.nuevo === "1");
  const temas = q ? [] : await listarTemas(nivel);
  const grupos = Map.groupBy(temas, (t) => t.materia);

  return (
    <main className="pagina">
      <header className="portada">
        <p className="marca">Escuela de regularización</p>
        <h1>¿Qué tema quieres entender hoy?</h1>
      </header>

      <form className="buscador" action="/">
        <label className="oculto" htmlFor="q">Tema</label>
        <input id="q" name="q" defaultValue={q} placeholder="Ejemplo: fracciones equivalentes" />
        <label className="oculto" htmlFor="nivel">Nivel</label>
        <select id="nivel" name="nivel" defaultValue={nivel ?? ""}>
          <option value="">Todos los niveles</option>
          {NIVELES.map((n) => <option key={n}>{n}</option>)}
        </select>
        <button className="boton">Buscar</button>
      </form>

      {q && !generar && (
        <section>
          <h2>{resultados.length ? "Encontramos esto" : "Aún no está en la biblioteca"}</h2>
          {resultados.length > 0 && <Lista temas={resultados} />}
          {!hayChat && !resultados.length && (
            <p className="nota">Prueba con otras palabras o navega por materia.</p>
          )}
          {hayChat && <p className="nota">
            {resultados.length ? "¿No es lo que buscas? " : ""}
            <Link
              className="enlace-fuerte"
              href={`/?${new URLSearchParams({ q, nuevo: "1", ...(nivel ? { nivel } : {}) })}`}
            >
              Preguntarle a Claude
            </Link>
          </p>}
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

      {!q &&
        [...grupos].map(([materia, lista]) => (
          <section key={materia}>
            <h2>{materia}</h2>
            <Lista temas={lista} />
          </section>
        ))}
      {!q && temas.length === 0 && <p className="nota">La biblioteca está vacía por ahora.</p>}
    </main>
  );
}
