export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string; email?: string; message?: string };
  if (!body.name || !body.email || !body.message) return Response.json({ error: "Missing fields" }, { status: 400 });
  return Response.json({ ok: true });
}
