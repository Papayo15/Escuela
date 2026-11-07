"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FormularioPerfil() {
  const router = useRouter();
  const [nuevo, setNuevo] = useState(false);
  const [apodo, setApodo] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const r = await fetch("/api/progreso/perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: nuevo ? "crear" : "entrar", apodo, pin }),
    }).catch(() => null);
    setEnviando(false);
    if (r?.ok) return router.refresh();
    const datos = (await r?.json().catch(() => null)) as { error?: string } | null;
    setError(datos?.error ?? "No se pudo. Intenta otra vez.");
  };

  return (
    <form className="bloque perfil" onSubmit={enviar}>
      <h2>{nuevo ? "Crear mi perfil" : "Entrar a mi perfil"}</h2>
      <p className="nota">
        Usa un apodo, nunca tu nombre. Solo guardamos tu apodo y los aciertos de tus retos, con su fecha.
      </p>
      <label>
        Apodo
        <input
          value={apodo}
          onChange={(e) => setApodo(e.target.value.toLowerCase().replace(/\s/g, ""))}
          minLength={3}
          maxLength={20}
          autoCapitalize="none"
          autoComplete="username"
          placeholder="ejemplo: tigre_azul"
          required
        />
      </label>
      <label>
        PIN de 6 números
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete={nuevo ? "new-password" : "current-password"}
          type="password"
          required
        />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="plantillas">
        <button className="boton" disabled={enviando || pin.length !== 6}>
          {nuevo ? "Crear perfil" : "Entrar"}
        </button>
        <button type="button" className="boton-secundario" onClick={() => setNuevo(!nuevo)}>
          {nuevo ? "Ya tengo perfil" : "Soy nuevo"}
        </button>
      </div>
    </form>
  );
}

export function SalirPerfil() {
  const router = useRouter();
  const salir = async (borrar: boolean) => {
    if (borrar && !window.confirm("¿Borrar tu perfil y todo tu progreso? No se puede deshacer.")) return;
    await fetch(`/api/progreso/perfil${borrar ? "?borrar=1" : ""}`, { method: "DELETE" });
    router.refresh();
  };
  return (
    <div className="plantillas">
      <button className="boton-secundario" onClick={() => salir(false)}>Salir</button>
      <button className="boton-secundario" onClick={() => salir(true)}>Borrar mi progreso</button>
    </div>
  );
}
