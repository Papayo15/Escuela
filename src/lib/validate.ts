import { z } from "zod";
import { NIVELES } from "./pedagogical-prompt";

export const MAX_PREGUNTA = 2000;
export const MAX_CUERPO = 200_000;

const mensaje = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20_000),
});

const solicitud = z
  .object({
    modo: z.enum(["tema-nuevo", "seguimiento"]),
    slug: z.string().regex(/^[a-z0-9-]+$/).max(100).optional(),
    nivel: z.enum(NIVELES).optional(),
    messages: z.array(mensaje).min(1).max(200),
  })
  .superRefine((s, ctx) => {
    const ultimo = s.messages.at(-1);
    if (ultimo?.role !== "user") {
      ctx.addIssue({ code: "custom", message: "El último mensaje debe ser del alumno." });
    } else if (ultimo.content.length > MAX_PREGUNTA) {
      ctx.addIssue({ code: "custom", message: `Tu pregunta supera ${MAX_PREGUNTA} caracteres.` });
    }
    if (s.messages[0]?.role !== "user") {
      ctx.addIssue({ code: "custom", message: "La conversación debe iniciar con el alumno." });
    }
    s.messages.forEach((m, i) => {
      if (i > 0 && m.role === s.messages[i - 1].role) {
        ctx.addIssue({ code: "custom", message: "Los turnos deben alternarse." });
      }
    });
    if (s.modo === "tema-nuevo" && s.messages.length !== 1) {
      ctx.addIssue({ code: "custom", message: "Un tema nuevo lleva un solo mensaje." });
    }
  });

export type Solicitud = z.infer<typeof solicitud>;

export function validarSolicitud(
  datos: unknown,
): { ok: true; datos: Solicitud } | { ok: false; error: string } {
  const r = solicitud.safeParse(datos);
  if (r.success) return { ok: true, datos: r.data };
  const propio = r.error.issues.find((i) => i.code === "custom");
  return { ok: false, error: propio?.message ?? "Solicitud inválida." };
}
