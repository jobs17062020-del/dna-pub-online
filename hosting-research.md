# โฮสต์อิสระสำหรับ DNA PUB

เว็บไซต์ DNA PUB เวอร์ชันปัจจุบันเป็น static React/Vite ที่เก็บข้อมูลใน localStorage และไม่ต้องมี backend สำหรับฟังก์ชันหลัก จึงเหมาะกับ static hosting มากกว่า VM หรือบริการรัน process ตลอดเวลา

Cloudflare Pages ระบุว่าสามารถ deploy เว็บไซต์ static HTML ได้จาก repository และมีแนวทาง deploy แบบ static โดยตรง: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

GitHub Pages ระบุว่าเป็นบริการ static hosting ที่นำ HTML, CSS และ JavaScript จาก repository ไปเผยแพร่ และใช้งานได้กับ public repository บน GitHub Free: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

ข้อสรุป: การย้ายออกจาก Manus ไปโฮสต์ฟรีทำได้สำหรับเว็บนี้ แต่ต้องมีบัญชี/สิทธิ์ของผู้ใช้ในบริการปลายทาง และลิงก์จะเป็นโดเมนของบริการนั้น การใช้คำว่า “ถาวร” หมายถึงตราบใดที่บัญชียังอยู่ โครงการยังเปิดใช้งาน และเงื่อนไข free tier ของผู้ให้บริการยังไม่เปลี่ยน การเก็บข้อมูลแบบ localStorage ยังผูกกับ browser/device เดิม ไม่ใช่ฐานข้อมูลออนไลน์กลาง
