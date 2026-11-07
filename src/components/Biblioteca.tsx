import Link from "next/link";
import { etiquetaGrado } from "@/lib/grado";
import type { TemaResumen } from "@/lib/temas";

export function ListaTemas({ temas, conMateria = true }: { temas: TemaResumen[]; conMateria?: boolean }) {
  return (
    <ul className="temas">
      {temas.map((t) => (
        <li key={t.slug}>
          <Link href={`/tema/${t.slug}`}>
            <strong>{t.titulo}</strong>
            <span>{conMateria ? `${t.materia} · ` : ""}{etiquetaGrado(t.nivel, t.etapa)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Cuadro "¿Qué quieres aprender?". Con `nivel`, busca solo en ese nivel. */
export function Buscador({ q = "", nivel }: { q?: string; nivel?: string }) {
  return (
    <form className="buscador" action="/buscar">
      <label className="oculto" htmlFor="q">¿Qué quieres aprender?</label>
      <input id="q" name="q" defaultValue={q} placeholder="Ejemplo: fracciones, verbo to be, la célula" required />
      {nivel && <input type="hidden" name="nivel" value={nivel} />}
      <button className="boton">Buscar</button>
    </form>
  );
}
