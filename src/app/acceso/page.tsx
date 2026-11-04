"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Acceso() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    const r = await fetch("/api/acceso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo }),
    }).catch(() => null);
    setEnviando(false);
    if (r?.ok) {
      router.replace("/");
      router.refresh();
    } else {
      setError("Ese código no es correcto. Pídelo en tu escuela.");
    }
  }

  return (
    <main className="acceso">
      <h1>Escuela de regularización</h1>
      <p>Escribe el código que te dio tu escuela.</p>
      <form onSubmit={entrar}>
        <label className="oculto" htmlFor="codigo">Código de acceso</label>
        <input
          id="codigo"
          value={codigo}
          autoComplete="off"
          placeholder="Código"
          onChange={(e) => setCodigo(e.target.value)}
        />
        <button className="boton" disabled={enviando || !codigo.trim()}>Entrar</button>
      </form>
      {error && <p className="aviso" role="alert">{error}</p>}
    </main>
  );
}
