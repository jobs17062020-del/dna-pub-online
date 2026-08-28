// Style: Midnight Operations Console — mobile-first vertical flow, ink surfaces, signal mint status, and no viewport-locking wrappers.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Camera,
  Check,
  Clock3,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Image as ImageIcon,
  LockKeyhole,
  ScanLine,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Entry = { id: string; last4: string; image?: string; imageHash?: string; createdAt: string };
const STORAGE_KEY = "dna-pub-vip-records-v2";
const assetBase = import.meta.env.PROD ? "/dna-pub-online/" : "/";
const cycleStart = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(6, 0, 0, 0);
  if (now < start) start.setDate(start.getDate() - 1);
  return start.toISOString().slice(0, 10);
};
const formatTime = (iso: string) => new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const fingerprintImage = async (dataUrl: string) => {
  const raw = atob(dataUrl.split(",")[1] || "");
  const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
const download = (content: BlobPart, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [manual, setManual] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = cycleStart();

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { setEntries([]); }
  }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }, [entries]);

  const current = useMemo(() => entries.filter((e) => e.createdAt.slice(0, 10) >= today), [entries, today]);
  const addEntry = async (last4: string, image?: string, imageHash?: string) => {
    const value = last4.replace(/\D/g, "").slice(-4);
    if (value.length !== 4) { toast.error("กรุณาระบุเลข 4 ตัวท้ายให้ครบ"); return false; }
    if (current.length >= 100) { toast.error("รอบนี้ครบ 100 เคสแล้ว"); return false; }
    if (current.some((entry) => entry.last4 === value)) { toast.error(`บันทึกไม่ได้: เลข ${value} มีอยู่แล้วในรอบนี้`); return false; }
    const resolvedHash = imageHash || (image ? await fingerprintImage(image) : undefined);
    if (resolvedHash) {
      for (const entry of current.filter((item) => item.image)) {
        const existingHash = entry.imageHash || await fingerprintImage(entry.image!);
        if (existingHash === resolvedHash) { toast.error("บันทึกไม่ได้: ภาพนี้มีอยู่แล้วในรอบนี้"); return false; }
      }
    }
    const next = { id: crypto.randomUUID(), last4: value, image, imageHash: resolvedHash, createdAt: new Date().toISOString() };
    setEntries((all) => [next, ...all]); setManual(""); setNotice(`บันทึกข้อมูลสำเร็จ เวลา ${formatTime(next.createdAt)} น.`); toast.success("บันทึกข้อมูลสำเร็จ");
    window.setTimeout(() => setNotice(null), 4800);
    return true;
  };
  const scan = async (file: File) => {
    const image = await new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsDataURL(file); });
    const imageHash = await fingerprintImage(image);
    const duplicateImage = current.some((entry) => entry.imageHash === imageHash);
    if (duplicateImage) { toast.error("บันทึกไม่ได้: ภาพนี้มีอยู่แล้วในรอบนี้"); return; }
    let found = "";
    const engine = (window as typeof window & { Tesseract?: { recognize: (img: string, lang: string) => Promise<{ data: { text: string } }> } }).Tesseract;
    if (engine) { try { const result = await engine.recognize(image, "eng"); found = result.data.text.replace(/\D/g, "").slice(-4); } catch { /* manual fallback below */ } }
    if (found.length === 4) await addEntry(found, image, imageHash); else { setPreview(image); toast.info("อ่านเลขไม่ครบ กรุณาตรวจสอบแล้วกรอกเลข 4 ตัวท้ายด้วยตนเอง"); }
  };
  const exportCsv = () => download(["เลข 4 ตัวท้าย,เวลา\n", ...entries.map((e) => `${e.last4},${new Date(e.createdAt).toLocaleString("th-TH")}`)].join("\n"), `dna-pub-${today}.csv`, "text/csv;charset=utf-8");
  const exportJson = () => download(JSON.stringify(entries, null, 2), `dna-pub-${today}.json`, "application/json");
  const exportImage = () => { const c = document.createElement("canvas"); c.width = 1200; c.height = 630; const x = c.getContext("2d")!; x.fillStyle = "#0b1026"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = "#5de4c7"; x.font = "700 28px sans-serif"; x.fillText("DNA PUB · VIP 10-DAYS TRACKER", 70, 90); x.fillStyle = "#f8fafc"; x.font = "800 72px monospace"; x.fillText(`${current.length} / 100`, 70, 220); x.font = "400 28px sans-serif"; x.fillStyle = "#b8c2dc"; x.fillText(`บันทึกในรอบนี้ · ${today}`, 70, 275); c.toBlob((b) => b && download(b, `dna-pub-${today}.png`, "image/png")); };
  const share = async () => { const text = `DNA PUB\nบันทึกแล้ว ${current.length}/100 เคส\nรอบวันที่ ${today}`; if (navigator.share) await navigator.share({ title: "DNA PUB", text }); else { await navigator.clipboard.writeText(text); toast.success("คัดลอกสรุปข้อมูลแล้ว"); } };

  return <main className="app-shell">
    <div className="ambient ambient-top" style={{ backgroundImage: `url(${assetBase}assets/dna-pub-signal-texture.webp)` }} />
    <div className="container page-flow">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark"><img src={`${assetBase}assets/dna-pub-mark.png`} alt="DNA PUB" /></div><div><div className="eyebrow"><span className="signal-dot" /> DNA VIP DATABASE</div><h1>DNA PUB</h1><p>ระบบตรวจสอบสิทธิ์วันเกิด · รอบละ 10 วัน</p></div></div>
        <div className="privacy-pill"><LockKeyhole size={15} />ข้อมูลอยู่ในเครื่องนี้<br /><strong>ไม่ส่งออกอัตโนมัติ</strong></div>
      </header>

      <section className="hero-grid">
        <label className="scan-card" htmlFor="birth-photo">
          <div className="scan-art"><ScanLine size={28} /><span className="scan-motif">DNA</span></div><div className="section-kicker">01 · SCAN & SAVE</div><h2>ถ่ายรูปหรือเลือกภาพวันเกิด</h2><p>ระบบจะบีบอัดภาพแบบ HD และพยายามอ่านเลข 4 ตัวท้ายให้โดยอัตโนมัติ</p><span className="action-link"><Upload size={16} /> แตะเพื่อเปิดกล้องหรือเลือกจากเครื่อง</span><input ref={fileRef} id="birth-photo" type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && scan(e.target.files[0])} />
        </label>
        <section className="monitor-card"><div className="card-head"><div><div className="section-kicker">SHIFT MONITOR</div><p>บันทึกแล้วในรอบนี้</p></div><Database size={22} /></div><div className="countline"><strong>{current.length}</strong><span>/ 100 เคส</span></div><div className="progress"><span style={{ width: `${current.length}%` }} /></div><div className="cycle-note"><Clock3 size={16} />รอบใหม่เริ่มเวลา 06:00 น.</div></section>
      </section>

      {notice && <div className="success-banner"><div className="success-icon"><Check size={22} /></div><div><strong>{notice}</strong><p>จัดเก็บในเครื่องนี้แล้ว และตรวจสอบซ้ำได้อีก 10 วัน</p></div><button aria-label="ปิดการแจ้งเตือน" onClick={() => setNotice(null)}><X size={19} /></button></div>}

      <section className="manual-panel"><div className="panel-heading"><div className="panel-icon"><ScanLine size={19} /></div><div><div className="section-kicker">02 · MANUAL FALLBACK</div><p>กรณีไม่ต้องการถ่ายรูป ให้พิมพ์เลข 4 ตัวท้าย</p></div></div><form onSubmit={async (e) => { e.preventDefault(); await addEntry(manual); }}><input value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" maxLength={4} placeholder="เช่น 1234" aria-label="เลข 4 ตัวท้ายบัตร" /><button type="submit"><Check size={17} />บันทึกมือ</button></form></section>

      <section className="backup-panel"><div className="panel-heading"><div className="panel-icon"><Archive size={19} /></div><div><div className="section-kicker">03 · FREE BACKUP</div><p>ดาวน์โหลดไปเก็บใน Google Drive หรือเปิด CSV ด้วย Google Sheets</p></div><div className="backup-readout">LOCAL<br /><strong>READY</strong></div></div><div className="backup-actions"><button onClick={exportCsv}><FileSpreadsheet size={16} />CSV / Sheets</button><button onClick={exportJson}><FileJson size={16} />JSON</button><button onClick={exportImage}><ImageIcon size={16} />รูปภาพ</button><button onClick={share}><Share2 size={16} />แชร์ข้อมูล</button></div></section>

      <section className="history-card"><div className="history-head"><div><div className="title-row"><span className="signal-dot" /><h2>ประวัติสิทธิ์วันเกิด</h2></div><p>ย้อนหลัง 10 วัน · แตะที่รูปเพื่อขยาย</p></div><div className="count-badge">{current.length} / 100 วันนี้</div></div>{entries.length === 0 ? <div className="empty-state"><img src={`${assetBase}assets/dna-pub-empty-state.webp`} alt="ยังไม่มีข้อมูล" /><strong>ยังไม่มีข้อมูลในรอบ 10 วัน</strong><p>เริ่มจากการถ่ายรูปหรือบันทึกเลขท้ายบัตรด้านบน</p></div> : <div className="entry-list">{entries.map((e) => <article className="entry-row" key={e.id}>{e.image ? <button className="thumb" onClick={() => setPreview(e.image!)}><img src={e.image} alt="ภาพหลักฐานวันเกิด" /></button> : <div className="thumb-placeholder"><Database size={17} /></div>}<div><strong>•••• {e.last4}</strong><p>{formatTime(e.createdAt)} น. · {e.createdAt.slice(0, 10)}</p></div><button className="delete" aria-label="ลบรายการ" onClick={() => setEntries((all) => all.filter((x) => x.id !== e.id))}><Trash2 size={16} /></button></article>)}</div>}<footer className="storage-note"><Sparkles size={15} />จัดเก็บภายในเบราว์เซอร์ของอุปกรณ์นี้</footer></section>
    </div>
    {preview && <div className="image-modal" role="dialog" aria-modal="true" onClick={() => setPreview(null)}><button onClick={() => setPreview(null)} aria-label="ปิด"><X /></button><img src={preview} alt="ภาพที่เลือก" onClick={(e) => e.stopPropagation()} /></div>}
  </main>;
}
