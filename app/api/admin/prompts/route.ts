import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { promptSchema } from "@/lib/validators";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const prompts = await prisma.prompt.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ prompts });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const parsed = promptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Data prompt tidak valid." }, { status: 400 });
  }

  const prompt = await prisma.prompt.create({ data: parsed.data });
  return Response.json({ prompt }, { status: 201 });
}
