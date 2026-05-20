# DiTz Prompt — Next.js + PostgreSQL + Vercel

Project ini adalah versi produksi dari website DiTz Prompt dengan frontend Next.js, database PostgreSQL via Prisma ORM, upload foto/file via Vercel Blob, dan deploy ke Vercel.

## Fitur

- Landing page responsif modern.
- Prompt gratis dari database.
- Prompt VIP dengan kode dari environment variable server.
- Akses VIP memakai cookie HTTP-only yang ditandatangani.
- DiTz Assistant chat bubble.
- Tutorial prompt.
- Galeri foto dan file download.
- Admin panel:
  - Login admin.
  - Dashboard statistik.
  - Tambah/edit/hapus prompt gratis dan VIP.
  - Upload/hapus foto.
  - Upload/hapus file.
- PostgreSQL untuk data prompt, metadata foto/file, dan statistik akses VIP.
- Vercel Blob untuk file foto/download.

## Struktur penting

```txt
app/
  api/
    admin/
    media/
    prompts/
    vip/
  globals.css
  layout.tsx
  page.tsx
components/
  DitzPromptApp.tsx
lib/
  auth.ts
  prisma.ts
  validators.ts
prisma/
  schema.prisma
  seed.ts
public/
  images/
  files/
  music/music.mp3
```

## Environment variables

Buat `.env` lokal dari `.env.example`:

```bash
cp .env.example .env
```

Isi variable berikut:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
ADMIN_EMAIL="email_admin"
ADMIN_PASSWORD="password_admin"
VIP_CODE="kode_vip"
SESSION_SECRET="random_string_panjang_minimal_32_karakter"
BLOB_READ_WRITE_TOKEN="token_vercel_blob"
```

Jangan commit `.env` ke GitHub.

## Jalankan lokal

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

## Deploy Vercel

1. Push project ini ke GitHub.
2. Import repository di Vercel.
3. Buat database PostgreSQL, misalnya Prisma Postgres dari Vercel Marketplace atau provider Postgres lain.
4. Set `DATABASE_URL` di Environment Variables Vercel.
5. Buat Vercel Blob Store dan hubungkan ke project agar `BLOB_READ_WRITE_TOKEN` tersedia.
6. Tambahkan env server berikut di Vercel:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `VIP_CODE`
   - `SESSION_SECRET`
   - `DATABASE_URL`
   - `BLOB_READ_WRITE_TOKEN`
7. Deploy.
8. Jalankan seed sekali di lokal atau lewat Vercel/Prisma command sesuai workflow kamu:

```bash
npm run db:seed
```

## Catatan keamanan

- Password admin dan kode VIP tidak ada di frontend.
- Cookie admin dan VIP memakai HTTP-only, secure di production, dan signature HMAC.
- Untuk produksi lebih kuat, ganti `ADMIN_PASSWORD` plain env menjadi hash bcrypt/argon2, tambahkan rate limit login, dan audit log admin.
- Jangan simpan file upload ke filesystem Vercel, gunakan object storage seperti Vercel Blob.
