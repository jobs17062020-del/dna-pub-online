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

type Entry = { id: string; last5: string; legacy?: boolean; image?: string; imageHash?: string; createdAt: string };
const STORAGE_KEY = "dna-pub-vip-records";
const LEGACY_STORAGE_KEYS = ["dna-pub-vip-records-v3", "dna-pub-vip-records-v2"];
const BACKUP_STORAGE_KEY = "dna-pub-vip-records-backup";
const RETENTION_WINDOW_MS = 100 * 24 * 60 * 60 * 1000;
const assetBase = import.meta.env.BASE_URL;
const isWithinRetention = (entry: Entry) => Date.now() - new Date(entry.createdAt).getTime() <= RETENTION_WINDOW_MS;
const normalizeEntries = (raw: unknown, forceLegacy = false): Entry[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const sourceLast5 = typeof source.last5 === "string" ? source.last5 : typeof source.last4 === "string" ? source.last4 : "";
    const last5 = sourceLast5.replace(/\D/g, "");
    const createdAt = typeof source.createdAt === "string" ? source.createdAt : "";
    if (!last5 || !createdAt || Number.isNaN(new Date(createdAt).getTime())) return [];
    return [{
      id: typeof source.id === "string" ? source.id : crypto.randomUUID(),
      last5: last5.slice(-5),
      legacy: forceLegacy || source.last5 === undefined || source.legacy === true,
      image: typeof source.image === "string" ? source.image : undefined,
      imageHash: typeof source.imageHash === "string" ? source.imageHash : undefined,
      createdAt,
    }];
  });
};
const mergeEntries = (...groups: Entry[][]) => Array.from(new Map(groups.flat().map((entry) => [entry.id, entry])).values());
const cycleKey = (value: Date = new Date()) => {
  const cycleDate = new Date(value);
  if (cycleDate.getHours() < 6) cycleDate.setDate(cycleDate.getDate() - 1);
  const year = cycleDate.getFullYear();
  const month = String(cycleDate.getMonth() + 1).padStart(2, "0");
  const day = String(cycleDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const millisecondsUntilNextCycle = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(6, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  return Math.max(1, next.getTime() - now.getTime());
};
const formatTime = (iso: string) => new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
let successAudioContext: AudioContext | null = null;
const playSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    successAudioContext ||= new AudioContextClass();
    const context = successAudioContext;
    void context.resume();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(1174.66, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.32);
  } catch {
    // เสียงเป็นส่วนเสริม หากอุปกรณ์หรือเบราว์เซอร์ไม่รองรับให้ทำงานต่อได้ตามปกติ
  }
};
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
  const [hydrated, setHydrated] = useState(false);
  const [manual, setManual] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);
  const [today, setToday] = useState(cycleKey);

  useEffect(() => {
    try {
      const currentEntries = normalizeEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
      const legacyEntries = LEGACY_STORAGE_KEYS.flatMap((key) => normalizeEntries(JSON.parse(localStorage.getItem(key) || "[]"), key.endsWith("v2")));
      const merged = mergeEntries(currentEntries, legacyEntries);
      if (legacyEntries.length > 0) {
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), entries: merged }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      setEntries(merged.filter(isWithinRetention));
    } catch { setEntries([]); }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }, [entries, hydrated]);
  useEffect(() => {
    let timeout: number | undefined;
    const scheduleNextCycle = () => {
      timeout = window.setTimeout(() => {
        setToday(cycleKey());
        scheduleNextCycle();
      }, millisecondsUntilNextCycle());
    };
    scheduleNextCycle();
    return () => { if (timeout !== undefined) window.clearTimeout(timeout); };
  }, []);

  const recent = useMemo(() => entries.filter(isWithinRetention), [entries]);
  const current = useMemo(() => recent.filter((e) => cycleKey(new Date(e.createdAt)) === today), [recent, today]);
  const addEntry = async (last5: string, image?: string, imageHash?: string) => {
    const value = last5.replace(/\D/g, "").slice(-5);
    if (value.length !== 5) { toast.error("กรุณาระบุเลข 5 ตัวท้ายให้ครบ"); return false; }
    if (current.length >= 100) { toast.error("รอบนี้ครบ 100 เคสแล้ว"); return false; }
    if (recent.some((entry) => entry.last5 === value)) { toast.error(`บันทึกไม่ได้: เลข ${value} มีอยู่แล้วภายใน 100 วัน`); return false; }
    const resolvedHash = imageHash || (image ? await fingerprintImage(image) : undefined);
    if (resolvedHash) {
      for (const entry of recent.filter((item) => item.image)) {
        const existingHash = entry.imageHash || await fingerprintImage(entry.image!);
        if (existingHash === resolvedHash) { toast.error("บันทึกไม่ได้: ภาพนี้มีอยู่แล้วภายใน 100 วัน"); return false; }
      }
    }
    const next = { id: crypto.randomUUID(), last5: value, image, imageHash: resolvedHash, createdAt: new Date().toISOString() };
    setEntries((all) => [next, ...all]); setManual(""); setNotice(`บันทึกข้อมูลสำเร็จ เวลา ${formatTime(next.createdAt)} น.`); playSuccessSound(); toast.success("บันทึกข้อมูลสำเร็จ");
    window.setTimeout(() => setNotice(null), 4800);
    return true;
  };
  const scan = async (file: File) => {
    try {
      const image = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(new Error("อ่านไฟล์ภาพไม่สำเร็จ")); r.readAsDataURL(file); });
      const imageHash = await fingerprintImage(image);
      const duplicateImage = recent.some((entry) => entry.imageHash === imageHash);
      if (duplicateImage) { toast.error("บันทึกไม่ได้: ภาพนี้มีอยู่แล้วภายใน 100 วัน"); return; }
      let found = "";
      const engine = (window as typeof window & { Tesseract?: { recognize: (img: string, lang: string) => Promise<{ data: { text: string } }> } }).Tesseract;
      if (engine) { try { const result = await engine.recognize(image, "eng"); found = result.data.text.replace(/\D/g, "").slice(-5); } catch { /* manual fallback below */ } }
      if (found.length === 5) await addEntry(found, image, imageHash); else { setPreview(image); toast.info("อ่านเลขไม่ครบ กรุณาตรวจสอบแล้วกรอกเลข 5 ตัวท้ายด้วยตนเอง"); }
    } catch { toast.error("เกิดข้อผิดพลาด: ไม่สามารถอ่านหรือประมวลผลภาพนี้ได้"); }
  };
  const exportCsv = () => download(["เลขท้าย,เวลา\n", ...recent.map((e) => `${e.last5},${new Date(e.createdAt).toLocaleString("th-TH")}`)].join("\n"), `dna-pub-${today}.csv`, "text/csv;charset=utf-8");
  const exportJson = () => download(JSON.stringify(recent, null, 2), `dna-pub-${today}.json`, "application/json");
  const exportBackup = () => download(JSON.stringify({ app: "DNA PUB", version: 3, exportedAt: new Date().toISOString(), entries }, null, 2), `dna-pub-backup-${today}.json`, "application/json");
  const restoreBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        const imported = normalizeEntries(Array.isArray(payload) ? payload : payload.entries);
        if (imported.length === 0) throw new Error("empty");
        setEntries((all) => mergeEntries(imported, all));
        toast.success(`กู้คืนข้อมูลแล้ว ${imported.length} รายการ`);
      } catch { toast.error("กู้คืนไม่สำเร็จ: ไฟล์สำรองไม่ถูกต้อง"); }
    };
    reader.onerror = () => toast.error("กู้คืนไม่สำเร็จ: อ่านไฟล์ไม่ได้");
    reader.readAsText(file);
  };
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
        <section className="scan-card">
          <div className="scan-art"><ScanLine size={28} /><span className="scan-motif">DNA</span></div><div className="section-kicker">01 · SCAN & SAVE</div><h2>เพิ่มภาพวันเกิด</h2><p>เลือกได้ทั้งถ่ายภาพใหม่หรือเลือกรูปจากเครื่อง ระบบจะพยายามอ่านเลข 5 ตัวท้ายให้อัตโนมัติ</p><div className="scan-actions"><button type="button" className="scan-action scan-action-primary" onClick={() => cameraRef.current?.click()}><Camera size={16} />ถ่ายภาพ</button><button type="button" className="scan-action" onClick={() => fileRef.current?.click()}><Upload size={16} />เลือกรูปจากเครื่อง</button></div><input ref={cameraRef} id="camera-photo" type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && scan(e.target.files[0])} /><input ref={fileRef} id="birth-photo" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && scan(e.target.files[0])} />
        </section>
        <section className="monitor-card"><div className="card-head"><div><div className="section-kicker">SHIFT MONITOR</div><p>บันทึกแล้วในรอบนี้</p></div><Database size={22} /></div><div className="countline"><strong>{current.length}</strong><span>/ 100 เคส</span></div><div className="progress"><span style={{ width: `${current.length}%` }} /></div><div className="cycle-note"><Clock3 size={16} />รอบใหม่เริ่มเวลา 06:00 น.</div></section>
      </section>

      {notice && <div className="success-banner"><div className="success-icon"><Check size={22} /></div><div><strong>{notice}</strong><p>จัดเก็บในเครื่องนี้แล้ว และตรวจสอบซ้ำได้อีก 10 วัน</p></div><button aria-label="ปิดการแจ้งเตือน" onClick={() => setNotice(null)}><X size={19} /></button></div>}

      <section className="manual-panel"><div className="panel-heading"><div className="panel-icon"><ScanLine size={19} /></div><div><div className="section-kicker">02 · MANUAL FALLBACK</div><p>กรณีไม่ต้องการถ่ายรูป ให้พิมพ์เลข 5 ตัวท้าย</p></div></div><form onSubmit={async (e) => { e.preventDefault(); await addEntry(manual); }}><input value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" maxLength={5} placeholder="เช่น 12345" aria-label="เลข 5 ตัวท้ายบัตร" /><button type="submit"><Check size={17} />บันทึกมือ</button></form></section>

      <section className="backup-panel"><div className="panel-heading"><div className="panel-icon"><Archive size={19} /></div><div><div className="section-kicker">03 · FREE BACKUP</div><p>สำรองข้อมูลไว้ก่อนอัปเดต หรือดาวน์โหลดไปเก็บใน Google Drive</p></div><div className="backup-readout">LOCAL<br /><strong>READY</strong></div></div><div className="backup-actions"><button onClick={exportBackup}><Download size={16} />สำรองข้อมูล</button><button onClick={() => backupRef.current?.click()}><Upload size={16} />กู้คืนข้อมูล</button><button onClick={exportCsv}><FileSpreadsheet size={16} />CSV / Sheets</button><button onClick={exportJson}><FileJson size={16} />JSON</button><button onClick={exportImage}><ImageIcon size={16} />รูปภาพ</button><button onClick={share}><Share2 size={16} />แชร์ข้อมูล</button></div><input ref={backupRef} type="file" accept="application/json,.json" onChange={(e) => { const file = e.target.files?.[0]; if (file) restoreBackup(file); e.currentTarget.value = ""; }} /></section>

      <section className="history-card"><div className="history-head"><div><div className="title-row"><span className="signal-dot" /><h2>ประวัติสิทธิ์วันเกิด</h2></div><p>ย้อนหลัง 100 วัน · แตะที่รูปเพื่อขยาย</p></div><div className="count-badge">{current.length} / 100 วันนี้</div></div>{recent.length === 0 ? <div className="empty-state"><img src={`${assetBase}assets/dna-pub-empty-state.webp`} alt="ยังไม่มีข้อมูล" /><strong>ยังไม่มีข้อมูลย้อนหลัง 100 วัน</strong><p>เริ่มจากการถ่ายรูปหรือบันทึกเลขท้ายบัตรด้านบน</p></div> : <div className="entry-list">{recent.map((e) => <article className="entry-row" key={e.id}>{e.image ? <button className="thumb" onClick={() => setPreview(e.image!)}><img src={e.image} alt="ภาพหลักฐานวันเกิด" /></button> : <div className="thumb-placeholder"><Database size={17} /></div>}<div><strong>{e.legacy ? "••••" : "•••••"} {e.last5}</strong><p>{formatTime(e.createdAt)} น. · {e.createdAt.slice(0, 10)}</p></div><button className="delete" aria-label={`ลบรายการเลข ${e.last5}`} onClick={() => { if (window.confirm(`ยืนยันการลบรายการเลข ${e.last5} ใช่หรือไม่?`)) { setEntries((all) => all.filter((x) => x.id !== e.id)); toast.success("ลบรายการแล้ว"); } else toast.info("ยกเลิกการลบแล้ว"); }}><Trash2 size={16} /></button></article>)}</div>}<footer className="storage-note"><Sparkles size={15} />จัดเก็บภายในเบราว์เซอร์ของอุปกรณ์นี้ · ตรวจซ้ำย้อนหลัง 100 วัน</footer></section>
    </div>
    {preview && <div className="image-modal" role="dialog" aria-modal="true" onClick={() => setPreview(null)}><button onClick={() => setPreview(null)} aria-label="ปิด"><X /></button><img src={preview} alt="ภาพที่เลือก" onClick={(e) => e.stopPropagation()} /></div>}
  </main>;
}
