import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Buscador } from "@/components/Biblioteca";
import { nivelDeRuta } from "@/lib/niveles";
import { aSlug, listarMaterias } from "@/lib/temas";

type Props = { params: Promise<{ nivel: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const info = nivelDeRuta((await params).nivel);
  return { title: info?.nivel ?? "Nivel" };
}

export default async function PaginaNivel({ params }: Props) {
  const info = nivelDeRuta((await params).nivel);
  if (!info) notFound();
  const materias = await listarMaterias(info.nivel);

  return (
    <main className="pagina">
      <nav><Link href="/">← Inicio</Link></nav>
      <header className="portada">
        <p className="marca">{info.emoji} {info.grados}</p>
        <h1>{info.nivel}</h1>
        <p className="nota">Elige una materia o busca un tema de {info.nivel.toLowerCase()}.</p>
      </header>
      <Buscador nivel={info.nivel} />
      <ul className="temas materias">
        {materias.map((m) => (
          <li key={m.materia}>
            <Link href={`/nivel/${info.ruta}/${aSlug(m.materia)}`}>
              <strong>{m.materia}</strong>
              <span>{m.total} temas</span>
            </Link>
          </li>
        ))}
      </ul>
      {materias.length === 0 && <p className="nota">Todavía no hay materias en este nivel.</p>}
    </main>
  );
}
