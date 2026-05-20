import { loginSchema } from "@/lib/validators";
import { setAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Format login tidak valid." }, { status: 400 });

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return Response.json({ error: "ADMIN_EMAIL dan ADMIN_PASSWORD belum diatur di env." }, { status: 500 });
  }

  if (parsed.data.email !== adminEmail || parsed.data.password !== adminPassword) {
    return Response.json({ error: "Email atau password admin salah." }, { status: 401 });
  }

  await setAdminSession();
  return Response.json({ ok: true });
}
