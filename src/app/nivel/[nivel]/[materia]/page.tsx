import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Buscador, ListaTemas } from "@/components/Biblioteca";
import { nivelDeRuta, ordenEtapa } from "@/lib/niveles";
import { aSlug, listarMaterias, listarTemas } from "@/lib/temas";

type Props = { params: Promise<{ nivel: string; materia: string }> };

async function buscarMateria({ params }: Props) {
  const { nivel, materia } = await params;
  const info = nivelDeRuta(nivel);
  if (!info) return null;
  const encontrada = (await listarMaterias(info.nivel)).find((m) => aSlug(m.materia) === materia);
  return encontrada ? { info, materia: encontrada.materia } : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const datos = await buscarMateria(props);
  return { title: datos ? `${datos.materia} · ${datos.info.nivel}` : "Materia" };
}

export default async function PaginaMateria(props: Props) {
  const datos = await buscarMateria(props);
  if (!datos) notFound();
  const { info, materia } = datos;
  const temas = await listarTemas(info.nivel, materia);
  const etapas = [...Map.groupBy(temas, (t) => t.etapa)].sort(([a], [b]) => ordenEtapa(a) - ordenEtapa(b));
  const variasEtapas = etapas.length > 1;

  return (
    <main className="pagina">
      <nav><Link href={`/nivel/${info.ruta}`}>← Materias de {info.nivel}</Link></nav>
      <header className="portada">
        <p className="marca">{info.emoji} {info.nivel}</p>
        <h1>{materia}</h1>
      </header>
      <Buscador nivel={info.nivel} />
      {etapas.map(([etapa, lista]) => (
        <section key={etapa}>
          {variasEtapas && <h2>{etapa} <span className="cuenta">{lista.length}</span></h2>}
          <ListaTemas temas={lista} conMateria={false} />
        </section>
      ))}
      {temas.length === 0 && <p className="nota">No hay temas en esta materia.</p>}
    </main>
  );
}
