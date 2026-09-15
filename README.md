# DNA Staff Schedule V6

ระบบจัดตารางวันหยุดและวันลา **DNA Staff Workspace V6** สำหรับวางแผนกำลังคนร่วมกัน พร้อมการซิงก์ข้อมูลแบบเรียลไทม์ผ่าน Firebase เมื่อกำหนดค่า Firebase ครบถ้วน

## ลิงก์สำคัญ

- **เว็บไซต์ที่ใช้งานอยู่ (Manus):** https://dnastaffsche-bpt8p435.manus.space
- **Repository:** https://github.com/jobs17062020-del/dna-pub-online
- **GitHub Pages:** https://jobs17062020-del.github.io/dna-pub-online/

> เว็บไซต์ Manus ด้านบนเป็นลิงก์ต้นฉบับที่บันทึกไว้ตามที่ผู้ดูแลโครงการระบุ ส่วน GitHub Pages เป็นช่องทางสำรองที่ workflow ใน repository นี้เตรียมไว้สำหรับเผยแพร่จาก branch `main`

## ความสามารถหลัก

- จัดตาราง **OFF** และ **ลา** รายวันสำหรับพนักงานหลายคน
- แสดงโควต้าต่อวันและจำนวนคนทำงานแบบสรุป
- เลือกเดือนและปีเพื่อดูหรือจัดการตาราง
- ระบบผู้ใช้งานและการอนุมัติคำขอโดยกัปตัน
- รองรับการซิงก์ข้อมูลแบบเรียลไทม์ผ่าน Firebase Realtime Database
- มีการสำรองข้อมูลในเครื่องเพื่อช่วยให้ใช้งานต่อได้เมื่อยังไม่ได้ตั้งค่า Firebase
- รองรับการติดตั้งเป็นเว็บแอปผ่านไฟล์ manifest และ service worker ในโฟลเดอร์ `original/`

## เริ่มต้นใช้งานในเครื่อง

ต้องใช้ Node.js 22 และ pnpm 10.4.1 หรือเวอร์ชันที่เข้ากันได้

```bash
pnpm install --frozen-lockfile
pnpm dev
```

จากนั้นเปิด URL ที่ Vite แสดงใน terminal

## การตั้งค่า Firebase

คัดลอกไฟล์ตัวอย่าง environment แล้วกรอกค่าการตั้งค่า Firebase ในเครื่อง:

```bash
cp .env.example .env
```

ดูรายละเอียดเพิ่มเติมใน [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) โดยไฟล์ `.env` ถูกกันออกจาก Git ด้วย `.gitignore` และไม่ควร commit คีย์หรือข้อมูลลับลง repository

## ตรวจสอบและ build

```bash
pnpm check
pnpm exec vite build
```

## การเผยแพร่ผ่าน GitHub Pages

ไฟล์ [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) จะ build และเผยแพร่โดยอัตโนมัติเมื่อมีการ push ไปยัง branch `main` หรือเมื่อสั่ง workflow ด้วยตนเองจากแท็บ **Actions** ของ GitHub

โปรเจกต์นี้ใช้ GitHub Pages แบบ workflow และตั้งค่า URL ที่เผยแพร่ไว้เป็น:

https://jobs17062020-del.github.io/dna-pub-online/

## โครงสร้างโครงการโดยย่อ

- `client/` — React frontend และหน้าเว็บหลัก
- `server/` — server entrypoint สำหรับการ build แบบเต็ม
- `shared/` — ค่าคงที่และโค้ดที่ใช้ร่วมกัน
- `original/` — ไฟล์เว็บ baseline, manifest และ service worker
- `database.rules.json` — กติกาการเข้าถึงฐานข้อมูล Firebase
- `.github/workflows/` — workflow สำหรับ GitHub Pages

## License

MIT
