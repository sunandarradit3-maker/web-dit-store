"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type PromptStatus = "FREE" | "VIP";
type MediaType = "PHOTO" | "FILE";

type Prompt = {
  id: string;
  title: string;
  category: string;
  content: string;
  tutorial: string;
  status: PromptStatus;
  createdAt?: string;
};

type Media = {
  id: string;
  title: string;
  filename: string;
  url: string;
  type: MediaType;
};

type Stats = {
  freePrompts: number;
  vipPrompts: number;
  photos: number;
  files: number;
  vipUsers: number;
};

const WA_LINK = "https://wa.me/6287739435496?text=Halo%20admin%20DiTz%20Prompt,%20saya%20ingin%20beli%20akses%20VIP.";
const initialStats: Stats = { freePrompts: 0, vipPrompts: 0, photos: 0, files: 0, vipUsers: 0 };

export default function DitzPromptApp() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [vipAccess, setVipAccess] = useState(false);
  const [freeSearch, setFreeSearch] = useState("");
  const [vipSearch, setVipSearch] = useState("");
  const [freeCategory, setFreeCategory] = useState("Semua Kategori");
  const [vipCategory, setVipCategory] = useState("Semua Kategori");
  const [vipCode, setVipCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "error" | "">("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [tutorialPrompt, setTutorialPrompt] = useState<Prompt | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState("dashboard");
  const [stats, setStats] = useState<Stats>(initialStats);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: "bot" | "user"; text: string }[]>([]);
  const [chatText, setChatText] = useState("");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [adminLoginMessage, setAdminLoginMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  async function refreshPublicData() {
    const [promptRes, mediaRes, vipRes] = await Promise.all([
      fetch("/api/prompts", { cache: "no-store" }),
      fetch("/api/media", { cache: "no-store" }),
      fetch("/api/vip", { cache: "no-store" })
    ]);
    const promptData = await promptRes.json();
    const mediaData = await mediaRes.json();
    const vipData = await vipRes.json();
    setPrompts(promptData.prompts ?? []);
    setMedia(mediaData.media ?? []);
    setVipAccess(Boolean(vipData.vipAccess));
  }

  async function refreshAdminData() {
    const [promptsRes, mediaRes, statsRes] = await Promise.all([
      fetch("/api/admin/prompts", { cache: "no-store" }),
      fetch("/api/media", { cache: "no-store" }),
      fetch("/api/admin/stats", { cache: "no-store" })
    ]);
    if (promptsRes.ok) {
      const promptData = await promptsRes.json();
      setPrompts(promptData.prompts ?? []);
      const mediaData = await mediaRes.json();
      setMedia(mediaData.media ?? []);
      const statsData = await statsRes.json();
      setStats(statsData);
    }
  }

  useEffect(() => {
    refreshPublicData().catch(() => showToast("Gagal memuat data. Cek koneksi database."));
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(""), 2400);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);

  function showToast(text: string) {
    setToast(text);
  }

  const freePrompts = useMemo(() => {
    return prompts
      .filter((p) => p.status === "FREE")
      .filter((p) => freeCategory === "Semua Kategori" || p.category === freeCategory)
      .filter((p) => `${p.title} ${p.category} ${p.content}`.toLowerCase().includes(freeSearch.toLowerCase()));
  }, [prompts, freeSearch, freeCategory]);

  const vipPrompts = useMemo(() => {
    return prompts
      .filter((p) => p.status === "VIP")
      .filter((p) => vipCategory === "Semua Kategori" || p.category === vipCategory)
      .filter((p) => `${p.title} ${p.category} ${p.content}`.toLowerCase().includes(vipSearch.toLowerCase()));
  }, [prompts, vipSearch, vipCategory]);

  const freeCategories = useMemo(() => ["Semua Kategori", ...Array.from(new Set(prompts.filter((p) => p.status === "FREE").map((p) => p.category)))], [prompts]);
  const vipCategories = useMemo(() => ["Semua Kategori", ...Array.from(new Set(prompts.filter((p) => p.status === "VIP").map((p) => p.category)))], [prompts]);
  const photos = media.filter((item) => item.type === "PHOTO");
  const files = media.filter((item) => item.type === "FILE");

  async function copyPrompt(text: string) {
    await navigator.clipboard.writeText(text);
    showToast("Prompt berhasil disalin.");
  }

  async function unlockVip() {
    setMessage("");
    const res = await fetch("/api/vip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: vipCode })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Kode VIP salah.");
      setMessageType("error");
      return;
    }
    setMessage(data.message ?? "VIP terbuka.");
    setMessageType("ok");
    setVipCode("");
    await refreshPublicData();
    showToast("Akses VIP aktif.");
  }

  async function lockVip() {
    await fetch("/api/vip", { method: "DELETE" });
    await refreshPublicData();
    setMessage("Akses VIP dikunci lagi.");
    setMessageType("");
  }

  async function adminLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAdminLoginMessage(data.error ?? "Login gagal.");
      return;
    }
    setLoginOpen(false);
    setAdminOpen(true);
    setAdminLoginMessage("");
    await refreshAdminData();
  }

  async function adminLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdminOpen(false);
    showToast("Admin logout.");
  }

  async function savePrompt(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      category: String(form.get("category") ?? ""),
      status: String(form.get("status") ?? "FREE") as PromptStatus,
      content: String(form.get("content") ?? ""),
      tutorial: String(form.get("tutorial") ?? "")
    };
    const endpoint = editingPrompt ? `/api/admin/prompts/${editingPrompt.id}` : "/api/admin/prompts";
    const res = await fetch(endpoint, {
      method: editingPrompt ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error ?? "Gagal menyimpan prompt.");
      return;
    }
    setEditingPrompt(null);
    (e.target as HTMLFormElement).reset();
    await refreshAdminData();
    showToast("Prompt berhasil disimpan.");
  }

  async function deletePrompt(id: string) {
    if (!confirm("Hapus prompt ini?")) return;
    const res = await fetch(`/api/admin/prompts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      showToast("Gagal menghapus prompt.");
      return;
    }
    await refreshAdminData();
    showToast("Prompt dihapus.");
  }

  async function uploadMedia(e: FormEvent<HTMLFormElement>, type: MediaType) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("type", type);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error ?? "Gagal upload media. Cek BLOB_READ_WRITE_TOKEN.");
      return;
    }
    (e.target as HTMLFormElement).reset();
    await refreshAdminData();
    showToast(type === "PHOTO" ? "Foto berhasil diupload." : "File berhasil diupload.");
  }

  async function deleteMedia(id: string) {
    if (!confirm("Hapus media ini?")) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (!res.ok) {
      showToast("Gagal menghapus media.");
      return;
    }
    await refreshAdminData();
    showToast("Media dihapus.");
  }

  async function toggleMusic() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      try {
        await audioRef.current.play();
        setMusicPlaying(true);
      } catch {
        showToast("Musik belum bisa diputar. Cek file /music/music.mp3.");
      }
    } else {
      audioRef.current.pause();
      setMusicPlaying(false);
    }
  }

  function openChat() {
    setChatOpen(true);
    if (chatMessages.length === 0) {
      setChatMessages([{ sender: "bot", text: "Halo! Aku DiTz Assistant. Mau cari prompt, tutorial, atau beli VIP?" }]);
    }
  }

  function botReply(text: string) {
    const q = text.toLowerCase();
    if (q.includes("cara beli") || q.includes("beli vip") || q.includes("pembayaran") || q.includes("order")) return "Untuk membeli akses VIP, silakan hubungi WhatsApp admin di 087739435496. Setelah pembayaran selesai, admin akan memberikan kode VIP untuk membuka prompt premium.";
    if (q.includes("kode vip") || q.includes("kode")) return "Kode VIP diberikan setelah pembayaran berhasil. Silakan hubungi admin melalui WhatsApp.";
    if (q.includes("cara pakai") || q.includes("pakai prompt") || q.includes("tutorial")) return "Pilih prompt yang kamu inginkan, klik tombol Copy Prompt, lalu tempelkan ke AI seperti ChatGPT, Gemini, Claude, atau AI lainnya. Kamu juga bisa mengikuti tutorial yang tersedia.";
    if (q.includes("support") || q.includes("email") || q.includes("kontak")) return "Kamu bisa menghubungi email support DiTz Prompt di ditzstoreofficial@gmail.com.";
    if (q.includes("apa itu prompt vip") || q.includes("vip")) return "Prompt VIP adalah prompt premium yang lebih detail, rapi, dan profesional. Aksesnya dibuka menggunakan kode VIP setelah pembelian.";
    if (q.includes("kurang bagus") || q.includes("hasil ai") || q.includes("jelek")) return "Biasanya hasil AI kurang bagus karena instruksi terlalu umum. Tambahkan detail tujuan, gaya bahasa, target audiens, format output, contoh hasil, dan batasan yang jelas.";
    if (q.includes("copy") || q.includes("salin")) return "Untuk copy prompt, pilih prompt yang kamu mau lalu klik tombol Copy Prompt. Setelah itu paste ke aplikasi AI favorit kamu.";
    if (q.includes("hubungi admin") || q.includes("admin")) return "Kamu bisa menghubungi admin melalui WhatsApp 087739435496 atau tombol Beli VIP Sekarang di website.";
    if (q.includes("prompt cocok") || q.includes("pilih prompt") || q.includes("rekomendasi")) return "Sebutkan kebutuhan kamu, misalnya konten TikTok, caption Instagram, gambar AI, deskripsi produk, atau landing page. Aku akan bantu arahkan prompt yang paling cocok.";
    return "Aku DiTz Assistant. Aku bisa membantu memilih prompt, menjelaskan cara pakai prompt, membedakan prompt gratis dan VIP, serta membantu cara membeli VIP.";
  }

  function sendChat(text: string) {
    const value = text.trim();
    if (!value) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: value }, { sender: "bot", text: botReply(value) }]);
    setChatText("");
  }

  const navItems = [
    ["Home", "#home"], ["Prompt Gratis", "#gratis"], ["Prompt VIP", "#vip"], ["Tutorial", "#tutorial"], ["Galeri", "#galeri"], ["File Download", "#download"], ["Bantuan Bot", "#bot"], ["Kontak", "#kontak"]
  ];

  return (
    <>
      <header className="navbar">
        <div className="container navWrap">
          <a className="brand" href="#home"><span className="brandMark">DP</span><span>DiTz Prompt</span></a>
          <button className="mobileMenuBtn" onClick={() => setMenuOpen((v) => !v)} aria-label="Buka menu">☰</button>
          <nav className={`navLinks ${menuOpen ? "active" : ""}`}>
            {navItems.map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
            <button onClick={() => setLoginOpen(true)}>Login Admin</button>
          </nav>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="container heroGrid">
            <div>
              <span className="badge">✨ Platform prompt modern & premium</span>
              <h1><span className="gradientText">DiTz Prompt</span></h1>
              <p>Kumpulan prompt terbaik untuk hasil AI yang lebih keren, rapi, dan profesional.</p>
              <div className="heroActions">
                <a className="btn btnPrimary" href="#gratis">Lihat Prompt</a>
                <a className="btn btnAccent" href={WA_LINK} target="_blank" rel="noopener noreferrer">Beli VIP</a>
                <button className="btn btnGhost" onClick={openChat}>Chat Bantuan</button>
              </div>
            </div>
            <aside className="heroCard">
              <span className="tag vip">VIP Ready</span>
              <h2>Prompt siap pakai untuk kreator, bisnis, dan AI image.</h2>
              <p>Pilih prompt, salin, lalu gunakan di ChatGPT, Gemini, Claude, atau AI lainnya.</p>
              <div className="miniStatGrid">
                <MiniStat label="Prompt Gratis" value={prompts.filter((p) => p.status === "FREE").length} />
                <MiniStat label="Prompt VIP" value={prompts.filter((p) => p.status === "VIP").length} />
                <MiniStat label="Foto Galeri" value={photos.length} />
                <MiniStat label="File Download" value={files.length} />
              </div>
              <div className="musicBox">
                <div className="musicRow">
                  <div><strong>Musik Website</strong><p>File: /music/music.mp3</p></div>
                  <button className="btn btnGhost btnSmall" onClick={toggleMusic}>{musicPlaying ? "⏸ Pause" : "▶ Play"}</button>
                </div>
                <audio ref={audioRef} controls preload="none" onPlay={() => setMusicPlaying(true)} onPause={() => setMusicPlaying(false)}>
                  <source src="/music/music.mp3" type="audio/mpeg" />
                </audio>
              </div>
            </aside>
          </div>
        </section>

        <section className="section" id="gratis">
          <div className="container">
            <SectionTitle title="Prompt Gratis" description="Bisa dilihat semua pengunjung. Klik copy untuk langsung memakai prompt." />
            <div className="filterRow">
              <input className="input" value={freeSearch} onChange={(e) => setFreeSearch(e.target.value)} placeholder="Cari prompt gratis..." />
              <select className="select" value={freeCategory} onChange={(e) => setFreeCategory(e.target.value)}>{freeCategories.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <div className="grid grid3">{freePrompts.length ? freePrompts.map((p) => <PromptCard key={p.id} prompt={p} onCopy={copyPrompt} onTutorial={setTutorialPrompt} />) : <EmptyCard text="Prompt gratis belum tersedia." />}</div>
          </div>
        </section>

        <section className="section" id="vip">
          <div className="container">
            <div className="sectionTitle">
              <div><h2>Prompt VIP</h2><p>Prompt premium hanya bisa dibuka dengan kode VIP. Akses disimpan di cookie HTTP-only.</p></div>
              <a className="btn btnAccent" href={WA_LINK} target="_blank" rel="noopener noreferrer">Beli VIP Sekarang</a>
            </div>
            {!vipAccess && <div className="vipGate">
              <div><h3>Masukkan Kode VIP</h3><p>Hubungi admin WhatsApp 087739435496 untuk membeli akses VIP.</p></div>
              <div className="vipCodeRow">
                <input className="input" type="password" value={vipCode} onChange={(e) => setVipCode(e.target.value)} placeholder="Kode VIP" />
                <button className="btn btnPrimary" onClick={unlockVip}>Buka VIP</button>
                {message && <div className={`message ${messageType}`}>{message}</div>}
              </div>
            </div>}
            {vipAccess && <div className="filterRow">
              <input className="input" value={vipSearch} onChange={(e) => setVipSearch(e.target.value)} placeholder="Cari prompt VIP..." />
              <select className="select" value={vipCategory} onChange={(e) => setVipCategory(e.target.value)}>{vipCategories.map((c) => <option key={c}>{c}</option>)}</select>
              <button className="btn btnGhost" onClick={lockVip}>Kunci Lagi</button>
            </div>}
            <div className="grid grid3">
              {vipAccess ? (vipPrompts.length ? vipPrompts.map((p) => <PromptCard key={p.id} prompt={p} vip onCopy={copyPrompt} onTutorial={setTutorialPrompt} />) : <EmptyCard text="Prompt VIP belum tersedia." />) : <LockedVipCard />}
            </div>
          </div>
        </section>

        <TutorialSection />
        <GallerySection photos={photos} />
        <DownloadSection files={files} />

        <section className="section" id="bot">
          <div className="container">
            <div className="sectionTitle"><div><h2>Bantuan Bot</h2><p>DiTz Assistant siap membantu memilih prompt, tutorial, dan pembelian VIP.</p></div><button className="btn btnPrimary" onClick={openChat}>Buka DiTz Assistant</button></div>
            <div className="grid grid3"><InfoCard title="Pilih Prompt" text="Bot dapat menyarankan prompt untuk konten, bisnis, gambar, caption, dan kebutuhan AI lainnya." /><InfoCard title="Tutorial Cepat" text="Bot menjelaskan cara copy, paste, edit, dan optimasi prompt agar hasil AI makin bagus." /><InfoCard title="Beli VIP" text="Bot mengarahkan pembelian VIP ke WhatsApp admin resmi DiTz Prompt." /></div>
          </div>
        </section>

        <section className="section" id="kontak">
          <div className="container">
            <SectionTitle title="Kontak" description="Butuh bantuan, pembelian VIP, atau support? Hubungi kontak resmi berikut." />
            <div className="contactGrid">
              <InfoCard title="ditzstoreofficial@gmail.com" text="Email support untuk pertanyaan, kendala akses, atau permintaan bantuan." tag="Email Support" />
              <article className="card"><span className="tag vip">WhatsApp VIP</span><h3>087739435496</h3><p>Pembelian prompt VIP dan kode akses premium.</p><br /><a className="btn btnAccent" href={WA_LINK} target="_blank" rel="noopener noreferrer">Beli VIP Sekarang</a></article>
              <InfoCard title="Catatan Produksi" text="Data admin, password, dan kode VIP disimpan di env/backend, bukan di JavaScript frontend." tag="Keamanan" />
            </div>
          </div>
        </section>
      </main>

      <footer><div className="container footerWrap"><p>© {new Date().getFullYear()} DiTz Prompt. All rights reserved.</p><p>Support: ditzstoreofficial@gmail.com • WhatsApp: 087739435496</p></div></footer>

      {loginOpen && <Modal onClose={() => setLoginOpen(false)} title="Login Admin" subtitle="Masuk untuk mengelola prompt, foto, dan file.">
        <form onSubmit={adminLogin} className="formStack">
          <input className="input" name="email" type="email" placeholder="Email admin" required />
          <input className="input" name="password" type="password" placeholder="Password admin" required />
          <button className="btn btnPrimary" type="submit">Login</button>
          {adminLoginMessage && <div className="message error">{adminLoginMessage}</div>}
          <p className="muted">Kredensial dibaca dari environment variable server, bukan dari frontend.</p>
        </form>
      </Modal>}

      {tutorialPrompt && <Modal onClose={() => setTutorialPrompt(null)} title={tutorialPrompt.title} subtitle={tutorialPrompt.category}><div className="promptBody">{tutorialPrompt.tutorial}</div></Modal>}

      {adminOpen && <AdminPanel
        tab={adminTab}
        setTab={setAdminTab}
        stats={stats}
        prompts={prompts}
        photos={photos}
        files={files}
        editingPrompt={editingPrompt}
        setEditingPrompt={setEditingPrompt}
        savePrompt={savePrompt}
        deletePrompt={deletePrompt}
        uploadMedia={uploadMedia}
        deleteMedia={deleteMedia}
        close={() => setAdminOpen(false)}
        logout={adminLogout}
      />}

      <button className="chatToggle" onClick={() => chatOpen ? setChatOpen(false) : openChat()} aria-label="Buka DiTz Assistant">💬</button>
      {chatOpen && <aside className="chatWidget">
        <div className="chatHead"><div><strong>DiTz Assistant</strong><div className="chatStatus">Online • siap membantu</div></div><button className="closeBtn" onClick={() => setChatOpen(false)}>✕</button></div>
        <div className="chatMessages">{chatMessages.map((m, i) => <div className={`bubble ${m.sender}`} key={i}>{m.text}</div>)}</div>
        <div className="quickQuestions">{["Cara beli VIP?", "Cara pakai prompt?", "Apa itu prompt VIP?", "Kenapa hasil AI saya kurang bagus?", "Bagaimana cara copy prompt?", "Hubungi admin"].map((q) => <button key={q} onClick={() => sendChat(q)}>{q}</button>)}</div>
        <form className="chatForm" onSubmit={(e) => { e.preventDefault(); sendChat(chatText); }}><input className="input" value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Tulis pertanyaan..." /><button className="btn btnPrimary btnSmall" type="submit">Kirim</button></form>
      </aside>}

      {toast && <div className="toast active">{toast}</div>}
    </>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <div className="sectionTitle"><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="miniStat"><strong>{value}</strong><span>{label}</span></div>;
}

function PromptCard({ prompt, vip, onCopy, onTutorial }: { prompt: Prompt; vip?: boolean; onCopy: (text: string) => void; onTutorial: (prompt: Prompt) => void }) {
  return <article className="card"><span className={`tag ${vip ? "vip" : ""}`}>{prompt.category}</span><h3>{prompt.title}</h3><div className="promptBody">{prompt.content}</div><div className="promptActions"><button className="btn btnPrimary btnSmall" onClick={() => onCopy(prompt.content)}>Copy Prompt</button><button className="btn btnGhost btnSmall" onClick={() => onTutorial(prompt)}>Lihat Tutorial</button></div></article>;
}

function EmptyCard({ text }: { text: string }) {
  return <div className="card"><p>{text}</p></div>;
}

function LockedVipCard() {
  return <div className="card"><span className="tag vip">Terkunci</span><h3>Prompt VIP belum terbuka</h3><p>Masukkan kode VIP yang benar atau beli akses melalui WhatsApp.</p><br /><a className="btn btnAccent" href={WA_LINK} target="_blank" rel="noopener noreferrer">Beli VIP Sekarang</a></div>;
}

function InfoCard({ title, text, tag = "Info" }: { title: string; text: string; tag?: string }) {
  return <article className="card"><span className="tag">{tag}</span><h3>{title}</h3><p>{text}</p></article>;
}

function TutorialSection() {
  const items = [
    ["Dasar", "Cara menggunakan prompt", ["Pilih prompt sesuai kebutuhan.", "Klik tombol copy.", "Buka aplikasi AI.", "Paste prompt.", "Edit bagian yang diperlukan.", "Kirim ke AI."]],
    ["Tips", "Tips agar hasil AI bagus", ["Gunakan instruksi yang jelas.", "Tambahkan detail yang lengkap.", "Jelaskan gaya bahasa yang diinginkan.", "Berikan contoh hasil yang diinginkan.", "Gunakan prompt VIP untuk hasil lebih profesional."]],
    ["Gambar", "Tutorial prompt gambar", ["Jelaskan subjek, style, warna, dan suasana.", "Tambahkan kualitas seperti cinematic, ultra detail, realistic, 4K, dramatic lighting.", "Tambahkan komposisi, angle kamera, dan mood."]],
    ["Bisnis", "Tutorial prompt bisnis", ["Jelaskan produk.", "Jelaskan target pembeli.", "Jelaskan gaya promosi.", "Jelaskan platform yang digunakan."]],
    ["Konten", "Tutorial prompt konten", ["Ide konten TikTok.", "Caption Instagram.", "Script video pendek.", "Bio akun.", "Deskripsi produk."]]
  ];
  return <section className="section" id="tutorial"><div className="container"><SectionTitle title="Tutorial Prompt" description="Ikuti panduan berikut supaya hasil AI lebih rapi, detail, dan sesuai kebutuhan." /><div className="tutorialList">{items.map(([tag, title, list]) => <article className="card" key={String(title)}><span className="tag">{String(tag)}</span><h3>{String(title)}</h3><ul>{(list as string[]).map((item) => <li key={item}>{item}</li>)}</ul></article>)}<article className="card"><span className="tag vip">VIP</span><h3>Perbedaan gratis dan VIP</h3><p>Prompt gratis cocok untuk kebutuhan umum. Prompt VIP lebih detail, terstruktur, dan dirancang untuk hasil yang lebih profesional.</p></article></div></div></section>;
}

function GallerySection({ photos }: { photos: Media[] }) {
  return <section className="section" id="galeri"><div className="container"><SectionTitle title="Galeri Foto" description="Foto dari database media. Upload admin disimpan di Vercel Blob, lalu URL-nya disimpan di database." /><div className="grid grid4">{photos.length ? photos.map((photo) => <article className="card galleryCard" key={photo.id}><img className="galleryImg" src={photo.url} alt={photo.title} /><div className="galleryMeta"><span className="tag">{photo.filename}</span><h3>{photo.title}</h3></div></article>) : <EmptyCard text="Belum ada foto." />}</div></div></section>;
}

function DownloadSection({ files }: { files: Media[] }) {
  return <section className="section" id="download"><div className="container"><SectionTitle title="File Download" description="Daftar file dari database. File fisik tersimpan di Vercel Blob agar cocok untuk Vercel hosting." /><div className="grid grid3">{files.length ? files.map((file) => <article className="card fileCard" key={file.id}><div className="fileInfo"><div className="fileIcon">📁</div><div><h3>{file.title}</h3><p>{file.filename}</p></div></div><a className="btn btnPrimary btnSmall" href={file.url} download>Download</a></article>) : <EmptyCard text="Belum ada file." />}</div></div></section>;
}

function Modal({ title, subtitle, children, onClose }: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modalHead"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="closeBtn" onClick={onClose}>✕</button></div>{children}</div></div>;
}

function AdminPanel(props: {
  tab: string;
  setTab: (tab: string) => void;
  stats: Stats;
  prompts: Prompt[];
  photos: Media[];
  files: Media[];
  editingPrompt: Prompt | null;
  setEditingPrompt: (prompt: Prompt | null) => void;
  savePrompt: (e: FormEvent<HTMLFormElement>) => void;
  deletePrompt: (id: string) => void;
  uploadMedia: (e: FormEvent<HTMLFormElement>, type: MediaType) => void;
  deleteMedia: (id: string) => void;
  close: () => void;
  logout: () => void;
}) {
  const { tab, setTab, stats, prompts, photos, files, editingPrompt, setEditingPrompt, savePrompt, deletePrompt, uploadMedia, deleteMedia, close, logout } = props;
  const promptKey = editingPrompt?.id ?? "new";
  const tabs = [["dashboard", "Dashboard"], ["prompts", "Kelola Prompt"], ["photos", "Upload Foto"], ["files", "Upload File"], ["lists", "Daftar Konten"]];
  return <section className="adminPanel"><div className="container"><div className="adminTop"><div><h1>Dashboard Admin</h1><p>Kelola konten DiTz Prompt.</p></div><div className="buttonRow"><button className="btn btnGhost" onClick={close}>Lihat Website</button><button className="btn btnDanger" onClick={logout}>Logout Admin</button></div></div><div className="statGrid"><StatCard label="Prompt Gratis" value={stats.freePrompts} /><StatCard label="Prompt VIP" value={stats.vipPrompts} /><StatCard label="Total Foto" value={stats.photos} /><StatCard label="Total File" value={stats.files} /><StatCard label="User Buka VIP" value={stats.vipUsers} /></div><div className="adminLayout"><aside className="card adminMenu">{tabs.map(([id, label]) => <button key={id} className={`btn ${tab === id ? "btnPrimary" : "btnGhost"}`} onClick={() => setTab(id)}>{label}</button>)}</aside><div>
    {tab === "dashboard" && <div className="card"><h2>Ringkasan</h2><p>Data prompt dan metadata media tersimpan di PostgreSQL. File upload disimpan di Vercel Blob. Akses admin memakai cookie HTTP-only.</p></div>}
    {tab === "prompts" && <div className="card"><h2>{editingPrompt ? "Edit Prompt" : "Upload Prompt"}</h2><form key={promptKey} onSubmit={savePrompt} className="formStack"><input className="input" name="title" placeholder="Judul prompt" defaultValue={editingPrompt?.title ?? ""} required /><input className="input" name="category" placeholder="Kategori prompt" defaultValue={editingPrompt?.category ?? ""} required /><select className="select" name="status" defaultValue={editingPrompt?.status ?? "FREE"}><option value="FREE">Gratis</option><option value="VIP">VIP</option></select><textarea className="textarea" name="content" placeholder="Isi prompt" defaultValue={editingPrompt?.content ?? ""} required /><textarea className="textarea" name="tutorial" placeholder="Tutorial untuk prompt ini" defaultValue={editingPrompt?.tutorial ?? ""} required /><div className="buttonRow"><button className="btn btnPrimary" type="submit">Simpan Prompt</button><button className="btn btnGhost" type="button" onClick={() => setEditingPrompt(null)}>Reset Form</button></div></form></div>}
    {tab === "photos" && <div className="card"><h2>Upload Foto</h2><form onSubmit={(e) => uploadMedia(e, "PHOTO")} className="formStack"><input className="input" name="title" placeholder="Judul/nama foto" required /><input className="input" name="file" type="file" accept="image/*" required /><button className="btn btnPrimary" type="submit">Simpan Foto</button><p className="muted">File masuk ke Vercel Blob, metadata masuk database.</p></form></div>}
    {tab === "files" && <div className="card"><h2>Upload File</h2><form onSubmit={(e) => uploadMedia(e, "FILE")} className="formStack"><input className="input" name="title" placeholder="Judul/nama file" required /><input className="input" name="file" type="file" required /><button className="btn btnPrimary" type="submit">Simpan File</button><p className="muted">File masuk ke Vercel Blob, metadata masuk database.</p></form></div>}
    {tab === "lists" && <div className="grid"><AdminPromptTable title="Daftar Prompt Gratis" prompts={prompts.filter((p) => p.status === "FREE")} setEditingPrompt={setEditingPrompt} deletePrompt={deletePrompt} setTab={setTab} /><AdminPromptTable title="Daftar Prompt VIP" prompts={prompts.filter((p) => p.status === "VIP")} setEditingPrompt={setEditingPrompt} deletePrompt={deletePrompt} setTab={setTab} /><MediaTable title="Daftar Foto" items={photos} deleteMedia={deleteMedia} /><MediaTable title="Daftar File" items={files} deleteMedia={deleteMedia} /></div>}
  </div></div></div></section>;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="statCard"><strong>{value}</strong><span>{label}</span></div>;
}

function AdminPromptTable({ title, prompts, setEditingPrompt, deletePrompt, setTab }: { title: string; prompts: Prompt[]; setEditingPrompt: (prompt: Prompt) => void; deletePrompt: (id: string) => void; setTab: (tab: string) => void }) {
  return <div className="card"><h2>{title}</h2><div className="tableWrap"><table className="adminTable"><thead><tr><th>Judul/Kategori</th><th>Isi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{prompts.length ? prompts.map((p) => <tr key={p.id}><td><strong>{p.title}</strong><br />{p.category}</td><td>{p.content.slice(0, 150)}...</td><td><span className={`tag ${p.status === "VIP" ? "vip" : ""}`}>{p.status === "VIP" ? "VIP" : "Gratis"}</span></td><td><div className="tableActions"><button className="btn btnGhost btnSmall" onClick={() => { setEditingPrompt(p); setTab("prompts"); }}>Edit</button><button className="btn btnDanger btnSmall" onClick={() => deletePrompt(p.id)}>Hapus</button></div></td></tr>) : <tr><td colSpan={4}>Belum ada prompt.</td></tr>}</tbody></table></div></div>;
}

function MediaTable({ title, items, deleteMedia }: { title: string; items: Media[]; deleteMedia: (id: string) => void }) {
  return <div className="card"><h2>{title}</h2><div className="tableWrap"><table className="adminTable"><thead><tr><th>Judul</th><th>File</th><th>Aksi</th></tr></thead><tbody>{items.length ? items.map((item) => <tr key={item.id}><td>{item.title}</td><td>{item.filename}</td><td><button className="btn btnDanger btnSmall" onClick={() => deleteMedia(item.id)}>Hapus</button></td></tr>) : <tr><td colSpan={3}>Belum ada media.</td></tr>}</tbody></table></div></div>;
}
