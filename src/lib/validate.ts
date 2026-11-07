import { z } from "zod";
import { NIVELES } from "./pedagogical-prompt";
import { CLAVES_SECCION } from "./secciones";

export const MAX_PREGUNTA = 2000;
export const MAX_CUERPO = 200_000;
export const MAX_IMAGEN = 4_000_000;
export const MAX_CUERPO_FOTO = MAX_IMAGEN + 4_000;

const mensaje = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20_000),
});

const solicitud = z
  .object({
    modo: z.enum(["tema-nuevo", "seguimiento"]),
    slug: z.string().regex(/^[a-z0-9-]+$/).max(100).optional(),
    seccion: z.enum(CLAVES_SECCION).optional(),
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

const IMAGEN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

const solicitudFoto = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100).optional(),
  seccion: z.enum(CLAVES_SECCION).optional(),
  nivel: z.enum(NIVELES).optional(),
  pregunta: z.string().trim().min(1).max(MAX_PREGUNTA),
  imagen: z.string().max(MAX_IMAGEN, "La foto es demasiado grande.").regex(IMAGEN, "Esa foto no se puede leer."),
});

export type SolicitudFoto = z.infer<typeof solicitudFoto>;

export function validarFoto(
  datos: unknown,
): { ok: true; datos: SolicitudFoto } | { ok: false; error: string } {
  const r = solicitudFoto.safeParse(datos);
  if (r.success) return { ok: true, datos: r.data };
  const propio = r.error.issues.find((i) => i.path[0] === "imagen" && i.code !== "invalid_type");
  return { ok: false, error: propio?.message ?? "Solicitud inválida." };
}
