import { put } from "@vercel/blob";
import { MediaType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const typeValue = String(form.get("type") ?? "").toUpperCase();
  const file = form.get("file");

  if (!title || !(file instanceof File)) {
    return Response.json({ error: "Judul dan file wajib diisi." }, { status: 400 });
  }

  const type = typeValue === "PHOTO" ? MediaType.PHOTO : typeValue === "FILE" ? MediaType.FILE : null;
  if (!type) return Response.json({ error: "Tipe media tidak valid." }, { status: 400 });

  const folder = type === MediaType.PHOTO ? "images" : "files";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const pathname = `${folder}/${Date.now()}-${safeName}`;

  const blob = await put(pathname, file, { access: "public" });

  const media = await prisma.media.create({
    data: {
      title,
      type,
      filename: file.name,
      url: blob.url,
      size: file.size,
      mimeType: file.type
    }
  });

  return Response.json({ media }, { status: 201 });
}
