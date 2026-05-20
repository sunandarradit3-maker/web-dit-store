import { MediaType, PromptStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const [freePrompts, vipPrompts, photos, files, vipUsers] = await Promise.all([
    prisma.prompt.count({ where: { status: PromptStatus.FREE } }),
    prisma.prompt.count({ where: { status: PromptStatus.VIP } }),
    prisma.media.count({ where: { type: MediaType.PHOTO } }),
    prisma.media.count({ where: { type: MediaType.FILE } }),
    prisma.vipAccessLog.count()
  ]);

  return Response.json({ freePrompts, vipPrompts, photos, files, vipUsers });
}
