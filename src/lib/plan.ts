import { cookies } from "next/headers";
import { chatDisponible, COOKIE_ACCESO, planDeCookie, type Plan } from "./acceso";

export async function planActual(): Promise<Plan | null> {
  return planDeCookie((await cookies()).get(COOKIE_ACCESO)?.value);
}

/** Qué puede ver el alumno del asistente. */
export async function estadoMaestro(): Promise<"activo" | "mejorar" | "oculto"> {
  if (!chatDisponible()) return "oculto";
  return (await planActual()) === "premium" ? "activo" : "mejorar";
}
