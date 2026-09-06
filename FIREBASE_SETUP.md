# การเปิดใช้ Cloud Backup ของ DNA PUB แบบ Firebase Spark Plan

ระบบนี้รองรับการเก็บข้อมูลในเครื่องเดิมเหมือนเดิม และเพิ่มการสำรองข้อมูลขึ้น Firebase Realtime Database เมื่อผู้ใช้เข้าสู่ระบบสำเร็จ การตั้งค่านี้ใช้ Firebase Web App configuration ซึ่งเป็นค่าฝั่ง client ไม่ใช่ private key ของ Firebase Admin

## 1. สร้าง Firebase project

เข้า [Firebase Console](https://console.firebase.google.com/) แล้วสร้าง project ใหม่ จากนั้นเพิ่ม Web app ใน Project settings > Your apps > Web app ตามคู่มือทางการ [Firebase Web setup](https://firebase.google.com/docs/web/setup)

## 2. เปิด Email/Password Authentication

ไปที่ Authentication > Sign-in method แล้วเปิดใช้งาน Email/Password ผู้ใช้แต่ละอุปกรณ์ควรเข้าสู่ระบบด้วยบัญชีเดียวกันของทีมงานเดียวกัน

## 3. สร้าง Realtime Database

ไปที่ Realtime Database > Create Database เลือกตำแหน่งที่ต้องการ และเริ่มต้นด้วยกฎที่ปฏิเสธการเข้าถึง จากนั้นนำเนื้อหาใน `database.rules.json` ไปวางใน Rules แล้วกด Publish กฎนี้อนุญาตเฉพาะผู้ใช้ที่เข้าสู่ระบบ และตรวจว่าเขียนข้อมูลพร้อม UID ของผู้ใช้ที่เข้าสู่ระบบเท่านั้น

## 4. ใส่ Web App config

คัดลอก `.env.example` เป็น `.env.local` แล้วกรอกค่าจาก Project settings > Your apps > SDK setup and configuration โดยต้องกรอก `VITE_FIREBASE_DATABASE_URL` ให้ตรงกับ URL ของ Realtime Database และกำหนด `VITE_FIREBASE_WORKSPACE_ID` ให้เหมือนกันทุกอุปกรณ์

ไม่ควรใส่ Firebase Admin SDK private key, service account JSON หรือ credential ลับลงในไฟล์เว็บหรือ GitHub

## 5. การทำงานในหน้าเว็บ

เมื่อยังไม่ตั้งค่า Firebase ระบบจะทำงานแบบ local ได้ตามเดิม เมื่อกรอกค่า config และ deploy แล้ว ให้สร้างบัญชีหรือเข้าสู่ระบบในส่วน Cloud Backup ระบบจะรับข้อมูล Cloud แบบ realtime และสำรองข้อมูลรายการขึ้น Cloud เมื่อข้อมูลเปลี่ยนแปลง นอกจากนี้ยังมีปุ่มสำรอง/กู้คืน JSON เป็นวิธีสำรองชั้นที่สอง

การกู้คืนจาก Cloud เป็น application-level restore ของรายการที่เก็บไว้ใน Realtime Database ไม่ใช่ Firebase managed backup/restore ซึ่งเป็นฟีเจอร์แยกและอาจมีเงื่อนไขด้าน billing ตามเอกสาร quota ของ Firestore/Firebase

## ข้อจำกัดของแผนฟรี

ควรติดตามโควตาใน Firebase Console โดยเอกสารทางการระบุโควตาฟรีของ Firestore และบริการที่มีข้อจำกัดตามแผน รวมถึงเงื่อนไขการคิดค่าบริการของบริการที่ไม่อยู่ใน Spark plan โปรดตรวจสอบ [Firebase Pricing](https://firebase.google.com/pricing) และ [Firestore quotas](https://firebase.google.com/docs/firestore/quotas) ก่อนเพิ่มปริมาณข้อมูลหรือผู้ใช้จำนวนมาก

## แหล่งอ้างอิง

- [Add Firebase to your JavaScript project](https://firebase.google.com/docs/web/setup)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firestore usage and limits](https://firebase.google.com/docs/firestore/quotas)
- [Get started with Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
