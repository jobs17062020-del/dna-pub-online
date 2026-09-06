ข้อสรุปจากเอกสาร Firebase ทางการ ณ 2026-09-06

Firebase Spark plan ระบุว่าไม่ต้องใช้ payment method และ Cloud Firestore มีโควตาฟรี 1 GiB, document reads 50,000 ต่อวัน, writes 20,000 ต่อวัน, deletes 20,000 ต่อวัน และ outbound transfer 10 GiB ต่อเดือน ตามหน้า pricing และ Firestore quotas.

Firestore มี free quota แต่ managed backup/restore, PITR, TTL deletes และ clone operations ไม่รวมใน free usage และอาจต้องเปิด billing. ดังนั้นระบบนี้ควรทำ application-level backup/restore ด้วยเอกสารข้อมูลของเราเอง แทนการพึ่ง managed restore.

เอกสาร Security Rules แนะนำให้ใช้ Firebase Authentication ร่วมกับ Firestore Security Rules และเตือนว่า allow all ไม่ควรใช้ใน production. Rules ต้องจำกัดผู้ใช้และเส้นทางข้อมูล.

เอกสาร web setup ระบุว่าต้องสร้าง Firebase project, register web app, รับ firebase configuration object และติดตั้ง Firebase JS SDK แบบ modular ผ่าน package manager.

แหล่งอ้างอิง:
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/firestore/quotas
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/web/setup
