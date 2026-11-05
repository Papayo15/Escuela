import { estadoMaestro } from "@/lib/plan";

export async function GET() {
  return Response.json(
    { maestro: await estadoMaestro() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
