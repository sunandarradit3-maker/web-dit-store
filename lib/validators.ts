import { z } from "zod";

export const promptSchema = z.object({
  title: z.string().min(2, "Judul terlalu pendek"),
  category: z.string().min(2, "Kategori terlalu pendek"),
  content: z.string().min(5, "Isi prompt terlalu pendek"),
  tutorial: z.string().min(5, "Tutorial terlalu pendek"),
  status: z.enum(["FREE", "VIP"])
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const vipSchema = z.object({
  code: z.string().min(1)
});
