import { PromptStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasVipAccess } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const canSeeVip = await hasVipAccess();

  if (type === "vip" && !canSeeVip) {
    return Response.json({ prompts: [], vipAccess: false });
  }

  const where = type === "free"
    ? { status: PromptStatus.FREE }
    : type === "vip"
      ? { status: PromptStatus.VIP }
      : canSeeVip
        ? {}
        : { status: PromptStatus.FREE };

  const prompts = await prisma.prompt.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  return Response.json({ prompts, vipAccess: canSeeVip });
}
