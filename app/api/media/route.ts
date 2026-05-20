import { MediaType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type")?.toUpperCase();

  const where = type === "PHOTO"
    ? { type: MediaType.PHOTO }
    : type === "FILE"
      ? { type: MediaType.FILE }
      : {};

  const media = await prisma.media.findMany({ where, orderBy: { createdAt: "desc" } });
  return Response.json({ media });
}
