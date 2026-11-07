import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import "katex/contrib/mhchem";
import { EnIngles } from "./Escuchar";

/** `escuchar`: en temas de Inglés, cada frase en cursiva lleva un botón 🔊. */
export function Mensaje({ texto, escuchar = false }: { texto: string; escuchar?: boolean }) {
  return (
    <div className="prosa">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore" }]]}
        components={escuchar ? { em: EnIngles } : undefined}
      >
        {texto}
      </ReactMarkdown>
    </div>
  );
}
