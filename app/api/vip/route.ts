import { clearVipAccess, getRequestHash, hasVipAccess, setVipAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vipSchema } from "@/lib/validators";

export async function GET() {
  return Response.json({ vipAccess: await hasVipAccess() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = vipSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Kode VIP wajib diisi." }, { status: 400 });

  if (parsed.data.code !== process.env.VIP_CODE) {
    return Response.json({ error: "Kode VIP salah. Silakan coba lagi atau hubungi admin." }, { status: 401 });
  }

  const alreadyAccess = await hasVipAccess();
  await setVipAccess();
  if (!alreadyAccess) {
    await prisma.vipAccessLog.create({ data: { userHash: await getRequestHash() } });
  }

  return Response.json({ ok: true, message: "Kode benar. Prompt VIP berhasil dibuka." });
}

export async function DELETE() {
  await clearVipAccess();
  return Response.json({ ok: true });
}
