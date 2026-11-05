const LADO_MAXIMO = 1600;
const PESO_MAXIMO = 3_500_000;

/** Vercel rechaza cuerpos grandes: la foto se reduce en el navegador antes de enviarse. */
export async function reducirFoto(archivo: File): Promise<string> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("Sin lienzo");
  contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  for (const calidad of [0.8, 0.6, 0.4]) {
    const datos = lienzo.toDataURL("image/jpeg", calidad);
    if (datos.length <= PESO_MAXIMO) return datos;
  }
  throw new Error("Foto demasiado grande");
}
