import { PrismaClient, PromptStatus, MediaType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const promptCount = await prisma.prompt.count();
  if (promptCount === 0) {
    await prisma.prompt.createMany({
      data: [
        {
          status: PromptStatus.FREE,
          title: "Ide Konten TikTok 30 Hari",
          category: "Konten",
          content:
            "Buatkan 30 ide konten TikTok untuk niche [NICHE]. Sertakan hook, konsep video, caption singkat, dan CTA. Gaya bahasa: santai, viral, mudah dipahami.",
          tutorial:
            "Ganti [NICHE] dengan bidang kamu, misalnya skincare, game, kuliner, edukasi, atau bisnis online. Minta AI menyesuaikan target audiens dan durasi video."
        },
        {
          status: PromptStatus.FREE,
          title: "Caption Instagram Profesional",
          category: "Sosial Media",
          content:
            "Tulis 10 caption Instagram untuk produk [NAMA PRODUK]. Gunakan gaya bahasa [GAYA], tambahkan emoji secukupnya, manfaat produk, dan CTA untuk DM/order.",
          tutorial:
            "Isi nama produk dan gaya bahasa seperti elegan, lucu, premium, atau friendly. Pilih caption yang paling cocok lalu edit sesuai brand."
        },
        {
          status: PromptStatus.FREE,
          title: "Prompt Gambar Realistic",
          category: "Gambar AI",
          content:
            "Create a realistic image of [SUBJEK], cinematic lighting, ultra detailed, natural color grading, 4K, sharp focus, professional photography, dramatic atmosphere.",
          tutorial:
            "Ganti [SUBJEK] dengan objek utama. Tambahkan lokasi, warna, gaya kamera, dan suasana agar hasil gambar lebih spesifik."
        },
        {
          status: PromptStatus.FREE,
          title: "Deskripsi Produk Marketplace",
          category: "Bisnis",
          content:
            "Buat deskripsi produk marketplace untuk [PRODUK]. Jelaskan manfaat, fitur utama, bahan/ukuran, alasan membeli, dan CTA. Format rapi dengan bullet point.",
          tutorial:
            "Isi detail produk dengan lengkap. Tambahkan target pembeli dan keunggulan dibanding produk lain supaya deskripsi lebih menjual."
        },
        {
          status: PromptStatus.VIP,
          title: "Landing Page Premium Converter",
          category: "Bisnis VIP",
          content:
            "Bertindak sebagai copywriter landing page profesional. Buat struktur landing page untuk produk [PRODUK] dengan bagian: headline kuat, subheadline, problem, solusi, benefit, fitur, social proof, bonus, FAQ, garansi, dan CTA. Target pembeli: [TARGET]. Gaya: premium, persuasif, jelas, high-converting.",
          tutorial:
            "Isi [PRODUK] dan [TARGET]. Tambahkan harga, bonus, testimoni, dan keunggulan produk. Prompt ini cocok untuk website jualan, pre-order, dan promosi digital."
        },
        {
          status: PromptStatus.VIP,
          title: "Script Video Viral VIP",
          category: "Konten VIP",
          content:
            "Buat script video pendek berdurasi 45 detik untuk topik [TOPIK]. Gunakan formula hook 3 detik, konflik, insight, contoh, punchline, dan CTA. Buat 5 variasi hook yang kuat dan 3 versi closing. Gaya bahasa: natural, engaging, mudah viral.",
          tutorial:
            "Ganti [TOPIK] dengan tema konten. Pilih hook terbaik. Uji beberapa versi opening agar retention video lebih kuat."
        },
        {
          status: PromptStatus.VIP,
          title: "Prompt Image Brand Campaign",
          category: "Gambar VIP",
          content:
            "Create a premium brand campaign visual for [BRAND/PRODUCT], luxury composition, cinematic commercial photography, realistic texture, elegant lighting, refined color palette, high-end advertising, ultra detailed, 8K, shallow depth of field, clean background, professional studio setup.",
          tutorial:
            "Isi brand/produk, warna brand, target mood, dan platform penggunaan. Cocok untuk poster, ads, dan katalog produk."
        }
      ]
    });
  }

  const mediaCount = await prisma.media.count();
  if (mediaCount === 0) {
    await prisma.media.createMany({
      data: [
        { type: MediaType.PHOTO, title: "Foto Prompt 1", filename: "foto1.jpg", url: "/images/foto1.jpg" },
        { type: MediaType.PHOTO, title: "Foto Prompt 2", filename: "foto2.jpg", url: "/images/foto2.jpg" },
        { type: MediaType.PHOTO, title: "Foto Prompt 3", filename: "foto3.jpg", url: "/images/foto3.jpg" },
        { type: MediaType.PHOTO, title: "Foto Prompt 4", filename: "foto4.jpg", url: "/images/foto4.jpg" },
        { type: MediaType.FILE, title: "Template Prompt Konten", filename: "template-prompt-konten.txt", url: "/files/template-prompt-konten.txt" },
        { type: MediaType.FILE, title: "Checklist Prompt Bisnis", filename: "checklist-prompt-bisnis.pdf", url: "/files/checklist-prompt-bisnis.pdf" },
        { type: MediaType.FILE, title: "Panduan Prompt Gambar", filename: "panduan-prompt-gambar.pdf", url: "/files/panduan-prompt-gambar.pdf" }
      ]
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
