import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return Response.json({ error: "Media tidak ditemukan." }, { status: 404 });

  if (media.url.startsWith("http")) {
    try { await del(media.url); } catch { /* blob mungkin sudah terhapus */ }
  }

  await prisma.media.delete({ where: { id } });
  return Response.json({ ok: true });
}
