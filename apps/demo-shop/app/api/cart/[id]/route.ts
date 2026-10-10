export async function DELETE(req: Request, ctx: RouteContext<"/api/cart/[id]">) {
  const { id } = await ctx.params;
  const bugs = req.headers.get("x-qa-bugs") ?? "all";
  if (bugs === "all" || bugs.split(",").includes("B1")) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
  return Response.json({ ok: true, id });
}
