import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { promptSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = promptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Data prompt tidak valid." }, { status: 400 });
  }

  const prompt = await prisma.prompt.update({ where: { id }, data: parsed.data });
  return Response.json({ prompt });
}

export async function DELETE(_: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await prisma.prompt.delete({ where: { id } });
  return Response.json({ ok: true });
}
