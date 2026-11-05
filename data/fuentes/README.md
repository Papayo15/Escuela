# Fuentes oficiales

Descargadas el 2026-11-04. Los PDF no se publican con la app; `texto/` guarda su texto por página para verificar el temario.

| Archivo | Origen |
|---|---|
| `basica/programa-sintetico-fase-N.pdf` | educacionbasica.sep.gob.mx/wp-content/uploads/2024/08/ |
| `basica/plan-de-estudio-2025.pdf` | educacionbasica.sep.gob.mx, Plan_y_programas_de_estudio_2025 |
| `media-superior/*` | educacionmediasuperior.sep.gob.mx/modeloeducativo2025.html |

Marco de media superior: Acuerdo 21/08/25, DOF del 15 de agosto de 2025, que abroga el Acuerdo 09/08/23.

El Anexo del DOF de 2023 no se pudo descargar porque el certificado de dof.gob.mx no coincidió; se usaron los mismos programas publicados por la SEP. No se encontraron programas sintéticos 2025: si aparecen, `npm run vigilar` los reportará.

Fuera de la biblioteca: Lengua Indígena (depende de la variante de cada comunidad), PAEC, formación socioemocional de bachillerato y componentes propios de cada subsistema.

Inglés en primaria: los programas de las fases 3 a 5 solo lo nombran como "inglés como lengua extranjera", sin contenidos. Los nodos de `data/temario/ingles-primaria.json` citan esa frase y sus subtemas son propuesta de la escuela, no contenido oficial.
